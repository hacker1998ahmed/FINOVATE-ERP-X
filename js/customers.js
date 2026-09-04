/**
 * FINOVATE ERP X - Customers Module
 * Phase 04: Customer Relationship Management
 */

const CustomersModule = {
  // Initialize module
  async init() {
    console.log('Customers Module: Initializing...');
    await this.loadCustomers();
    return { status: 'success' };
  },

  // Get all customers
  async getAllCustomers(companyId = null) {
    const filters = {};
    if (companyId) filters.companyId = companyId;
    
    const customers = await DBService.find('Customers', filters);
    return customers.filter(c => c.status !== 'deleted');
  },

  // Get customer by ID
  async getCustomer(customerId) {
    return DBService.findOne('Customers', 'id', customerId);
  },

  // Get customer by email
  async getCustomerByEmail(email) {
    return DBService.findOne('Customers', 'email', email);
  },

  // Create new customer
  async createCustomer(data) {
    const companyId = CompaniesModule.getCurrentCompany()?.id || data.companyId;
    
    if (!companyId) {
      return { status: 'error', message: 'Company ID is required' };
    }

    // Check if customer already exists
    const existing = await this.getCustomerByEmail(data.email);
    if (existing) {
      return { status: 'error', message: 'Customer with this email already exists' };
    }

    const customerData = {
      id: DBService.generateId('CUST'),
      companyId,
      code: data.code || this.generateCustomerCode(),
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
      creditLimit: parseFloat(data.creditLimit) || 0,
      currency: data.currency || 'USD',
      paymentTerms: data.paymentTerms || 30,
      priceList: data.priceList || 'default',
      discount: parseFloat(data.discount) || 0,
      notes: data.notes || '',
      contactPerson: data.contactPerson || '',
      contactEmail: data.contactEmail || '',
      contactPhone: data.contactPhone || '',
      status: 'active',
      type: data.type || 'regular', // regular, vip, wholesale
      source: data.source || 'direct', // direct, referral, website, social
      createdAt: new Date().toISOString(),
      createdBy: AuthModule.currentUser?.email || ''
    };

    const result = await DBService.insert('Customers', customerData);
    
    if (result.status === 'success') {
      await this.logActivity(customerData.id, 'created', 'Customer created');
    }
    
    return result;
  },

  // Update customer
  async updateCustomer(customerId, data) {
    const customer = await this.getCustomer(customerId);
    
    if (!customer) {
      return { status: 'error', message: 'Customer not found' };
    }

    // Check email uniqueness if changed
    if (data.email && data.email !== customer.email) {
      const existing = await this.getCustomerByEmail(data.email);
      if (existing && existing.id !== customerId) {
        return { status: 'error', message: 'Customer with this email already exists' };
      }
    }

    const updateData = {
      ...data,
      updatedAt: new Date().toISOString(),
      updatedBy: AuthModule.currentUser?.email || ''
    };

    const result = await DBService.update('Customers', 'id', customerId, updateData);
    
    if (result.status === 'success') {
      await this.logActivity(customerId, 'updated', 'Customer updated');
    }
    
    return result;
  },

  // Delete customer (soft delete)
  async deleteCustomer(customerId) {
    const result = await DBService.update('Customers', 'id', customerId, {
      status: 'deleted',
      deletedAt: new Date().toISOString(),
      deletedBy: AuthModule.currentUser?.email || ''
    });
    
    if (result.status === 'success') {
      await this.logActivity(customerId, 'deleted', 'Customer deleted');
    }
    
    return result;
  },

  // Get customer transactions
  async getCustomerTransactions(customerId) {
    const invoices = await DBService.find('SalesInvoices', { customerId });
    const payments = await DBService.find('Payments', { customerId });
    
    return {
      invoices: invoices || [],
      payments: payments || []
    };
  },

  // Get customer balance
  async getCustomerBalance(customerId) {
    const transactions = await this.getCustomerTransactions(customerId);
    
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

  // Get customer statements
  async getCustomerStatement(customerId, startDate, endDate) {
    const transactions = await this.getCustomerTransactions(customerId);
    
    const statement = [];
    
    // Add invoices
    transactions.invoices.forEach(inv => {
      if (inv.date >= startDate && inv.date <= endDate) {
        statement.push({
          date: inv.date,
          type: 'invoice',
          reference: inv.invoiceNumber,
          description: `Invoice ${inv.invoiceNumber}`,
          debit: parseFloat(inv.totalAmount),
          credit: 0,
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
          debit: 0,
          credit: parseFloat(pay.amount),
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

  // Search customers
  async searchCustomers(query, companyId = null) {
    const customers = await this.getAllCustomers(companyId);
    
    return customers.filter(c => 
      c.name.toLowerCase().includes(query.toLowerCase()) ||
      (c.email && c.email.toLowerCase().includes(query.toLowerCase())) ||
      (c.phone && c.phone.includes(query)) ||
      (c.code && c.code.toLowerCase().includes(query.toLowerCase()))
    );
  },

  // Get customer statistics
  async getCustomerStats(customerId) {
    const balance = await this.getCustomerBalance(customerId);
    const transactions = await this.getCustomerTransactions(customerId);
    
    return {
      totalInvoices: transactions.invoices.length,
      totalPayments: transactions.payments.length,
      totalInvoiced: balance.totalInvoiced,
      totalPaid: balance.totalPaid,
      outstandingBalance: balance.balance,
      creditLimit: (await this.getCustomer(customerId))?.creditLimit || 0,
      availableCredit: ((await this.getCustomer(customerId))?.creditLimit || 0) - balance.balance
    };
  },

  // Log customer activity
  async logActivity(customerId, action, description) {
    const activity = {
      id: DBService.generateId('ACT'),
      entityType: 'Customer',
      entityId: customerId,
      action,
      description,
      userId: AuthModule.currentUser?.email || '',
      userName: AuthModule.currentUser?.name || '',
      timestamp: new Date().toISOString()
    };
    
    return DBService.insert('CustomerActivities', activity);
  },

  // Generate customer code
  generateCustomerCode() {
    const prefix = 'CUST';
    const timestamp = new Date().getTime().toString(36);
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `${prefix}-${timestamp}${random}`;
  },

  // Load customers into cache
  async loadCustomers() {
    const companyId = CompaniesModule.getCurrentCompany()?.id;
    if (companyId) {
      await this.getAllCustomers(companyId);
    }
  },

  // Export customers to CSV
  async exportToCSV() {
    const customers = await this.getAllCustomers();
    
    const headers = ['Code', 'Name', 'Email', 'Phone', 'City', 'Country', 'Balance', 'Status'];
    const rows = customers.map(c => [
      c.code,
      c.name,
      c.email,
      c.phone,
      c.city,
      c.country,
      c.balance || 0,
      c.status
    ]);
    
    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `customers_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    
    return { status: 'success', message: 'Customers exported successfully' };
  },

  // Import customers from CSV
  async importFromCSV(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = async (event) => {
        const text = event.target.result;
        const lines = text.split('\n');
        const headers = lines[0].split(',');
        
        const customers = [];
        for (let i = 1; i < lines.length; i++) {
          const values = lines[i].split(',');
          if (values.length >= 2) {
            const customer = {};
            headers.forEach((header, index) => {
              customer[header.trim().toLowerCase()] = values[index]?.trim() || '';
            });
            customers.push(customer);
          }
        }
        
        const results = [];
        for (const customer of customers) {
          const result = await this.createCustomer(customer);
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
  }
};

// Initialize on load
if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => {
    CustomersModule.init();
  });
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CustomersModule;
}
