/**
 * FINOVATE ERP X - Purchasing Module
 * Phase 07: Purchasing & Procurement System
 * Developer: Ahmed Mostafa Ibrahim
 */

const PurchasingModule = {
  // Purchase statuses
  STATUSES: {
    DRAFT: 'draft',
    REQUEST: 'purchase_request',
    RFQ: 'rfq',
    ORDER: 'purchase_order',
    RECEIVED: 'goods_received',
    INVOICE: 'purchase_invoice',
    PAID: 'paid',
    CANCELLED: 'cancelled'
  },

  // Initialize module
  async init() {
    console.log('Purchasing Module: Initializing...');
    await this.loadPurchases();
    return { status: 'success' };
  },

  // Get all purchases
  async getAllPurchases(companyId = null, filters = {}) {
    const searchFilters = {};
    if (companyId) searchFilters.companyId = companyId;
    Object.assign(searchFilters, filters);

    const purchases = await DBService.find('Purchases', searchFilters);
    return purchases.filter(p => p.status !== 'deleted');
  },

  // Get purchase by ID
  async getPurchase(purchaseId) {
    return DBService.findOne('Purchases', 'id', purchaseId);
  },

  // Get purchase by order number
  async getPurchaseByOrderNumber(orderNumber) {
    return DBService.findOne('Purchases', 'orderNumber', orderNumber);
  },

  // Generate order number
  generateOrderNumber(companyId, branchId) {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `PO-${year}-${month}-${random}`;
  },

  // Create new purchase
  async createPurchase(data) {
    const currentUser = AuthModule.getCurrentUser();
    const currentCompany = CompaniesModule.getCurrentCompany();
    const currentBranch = CompaniesModule.getCurrentBranch();

    if (!currentCompany) {
      return { status: 'error', message: 'No company selected' };
    }

    // Validate supplier
    if (!data.supplierId) {
      return { status: 'error', message: 'Supplier is required' };
    }

    // Validate items
    if (!data.items || data.items.length === 0) {
      return { status: 'error', message: 'At least one item is required' };
    }

    // Calculate totals
    const calculations = this.calculateTotals(data.items, data.taxRate || 0);

    const purchaseData = {
      id: DBService.generateId('PUR'),
      companyId: currentCompany.id,
      branchId: currentBranch?.id || null,
      supplierId: data.supplierId,
      orderNumber: data.orderNumber || this.generateOrderNumber(currentCompany.id, currentBranch?.id),
      date: data.date || new Date().toISOString(),
      dueDate: data.dueDate || null,
      expectedDeliveryDate: data.expectedDeliveryDate || null,
      subtotal: calculations.subtotal,
      taxAmount: calculations.taxAmount,
      total: calculations.total,
      receivedAmount: 0,
      status: data.status || this.STATUSES.DRAFT,
      currency: data.currency || currentCompany.currency || 'USD',
      notes: data.notes || '',
      createdBy: currentUser?.id,
      createdAt: new Date().toISOString()
    };

    // Insert purchase record
    const result = await DBService.insert('Purchases', purchaseData);

    if (result.status === 'success') {
      // Insert purchase items
      const itemsResult = await this.createPurchaseItems(result.id, data.items);

      if (itemsResult.status === 'success') {
        return { status: 'success', id: result.id, orderNumber: purchaseData.orderNumber };
      }
    }

    return result;
  },

  // Create purchase items
  async createPurchaseItems(purchaseId, items) {
    const batchResults = [];

    for (const item of items) {
      const itemData = {
        id: DBService.generateId('PI'),
        purchaseId: purchaseId,
        productId: item.productId,
        quantity: item.quantity,
        receivedQuantity: 0,
        unitPrice: item.unitPrice,
        taxRate: item.taxRate || 0,
        total: item.quantity * item.unitPrice
      };

      const result = await DBService.insert('PurchaseItems', itemData);
      batchResults.push(result);
    }

    return { status: 'success', items: batchResults };
  },

  // Calculate totals
  calculateTotals(items, taxRate = 0) {
    let subtotal = 0;

    for (const item of items) {
      subtotal += item.quantity * item.unitPrice;
    }

    const taxAmount = subtotal * (taxRate / 100);
    const total = subtotal + taxAmount;

    return {
      subtotal: parseFloat(subtotal.toFixed(2)),
      taxAmount: parseFloat(taxAmount.toFixed(2)),
      total: parseFloat(total.toFixed(2))
    };
  },

  // Update purchase status
  async updatePurchaseStatus(purchaseId, newStatus) {
    const purchase = await this.getPurchase(purchaseId);
    if (!purchase) {
      return { status: 'error', message: 'Purchase not found' };
    }

    const validTransitions = {
      [this.STATUSES.DRAFT]: [this.STATUSES.REQUEST, this.STATUSES.CANCELLED],
      [this.STATUSES.REQUEST]: [this.STATUSES.RFQ, this.STATUSES.CANCELLED],
      [this.STATUSES.RFQ]: [this.STATUSES.ORDER, this.STATUSES.CANCELLED],
      [this.STATUSES.ORDER]: [this.STATUSES.RECEIVED, this.STATUSES.CANCELLED],
      [this.STATUSES.RECEIVED]: [this.STATUSES.INVOICE],
      [this.STATUSES.INVOICE]: [this.STATUSES.PAID],
      [this.STATUSES.PAID]: [],
      [this.STATUSES.CANCELLED]: []
    };

    if (!validTransitions[purchase.status]?.includes(newStatus)) {
      return {
        status: 'error',
        message: `Cannot transition from ${purchase.status} to ${newStatus}`
      };
    }

    const result = await DBService.update('Purchases', 'id', purchaseId, {
      status: newStatus,
      updatedAt: new Date().toISOString()
    });

    return result;
  },

  // Receive goods
  async receiveGoods(purchaseId, receivedItems) {
    const purchase = await this.getPurchase(purchaseId);
    if (!purchase) {
      return { status: 'error', message: 'Purchase not found' };
    }

    if (purchase.status !== this.STATUSES.ORDER) {
      return { status: 'error', message: 'Can only receive goods for confirmed orders' };
    }

    // Update purchase items with received quantities
    for (const receivedItem of receivedItems) {
      const purchaseItem = await DBService.findOne('PurchaseItems', 'purchaseId', purchaseId);
      if (purchaseItem && purchaseItem.productId === receivedItem.productId) {
        await DBService.update('PurchaseItems', 'id', purchaseItem.id, {
          receivedQuantity: receivedItem.quantity,
          receivedAt: new Date().toISOString()
        });

        // Update inventory
        await this.updateInventory(receivedItem.productId, receivedItem.quantity, 'in');
      }
    }

    // Update purchase status
    await this.updatePurchaseStatus(purchaseId, this.STATUSES.RECEIVED);

    return { status: 'success' };
  },

  // Update inventory after receiving goods
  async updateInventory(productId, quantity, direction = 'in') {
    const product = await ProductsModule.getProduct(productId);
    if (!product) return;

    const stock = await DBService.findOne('Stock', 'productId', productId);

    if (stock) {
      const newQuantity = direction === 'in'
        ? stock.quantity + quantity
        : stock.quantity - quantity;

      await DBService.update('Stock', 'id', stock.id, {
        quantity: newQuantity,
        availableQty: newQuantity - (stock.reservedQty || 0),
        lastUpdated: new Date().toISOString()
      });
    } else {
      // Create new stock record
      await DBService.insert('Stock', {
        id: DBService.generateId('STK'),
        productId: productId,
        warehouseId: product.defaultWarehouseId || 'MAIN',
        quantity: quantity,
        reservedQty: 0,
        availableQty: quantity,
        lastUpdated: new Date().toISOString()
      });
    }
  },

  // Create purchase invoice
  async createInvoice(purchaseId, invoiceData) {
    const purchase = await this.getPurchase(purchaseId);
    if (!purchase) {
      return { status: 'error', message: 'Purchase not found' };
    }

    if (purchase.status !== this.STATUSES.RECEIVED) {
      return { status: 'error', message: 'Goods must be received before invoicing' };
    }

    const invoiceRecord = {
      id: DBService.generateId('PINV'),
      purchaseId: purchaseId,
      companyId: purchase.companyId,
      supplierId: purchase.supplierId,
      invoiceNumber: invoiceData.invoiceNumber,
      date: invoiceData.date || new Date().toISOString(),
      amount: purchase.total,
      paidAmount: 0,
      status: 'pending',
      createdAt: new Date().toISOString()
    };

    const result = await DBService.insert('PurchaseInvoices', invoiceRecord);

    if (result.status === 'success') {
      await this.updatePurchaseStatus(purchaseId, this.STATUSES.INVOICE);
    }

    return result;
  },

  // Process payment for purchase
  async processPayment(purchaseId, paymentData) {
    const purchase = await this.getPurchase(purchaseId);
    if (!purchase) {
      return { status: 'error', message: 'Purchase not found' };
    }

    const paymentRecord = {
      id: DBService.generateId('PPAY'),
      companyId: purchase.companyId,
      purchaseId: purchaseId,
      supplierId: purchase.supplierId,
      amount: paymentData.amount,
      method: paymentData.method || 'bank_transfer',
      date: paymentData.date || new Date().toISOString(),
      reference: paymentData.reference || '',
      notes: paymentData.notes || ''
    };

    const result = await DBService.insert('PurchasePayments', paymentRecord);

    if (result.status === 'success') {
      // Update purchase paid amount
      const newPaidAmount = (purchase.paidAmount || 0) + paymentData.amount;
      const newStatus = newPaidAmount >= purchase.total ? this.STATUSES.PAID : this.STATUSES.INVOICE;

      await DBService.update('Purchases', 'id', purchaseId, {
        paidAmount: newPaidAmount,
        status: newStatus,
        updatedAt: new Date().toISOString()
      });
    }

    return result;
  },

  // Get purchases by supplier
  async getPurchasesBySupplier(supplierId) {
    return DBService.find('Purchases', { supplierId });
  },

  // Get purchases by date range
  async getPurchasesByDateRange(startDate, endDate, companyId = null) {
    const purchases = await this.getAllPurchases(companyId);
    return purchases.filter(purchase => {
      const purchaseDate = new Date(purchase.date);
      return purchaseDate >= new Date(startDate) && purchaseDate <= new Date(endDate);
    });
  },

  // Get purchasing analytics
  async getPurchasingAnalytics(companyId = null) {
    const purchases = await this.getAllPurchases(companyId);

    const analytics = {
      totalPurchases: 0,
      totalSpent: 0,
      totalPaid: 0,
      totalOutstanding: 0,
      purchasesCount: 0,
      averageOrderValue: 0,
      byStatus: {},
      bySupplier: {}
    };

    purchases.forEach(purchase => {
      if (purchase.status !== this.STATUSES.CANCELLED) {
        analytics.totalPurchases++;
        analytics.totalSpent += purchase.total || 0;
        analytics.totalPaid += purchase.paidAmount || 0;

        analytics.byStatus[purchase.status] = (analytics.byStatus[purchase.status] || 0) + 1;
        analytics.bySupplier[purchase.supplierId] = (analytics.bySupplier[purchase.supplierId] || 0) + 1;
      }
    });

    analytics.totalOutstanding = analytics.totalSpent - analytics.totalPaid;
    analytics.averageOrderValue = analytics.totalPurchases > 0
      ? analytics.totalSpent / analytics.totalPurchases
      : 0;

    return analytics;
  },

  // Load purchases into cache
  async loadPurchases() {
    const currentCompany = CompaniesModule.getCurrentCompany();
    if (currentCompany) {
      await this.getAllPurchases(currentCompany.id);
    }
  },

  // Export purchases to CSV
  exportToCSV(purchases) {
    const headers = ['Order Number', 'Date', 'Supplier', 'Subtotal', 'Tax', 'Total', 'Paid', 'Status'];
    const rows = purchases.map(purchase => [
      purchase.orderNumber,
      purchase.date,
      purchase.supplierName || purchase.supplierId,
      purchase.subtotal,
      purchase.taxAmount,
      purchase.total,
      purchase.paidAmount,
      purchase.status
    ]);

    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
    return csvContent;
  }
};

// Initialize on DOM load
if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => {
    PurchasingModule.init();
  });
}
