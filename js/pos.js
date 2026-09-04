/**
 * FINOVATE ERP X - Point of Sale (POS) Module
 * Phase 06: Sales, POS & Invoicing System
 * Developer: Ahmed Mostafa Ibrahim
 */

const POSModule = {
  // Current session data
  currentSession: null,
  cart: [],
  customer: null,

  // Initialize POS
  async init() {
    console.log('POS Module: Initializing...');
    await this.startSession();
    return { status: 'success' };
  },

  // Start new POS session
  async startSession() {
    const currentUser = AuthModule.getCurrentUser();
    const currentCompany = CompaniesModule.getCurrentCompany();
    const currentBranch = CompaniesModule.getCurrentBranch();

    this.currentSession = {
      id: DBService.generateId('POS'),
      userId: currentUser?.id,
      companyId: currentCompany?.id,
      branchId: currentBranch?.id,
      startTime: new Date().toISOString(),
      endTime: null,
      openingBalance: 0,
      closingBalance: 0,
      totalSales: 0,
      totalCash: 0,
      totalCard: 0,
      totalOther: 0,
      status: 'open'
    };

    this.cart = [];
    this.customer = null;

    return this.currentSession;
  },

  // End POS session
  async endSession(closingData) {
    if (!this.currentSession) {
      return { status: 'error', message: 'No active session' };
    }

    const closingBalance = closingData.cashCount || 0;
    const expectedBalance = this.currentSession.openingBalance + this.currentSession.totalCash;
    const variance = closingBalance - expectedBalance;

    this.currentSession.endTime = new Date().toISOString();
    this.currentSession.closingBalance = closingBalance;
    this.currentSession.status = 'closed';
    this.currentSession.variance = variance;

    // Save session record
    const result = await DBService.insert('POSSessions', this.currentSession);

    if (result.status === 'success') {
      this.currentSession = null;
      this.cart = [];
      this.customer = null;
    }

    return result;
  },

  // Add item to cart
  async addToCart(product, quantity = 1, price = null) {
    const existingItem = this.cart.find(item => item.productId === product.id);

    if (existingItem) {
      existingItem.quantity += quantity;
      existingItem.total = existingItem.quantity * existingItem.unitPrice;
    } else {
      const unitPrice = price || product.sellingPrice || 0;
      this.cart.push({
        productId: product.id,
        sku: product.sku,
        name: product.name,
        barcode: product.barcode,
        quantity: quantity,
        unitPrice: unitPrice,
        taxRate: product.taxRate || 0,
        discount: 0,
        total: quantity * unitPrice
      });
    }

    return this.cart;
  },

  // Remove item from cart
  removeFromCart(productId) {
    this.cart = this.cart.filter(item => item.productId !== productId);
    return this.cart;
  },

  // Update cart item quantity
  updateCartItem(productId, quantity) {
    const item = this.cart.find(item => item.productId === productId);
    if (item) {
      if (quantity <= 0) {
        return this.removeFromCart(productId);
      }
      item.quantity = quantity;
      item.total = quantity * item.unitPrice;
    }
    return this.cart;
  },

  // Clear cart
  clearCart() {
    this.cart = [];
    this.customer = null;
    return this.cart;
  },

  // Set customer for sale
  setCustomer(customer) {
    this.customer = customer;
    return customer;
  },

  // Calculate cart totals
  calculateTotals() {
    let subtotal = 0;
    let totalDiscount = 0;

    this.cart.forEach(item => {
      const itemTotal = item.quantity * item.unitPrice;
      const itemDiscount = itemTotal * (item.discount / 100);
      subtotal += itemTotal;
      totalDiscount += itemDiscount;
    });

    const taxableAmount = subtotal - totalDiscount;
    const taxAmount = taxableAmount * 0.14; // Default 14% tax
    const total = taxableAmount + taxAmount;

    return {
      itemsCount: this.cart.reduce((sum, item) => sum + item.quantity, 0),
      subtotal: parseFloat(subtotal.toFixed(2)),
      discount: parseFloat(totalDiscount.toFixed(2)),
      taxAmount: parseFloat(taxAmount.toFixed(2)),
      total: parseFloat(total.toFixed(2))
    };
  },

  // Apply discount to cart item
  applyItemDiscount(productId, discountPercent) {
    const item = this.cart.find(item => item.productId === productId);
    if (item) {
      item.discount = discountPercent;
      item.total = (item.quantity * item.unitPrice) * (1 - discountPercent / 100);
    }
    return this.cart;
  },

  // Process checkout
  async checkout(paymentData) {
    if (this.cart.length === 0) {
      return { status: 'error', message: 'Cart is empty' };
    }

    const totals = this.calculateTotals();

    const saleData = {
      customerId: this.customer?.id || 'WALK-IN',
      items: this.cart,
      status: SalesModule.STATUSES.INVOICE,
      taxRate: 14,
      discount: 0,
      paidAmount: paymentData.amountPaid || totals.total,
      autoAccounting: false
    };

    // Create sale
    const saleResult = await SalesModule.createSale(saleData);

    if (saleResult.status === 'success') {
      // Record payment
      const paymentResult = await SalesModule.processPayment(saleResult.id, {
        amount: totals.total,
        method: paymentData.method || 'cash',
        reference: paymentData.reference || ''
      });

      if (paymentResult.status === 'success') {
        // Update session totals
        if (this.currentSession) {
          this.currentSession.totalSales++;
          if (paymentData.method === 'cash') {
            this.currentSession.totalCash += totals.total;
          } else if (paymentData.method === 'card') {
            this.currentSession.totalCard += totals.total;
          } else {
            this.currentSession.totalOther += totals.total;
          }
        }

        // Clear cart
        this.clearCart();

        return {
          status: 'success',
          saleId: saleResult.id,
          invoiceNumber: saleResult.invoiceNumber,
          total: totals.total,
          change: paymentData.amountPaid - totals.total
        };
      }
    }

    return saleResult;
  },

  // Search product by barcode
  async searchByBarcode(barcode) {
    const product = await ProductsModule.getProductByBarcode(barcode);
    if (product) {
      return this.addToCart(product, 1);
    }
    return { status: 'error', message: 'Product not found' };
  },

  // Hold order
  async holdOrder(reason) {
    if (this.cart.length === 0) {
      return { status: 'error', message: 'Cart is empty' };
    }

    const heldOrder = {
      id: DBService.generateId('HOLD'),
      sessionId: this.currentSession?.id,
      cart: [...this.cart],
      customer: this.customer,
      reason: reason || '',
      createdAt: new Date().toISOString()
    };

    // Save held order
    await DBService.insert('HeldOrders', heldOrder);

    // Clear cart
    this.clearCart();

    return { status: 'success', orderId: heldOrder.id };
  },

  // Retrieve held order
  async retrieveHeldOrder(orderId) {
    const heldOrder = await DBService.findOne('HeldOrders', 'id', orderId);
    if (heldOrder) {
      this.cart = heldOrder.cart;
      this.customer = heldOrder.customer;

      // Delete held order record
      await DBService.delete('HeldOrders', 'id', orderId);

      return { status: 'success', cart: this.cart };
    }
    return { status: 'error', message: 'Order not found' };
  },

  // Get held orders
  async getHeldOrders() {
    return DBService.find('HeldOrders', {});
  },

  // Print receipt
  printReceipt(saleId) {
    console.log('Printing receipt:', saleId);
    window.open(`#pos/receipt/${saleId}`, '_blank');
  },

  // Quick cash buttons
  quickCash(amount) {
    const totals = this.calculateTotals();
    return totals.total - amount;
  },

  // Keyboard shortcuts handler
  handleKeyboardShortcut(event) {
    const shortcuts = {
      'F1': () => this.searchByBarcode(prompt('Enter barcode:')),
      'F2': () => this.checkout({ method: 'cash', amountPaid: this.calculateTotals().total }),
      'F3': () => this.holdOrder(prompt('Reason for holding:')),
      'F4': () => this.clearCart(),
      'Escape': () => document.getElementById('barcode-input')?.focus()
    };

    if (shortcuts[event.key]) {
      event.preventDefault();
      shortcuts[event.key]();
    }
  }
};

// Initialize on DOM load
if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => {
    POSModule.init();

    // Setup keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      POSModule.handleKeyboardShortcut(e);
    });
  });
}
