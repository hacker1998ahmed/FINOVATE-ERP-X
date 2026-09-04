/**
 * FINOVATE ERP X - Sales Module
 * Phase 06: Sales, POS & Invoicing System
 * Developer: Ahmed Mostafa Ibrahim
 */

const SalesModule = {
  // Sale statuses
  STATUSES: {
    DRAFT: 'draft',
    QUOTATION: 'quotation',
    ORDER: 'sales_order',
    DELIVERY: 'delivery',
    INVOICE: 'invoice',
    PAID: 'paid',
    CANCELLED: 'cancelled',
    RETURNED: 'returned'
  },

  // Initialize module
  async init() {
    console.log('Sales Module: Initializing...');
    await this.loadSales();
    return { status: 'success' };
  },

  // Get all sales records
  async getAllSales(companyId = null, filters = {}) {
    const searchFilters = {};
    if (companyId) searchFilters.companyId = companyId;
    Object.assign(searchFilters, filters);

    const sales = await DBService.find('Sales', searchFilters);
    return sales.filter(s => s.status !== 'deleted');
  },

  // Get sale by ID
  async getSale(saleId) {
    return DBService.findOne('Sales', 'id', saleId);
  },

  // Get sale by invoice number
  async getSaleByInvoiceNumber(invoiceNumber) {
    return DBService.findOne('Sales', 'invoiceNumber', invoiceNumber);
  },

  // Generate invoice number
  generateInvoiceNumber(companyId, branchId) {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `INV-${year}-${month}-${random}`;
  },

  // Create new sale/quotation/invoice
  async createSale(data) {
    const currentUser = AuthModule.getCurrentUser();
    const currentCompany = CompaniesModule.getCurrentCompany();
    const currentBranch = CompaniesModule.getCurrentBranch();

    if (!currentCompany) {
      return { status: 'error', message: 'No company selected' };
    }

    // Validate customer
    if (!data.customerId) {
      return { status: 'error', message: 'Customer is required' };
    }

    // Validate items
    if (!data.items || data.items.length === 0) {
      return { status: 'error', message: 'At least one item is required' };
    }

    // Calculate totals
    const calculations = this.calculateTotals(data.items, data.taxRate || 0, data.discount || 0);

    const saleData = {
      id: DBService.generateId('SAL'),
      companyId: currentCompany.id,
      branchId: currentBranch?.id || null,
      customerId: data.customerId,
      invoiceNumber: data.invoiceNumber || this.generateInvoiceNumber(currentCompany.id, currentBranch?.id),
      date: data.date || new Date().toISOString(),
      dueDate: data.dueDate || null,
      subtotal: calculations.subtotal,
      taxAmount: calculations.taxAmount,
      discountAmount: calculations.discountAmount,
      total: calculations.total,
      paidAmount: data.paidAmount || 0,
      status: data.status || this.STATUSES.DRAFT,
      currency: data.currency || currentCompany.currency || 'USD',
      notes: data.notes || '',
      createdBy: currentUser?.id,
      createdAt: new Date().toISOString()
    };

    // Insert sale record
    const result = await DBService.insert('Sales', saleData);

    if (result.status === 'success') {
      // Insert sale items
      const itemsResult = await this.createSaleItems(result.id, data.items);

      if (itemsResult.status === 'success') {
        // Update inventory if invoice is posted
        if (data.status === this.STATUSES.INVOICE || data.status === this.STATUSES.PAID) {
          await this.updateInventory(data.items, 'out');
        }

        // Create accounting entry
        if (data.autoAccounting !== false) {
          await this.createAccountingEntry(saleData, data.items);
        }

        return { status: 'success', id: result.id, invoiceNumber: saleData.invoiceNumber };
      }
    }

    return result;
  },

  // Create sale items
  async createSaleItems(saleId, items) {
    const batchResults = [];

    for (const item of items) {
      const itemData = {
        id: DBService.generateId('SI'),
        saleId: saleId,
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        taxRate: item.taxRate || 0,
        discount: item.discount || 0,
        total: item.quantity * item.unitPrice
      };

      const result = await DBService.insert('SalesItems', itemData);
      batchResults.push(result);
    }

    return { status: 'success', items: batchResults };
  },

  // Calculate totals
  calculateTotals(items, taxRate = 0, discount = 0) {
    let subtotal = 0;

    for (const item of items) {
      subtotal += item.quantity * item.unitPrice;
    }

    const discountAmount = subtotal * (discount / 100);
    const taxableAmount = subtotal - discountAmount;
    const taxAmount = taxableAmount * (taxRate / 100);
    const total = taxableAmount + taxAmount;

    return {
      subtotal: parseFloat(subtotal.toFixed(2)),
      discountAmount: parseFloat(discountAmount.toFixed(2)),
      taxAmount: parseFloat(taxAmount.toFixed(2)),
      total: parseFloat(total.toFixed(2))
    };
  },

  // Update inventory after sale
  async updateInventory(items, direction = 'out') {
    for (const item of items) {
      const product = await ProductsModule.getProduct(item.productId);
      if (!product) continue;

      const stock = await DBService.findOne('Stock', 'productId', item.productId);

      if (stock) {
        const newQuantity = direction === 'out'
          ? stock.quantity - item.quantity
          : stock.quantity + item.quantity;

        await DBService.update('Stock', 'id', stock.id, {
          quantity: newQuantity,
          availableQty: newQuantity - (stock.reservedQty || 0),
          lastUpdated: new Date().toISOString()
        });
      }
    }
  },

  // Create accounting entry for sale
  async createAccountingEntry(sale, items) {
    // This will be implemented in Accounting module
    console.log('Creating accounting entry for sale:', sale.invoiceNumber);
    return { status: 'success' };
  },

  // Update sale status
  async updateSaleStatus(saleId, newStatus) {
    const sale = await this.getSale(saleId);
    if (!sale) {
      return { status: 'error', message: 'Sale not found' };
    }

    const validTransitions = {
      [this.STATUSES.DRAFT]: [this.STATUSES.QUOTATION, this.STATUSES.CANCELLED],
      [this.STATUSES.QUOTATION]: [this.STATUSES.ORDER, this.STATUSES.CANCELLED],
      [this.STATUSES.ORDER]: [this.STATUSES.DELIVERY, this.STATUSES.CANCELLED],
      [this.STATUSES.DELIVERY]: [this.STATUSES.INVOICE],
      [this.STATUSES.INVOICE]: [this.STATUSES.PAID, this.STATUSES.RETURNED],
      [this.STATUSES.PAID]: [],
      [this.STATUSES.CANCELLED]: [],
      [this.STATUSES.RETURNED]: []
    };

    if (!validTransitions[sale.status]?.includes(newStatus)) {
      return {
        status: 'error',
        message: `Cannot transition from ${sale.status} to ${newStatus}`
      };
    }

    const result = await DBService.update('Sales', 'id', saleId, {
      status: newStatus,
      updatedAt: new Date().toISOString()
    });

    // Update inventory if transitioning to invoice
    if (newStatus === this.STATUSES.INVOICE) {
      const saleItems = await DBService.find('SalesItems', { saleId });
      await this.updateInventory(saleItems, 'out');
    }

    // Update inventory if returning
    if (newStatus === this.STATUSES.RETURNED) {
      const saleItems = await DBService.find('SalesItems', { saleId });
      await this.updateInventory(saleItems, 'in');
    }

    return result;
  },

  // Process payment for sale
  async processPayment(saleId, paymentData) {
    const sale = await this.getSale(saleId);
    if (!sale) {
      return { status: 'error', message: 'Sale not found' };
    }

    const paymentRecord = {
      id: DBService.generateId('PAY'),
      companyId: sale.companyId,
      saleId: saleId,
      customerId: sale.customerId,
      amount: paymentData.amount,
      method: paymentData.method || 'cash',
      date: paymentData.date || new Date().toISOString(),
      reference: paymentData.reference || '',
      notes: paymentData.notes || ''
    };

    const result = await DBService.insert('Payments', paymentRecord);

    if (result.status === 'success') {
      // Update sale paid amount
      const newPaidAmount = (sale.paidAmount || 0) + paymentData.amount;
      const newStatus = newPaidAmount >= sale.total ? this.STATUSES.PAID : this.STATUSES.INVOICE;

      await DBService.update('Sales', 'id', saleId, {
        paidAmount: newPaidAmount,
        status: newStatus,
        updatedAt: new Date().toISOString()
      });
    }

    return result;
  },

  // Get sales by customer
  async getSalesByCustomer(customerId) {
    return DBService.find('Sales', { customerId });
  },

  // Get sales by date range
  async getSalesByDateRange(startDate, endDate, companyId = null) {
    const filters = {
      date: { start: startDate, end: endDate }
    };
    if (companyId) filters.companyId = companyId;

    const sales = await this.getAllSales(companyId, filters);
    return sales.filter(sale => {
      const saleDate = new Date(sale.date);
      return saleDate >= new Date(startDate) && saleDate <= new Date(endDate);
    });
  },

  // Get sales analytics
  async getSalesAnalytics(companyId = null, period = 'month') {
    const sales = await this.getAllSales(companyId);

    const analytics = {
      totalSales: 0,
      totalRevenue: 0,
      totalPaid: 0,
      totalOutstanding: 0,
      salesCount: 0,
      averageOrderValue: 0,
      byStatus: {},
      byCustomer: {},
      trend: []
    };

    sales.forEach(sale => {
      if (sale.status !== this.STATUSES.CANCELLED) {
        analytics.totalSales++;
        analytics.totalRevenue += sale.total || 0;
        analytics.totalPaid += sale.paidAmount || 0;

        // Count by status
        analytics.byStatus[sale.status] = (analytics.byStatus[sale.status] || 0) + 1;

        // Count by customer
        analytics.byCustomer[sale.customerId] = (analytics.byCustomer[sale.customerId] || 0) + 1;
      }
    });

    analytics.totalOutstanding = analytics.totalRevenue - analytics.totalPaid;
    analytics.averageOrderValue = analytics.totalSales > 0
      ? analytics.totalRevenue / analytics.totalSales
      : 0;

    return analytics;
  },

  // Create return
  async createReturn(saleId, returnData) {
    const sale = await this.getSale(saleId);
    if (!sale) {
      return { status: 'error', message: 'Original sale not found' };
    }

    if (sale.status !== this.STATUSES.PAID && sale.status !== this.STATUSES.INVOICE) {
      return { status: 'error', message: 'Can only return paid or invoiced sales' };
    }

    const returnRecord = {
      id: DBService.generateId('RET'),
      originalSaleId: saleId,
      companyId: sale.companyId,
      customerId: sale.customerId,
      date: new Date().toISOString(),
      items: returnData.items,
      reason: returnData.reason || '',
      totalAmount: returnData.totalAmount,
      status: 'pending',
      approvedBy: null
    };

    return DBService.insert('SalesReturns', returnRecord);
  },

  // Load sales into cache
  async loadSales() {
    const currentCompany = CompaniesModule.getCurrentCompany();
    if (currentCompany) {
      await this.getAllSales(currentCompany.id);
    }
  },

  // Export sales to CSV
  exportToCSV(sales) {
    const headers = ['Invoice Number', 'Date', 'Customer', 'Subtotal', 'Tax', 'Discount', 'Total', 'Paid', 'Status'];
    const rows = sales.map(sale => [
      sale.invoiceNumber,
      sale.date,
      sale.customerName || sale.customerId,
      sale.subtotal,
      sale.taxAmount,
      sale.discountAmount,
      sale.total,
      sale.paidAmount,
      sale.status
    ]);

    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
    return csvContent;
  },

  // Print invoice
  printInvoice(saleId) {
    console.log('Printing invoice:', saleId);
    // Implementation for printing invoice
    window.open(`#invoice/${saleId}/print`, '_blank');
  }
};

// Initialize on DOM load
if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => {
    SalesModule.init();
  });
}
