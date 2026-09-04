/**
 * FINOVATE ERP X - Companies & Branches Module
 * Phase 03: Multi-Company and Multi-Branch Management
 */

const CompaniesModule = {
  currentCompany: null,
  currentBranch: null,
  
  // Initialize module
  async init() {
    console.log('Companies Module: Initializing...');
    await this.loadCurrentCompany();
    return { status: 'success' };
  },
  
  // Get all companies
  async getAllCompanies() {
    return DBService.findAll('Companies');
  },
  
  // Get company by ID
  async getCompany(companyId) {
    return DBService.findOne('Companies', 'id', companyId);
  },
  
  // Create new company
  async createCompany(data) {
    const companyData = {
      name: data.name,
      code: data.code || this.generateCode(data.name),
      logo: data.logo || '',
      currency: data.currency || 'USD',
      language: data.language || 'ar',
      timezone: data.timezone || 'Africa/Cairo',
      taxId: data.taxId || '',
      address: data.address || '',
      phone: data.phone || '',
      email: data.email || '',
      status: 'active',
      createdAt: new Date().toISOString()
    };
    
    return DBService.insert('Companies', companyData);
  },
  
  // Update company
  async updateCompany(companyId, data) {
    return DBService.update('Companies', 'id', companyId, data);
  },
  
  // Delete company (soft delete)
  async deleteCompany(companyId) {
    return DBService.update('Companies', 'id', companyId, { status: 'deleted' });
  },
  
  // Get branches for company
  async getBranches(companyId) {
    return DBService.find('Branches', { companyId });
  },
  
  // Get branch by ID
  async getBranch(branchId) {
    return DBService.findOne('Branches', 'id', branchId);
  },
  
  // Create new branch
  async createBranch(data) {
    if (!data.companyId) {
      return { status: 'error', message: 'Company ID is required' };
    }
    
    const branchData = {
      companyId: data.companyId,
      name: data.name,
      code: data.code || this.generateCode(data.name),
      address: data.address || '',
      phone: data.phone || '',
      managerId: data.managerId || '',
      status: 'active',
      createdAt: new Date().toISOString()
    };
    
    return DBService.insert('Branches', branchData);
  },
  
  // Update branch
  async updateBranch(branchId, data) {
    return DBService.update('Branches', 'id', branchId, data);
  },
  
  // Delete branch (soft delete)
  async deleteBranch(branchId) {
    return DBService.update('Branches', 'id', branchId, { status: 'deleted' });
  },
  
  // Set current company
  async setCurrentCompany(companyId) {
    const company = await this.getCompany(companyId);
    if (company) {
      this.currentCompany = company;
      localStorage.setItem('finovate-current-company', companyId);
      
      // Load default branch
      const branches = await this.getBranches(companyId);
      if (branches.length > 0) {
        await this.setCurrentBranch(branches[0].id);
      }
      
      return { status: 'success', company };
    }
    return { status: 'error', message: 'Company not found' };
  },
  
  // Set current branch
  async setCurrentBranch(branchId) {
    const branch = await this.getBranch(branchId);
    if (branch) {
      this.currentBranch = branch;
      localStorage.setItem('finovate-current-branch', branchId);
      return { status: 'success', branch };
    }
    return { status: 'error', message: 'Branch not found' };
  },
  
  // Load current company from storage
  async loadCurrentCompany() {
    const companyId = localStorage.getItem('finovate-current-company');
    if (companyId) {
      await this.setCurrentCompany(companyId);
    }
  },
  
  // Get current company
  getCurrentCompany() {
    return this.currentCompany;
  },
  
  // Get current branch
  getCurrentBranch() {
    return this.currentBranch;
  },
  
  // Generate code from name
  generateCode(name) {
    return name.split(' ').map(w => w[0]).join('').toUpperCase().substring(0, 5);
  },
  
  // Get company settings
  async getCompanySettings(companyId, key = null) {
    const filters = { companyId };
    if (key) filters.key = key;
    
    const settings = await DBService.find('Settings', filters);
    
    if (key && settings.length > 0) {
      return settings[0].value;
    }
    
    return settings.reduce((acc, s) => {
      acc[s.key] = s.value;
      return acc;
    }, {});
  },
  
  // Update company setting
  async updateCompanySetting(companyId, key, value, type = 'string') {
    const existing = await DBService.findOne('Settings', 'key', key);
    
    const settingData = {
      key,
      value,
      type,
      companyId,
      updatedAt: new Date().toISOString()
    };
    
    if (existing && existing.companyId === companyId) {
      return DBService.update('Settings', 'key', key, settingData);
    } else {
      return DBService.insert('Settings', settingData);
    }
  }
};

// Initialize on load
if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => {
    CompaniesModule.init();
  });
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CompaniesModule;
}
