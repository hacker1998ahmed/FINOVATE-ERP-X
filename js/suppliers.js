/**
 * FINOVATE ERP X - Suppliers Module
 * Phase 04: Supplier Relationship Management
 */

const SuppliersModule = {
  // Initialize module
  async init() {
    console.log('Suppliers Module: Initializing...');
    await this.loadSuppliers();
    return { status: 'success' };
  },

  // Get all suppliers
  async getAllSuppliers(companyId = null) {
    const filters = {};
    if (companyId) filters.companyId = companyId;
    
    const suppliers = await DBService.find('Suppliers', filters);
    return suppliers.filter(s => s.status !== 'deleted');
  },

  // Get supplier by ID
  async getSupplier(supplierId) {
    return DBService.findOne('Suppliers', 'id', supplierId);
  },

  // Get supplier by email
  async getSupplierByEmail(email) {
    return DBService.findOne('Suppliers', 'email', email);
  },

  // Create new supplier
  async createSupplier(data) {
    const companyId = CompaniesModule.getCurrentCompany()?.id || data.companyId;
    
    if (!companyId) {
      return { status: 'error', message: 'Company ID is required' };
    }

    // Check if supplier already exists
    const existing = await this.getSupplierByEmail(data.email);
    if (existing) {
      return { status: 'error', message: 'Supplier with this email already exists' };
    }

    const supplierData = {
      id: DBService.generateId('SUP'),
      companyId,
      code: data.code || this.generateSupplierCode(),
      name: data.name,
      email: data.email || '',
      phone: data.phone || '',
      mobile: data.mobile || '',
      fax: data.fax || '',
      website: data.website || '',
      address: data.address || '',
      city: data.city || '',
      state: data.state || '',
      country: data.country || '',
      postalCode: data.postalCode || '',
      taxId: data.taxId || '',
      commercialRecord: data.commercialRecord || '',
      currency: data.currency || 'USD',
      paymentTerms: data.paymentTerms || 30,
      priceList: data.priceList || 'default',
      discount: parseFloat(data.discount) || 0,
      notes: data.notes || '',
      contactPerson: data.contactPerson || '',
      contactEmail: data.contactEmail || '',
      contactPhone: data.contactPhone || '',
      bankName: data.bankName || '',
      bankAccount: data.bankAccount || '',
      bankIban: data.bankIban || '',
      swiftCode: data.swiftCode || '',
      status: 'active',
      type: data.type || 'regular', // regular, preferred, exclusive
      category: data.category || 'general', // manufacturer, distributor, service
      rating: parseInt(data.rating) || 0,
      createdAt: new Date().toISOString(),
      createdBy: AuthModule.currentUser?.email || ''
    };

    const result = await DBService.insert('Suppliers', supplierData);
    
    if (result.status === 'success') {
      await this.logActivity(supplierData.id, 'created', 'Supplier created');
    }
    
    return result;
  },

  // Update supplier
  async updateSupplier(supplierId, data) {
    const supplier = await this.getSupplier(supplierId);
    
    if (!supplier) {
      return { status: 'error', message: 'Supplier not found' };
    }

    // Check email uniqueness if changed
    if (data.email && data.email !== supplier.email) {
      const existing = await this.getSupplierByEmail(data.email);
      if (existing && existing.id !== supplierId) {
        return { status: 'error', message: 'Supplier with this email already exists' };
      }
    }

    const updateData = {
      ...data,
      updatedAt: new Date().toISOString(),
      updatedBy: AuthModule.currentUser?.email || ''
    };

    const result = await DBService.update('Suppliers', 'id', supplierId, updateData);
    
    if (result.status === 'success') {
      await this.logActivity(supplierId, 'updated', 'Supplier updated');
    }
    
    return result;
  },

  // Delete supplier (soft delete)
  async deleteSupplier(supplierId) {
    const result = await DBService.update('Suppliers', 'id', supplierId, {
      status: 'deleted',
      deletedAt: new Date().toISOString(),
      deletedBy: AuthModule.currentUser?.email || ''
    });
    
    if (result.status === 'success') {
      await this.logActivity(supplierId, 'deleted', 'Supplier deleted');
    }
    
    return result;
  },

  // Get supplier transactions
  async getSupplierTransactions(supplierId) {
    const invoices = await DBService.find('PurchaseInvoices', { supplierId });
    const payments = await DBService.find('Payments', { supplierId, type: 'supplier' });
    
    return {
      invoices: invoices || [],
      payments: payments || []
    };
  },

  // Get supplier balance
  async getSupplierBalance(supplierId) {
    const transactions = await this.getSupplierTransactions(supplierId);
    
    let totalInvoiced = 0;
    let totalPaid = 0;
    
    transactions.invoices.forEach(inv => {
      totalInvoiced += parseFloat(inv.totalAmount) || 0;
    });
    
    transactions.payments.forEach(pay => {
      totalPaid += parseFloat(pay.amount) || 0;
    });
    
    return {
      totalInvoiced,
      totalPaid,
      balance: totalInvoiced - totalPaid,
      currency: 'USD'
    };
  },

  // Get supplier statements
  async getSupplierStatement(supplierId, startDate, endDate) {
    const transactions = await this.getSupplierTransactions(supplierId);
    
    const statement = [];
    
    // Add invoices
    transactions.invoices.forEach(inv => {
      if (inv.date >= startDate && inv.date <= endDate) {
        statement.push({
          date: inv.date,
          type: 'invoice',
          reference: inv.invoiceNumber,
          description: `Invoice ${inv.invoiceNumber}`,
          debit: 0,
          credit: parseFloat(inv.totalAmount),
          balance: 0
        });
      }
    });
    
    // Add payments
    transactions.payments.forEach(pay => {
      if (pay.date >= startDate && pay.date <= endDate) {
        statement.push({
          date: pay.date,
          type: 'payment',
          reference: pay.reference,
          description: `Payment ${pay.reference}`,
          debit: parseFloat(pay.amount),
          credit: 0,
          balance: 0
        });
      }
    });
    
    // Sort by date
    statement.sort((a, b) => new Date(a.date) - new Date(b.date));
    
    // Calculate running balance
    let runningBalance = 0;
    statement.forEach(item => {
      runningBalance += item.debit - item.credit;
      item.balance = runningBalance;
    });
    
    return statement;
  },

  // Search suppliers
  async searchSuppliers(query, companyId = null) {
    const suppliers = await this.getAllSuppliers(companyId);
    
    return suppliers.filter(s => 
      s.name.toLowerCase().includes(query.toLowerCase()) ||
      (s.email && s.email.toLowerCase().includes(query.toLowerCase())) ||
      (s.phone && s.phone.includes(query)) ||
      (s.code && s.code.toLowerCase().includes(query.toLowerCase()))
    );
  },

  // Get supplier statistics
  async getSupplierStats(supplierId) {
    const balance = await this.getSupplierBalance(supplierId);
    const transactions = await this.getSupplierTransactions(supplierId);
    
    return {
      totalInvoices: transactions.invoices.length,
      totalPayments: transactions.payments.length,
      totalInvoiced: balance.totalInvoiced,
      totalPaid: balance.totalPaid,
      outstandingBalance: balance.balance,
      averageDeliveryTime: 0, // To be calculated from purchase orders
      onTimeDeliveryRate: 0 // To be calculated from purchase orders
    };
  },

  // Log supplier activity
  async logActivity(supplierId, action, description) {
    const activity = {
      id: DBService.generateId('ACT'),
      entityType: 'Supplier',
      entityId: supplierId,
      action,
      description,
      userId: AuthModule.currentUser?.email || '',
      userName: AuthModule.currentUser?.name || '',
      timestamp: new Date().toISOString()
    };
    
    return DBService.insert('SupplierActivities', activity);
  },

  // Generate supplier code
  generateSupplierCode() {
    const prefix = 'SUP';
    const timestamp = new Date().getTime().toString(36);
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `${prefix}-${timestamp}${random}`;
  },

  // Load suppliers into cache
  async loadSuppliers() {
    const companyId = CompaniesModule.getCurrentCompany()?.id;
    if (companyId) {
      await this.getAllSuppliers(companyId);
    }
  },

  // Export suppliers to CSV
  async exportToCSV() {
    const suppliers = await this.getAllSuppliers();
    
    const headers = ['Code', 'Name', 'Email', 'Phone', 'City', 'Country', 'Balance', 'Status'];
    const rows = suppliers.map(s => [
      s.code,
      s.name,
      s.email,
      s.phone,
      s.city,
      s.country,
      s.balance || 0,
      s.status
    ]);
    
    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `suppliers_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    
    return { status: 'success', message: 'Suppliers exported successfully' };
  },

  // Import suppliers from CSV
  async importFromCSV(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = async (event) => {
        const text = event.target.result;
        const lines = text.split('\n');
        const headers = lines[0].split(',');
        
        const suppliers = [];
        for (let i = 1; i < lines.length; i++) {
          const values = lines[i].split(',');
          if (values.length >= 2) {
            const supplier = {};
            headers.forEach((header, index) => {
              supplier[header.trim().toLowerCase()] = values[index]?.trim() || '';
            });
            suppliers.push(supplier);
          }
        }
        
        const results = [];
        for (const supplier of suppliers) {
          const result = await this.createSupplier(supplier);
          results.push(result);
        }
        
        resolve({
          status: 'success',
          imported: results.filter(r => r.status === 'success').length,
          failed: results.filter(r => r.status === 'error').length,
          details: results
        });
      };
      
      reader.onerror = () => reject(new Error('Error reading file'));
      reader.readAsText(file);
    });
  },

  // Get supplier performance metrics
  async getSupplierPerformance(supplierId, periodDays = 90) {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - periodDays);
    
    const purchaseOrders = await DBService.find('PurchaseOrders', { 
      supplierId,
      status: 'completed'
    });
    
    const filteredOrders = purchaseOrders.filter(po => 
      new Date(po.date) >= startDate && new Date(po.date) <= endDate
    );
    
    if (filteredOrders.length === 0) {
      return {
        totalOrders: 0,
        onTimeDeliveries: 0,
        lateDeliveries: 0,
        onTimeRate: 0,
        averageLeadTime: 0,
        totalValue: 0
      };
    }
    
    let onTimeCount = 0;
    let lateCount = 0;
    let totalLeadTime = 0;
    let totalValue = 0;
    
    filteredOrders.forEach(order => {
      const expectedDate = new Date(order.expectedDeliveryDate);
      const actualDate = new Date(order.actualDeliveryDate);
      const orderDate = new Date(order.orderDate);
      
      if (actualDate <= expectedDate) {
        onTimeCount++;
      } else {
        lateCount++;
      }
      
      totalLeadTime += (actualDate - orderDate) / (1000 * 60 * 60 * 24);
      totalValue += parseFloat(order.totalAmount) || 0;
    });
    
    return {
      totalOrders: filteredOrders.length,
      onTimeDeliveries: onTimeCount,
      lateDeliveries: lateCount,
      onTimeRate: ((onTimeCount / filteredOrders.length) * 100).toFixed(2),
      averageLeadTime: (totalLeadTime / filteredOrders.length).toFixed(1),
      totalValue
    };
  }
};

// Initialize on load
if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => {
    SuppliersModule.init();
  });
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SuppliersModule;
}
