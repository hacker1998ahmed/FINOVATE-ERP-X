/**
 * FINOVATE ERP X - API Client Module
 * Handles communication with Google Apps Script Backend
 */

const API_CONFIG = {
  baseUrl: 'YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL', // Replace with deployed URL
  timeout: 30000,
  retryAttempts: 3
};

const APIClient = {
  async request(endpoint, params = {}, method = 'GET') {
    const url = `${API_CONFIG.baseUrl}?action=${endpoint}&t=${Date.now()}`;
    
    try {
      const options = {
        method: method,
        headers: {
          'Content-Type': 'application/json'
        }
      };
      
      if (method === 'POST') {
        options.body = JSON.stringify(params);
      } else {
        const queryString = new URLSearchParams(params).toString();
        return fetch(`${url}&${queryString}`, options)
          .then(res => res.json())
          .catch(err => this.handleError(err));
      }
      
      return fetch(url, options)
        .then(res => res.json())
        .catch(err => this.handleError(err));
        
    } catch (error) {
      return this.handleError(error);
    }
  },
  
  async login(email, password) {
    return this.request('login', { email, password }, 'POST');
  },
  
  async getUser(userId) {
    return this.request('getUser', { userId });
  },
  
  async getCompanies() {
    return this.request('getCompanies');
  },
  
  async getDashboardData(companyId) {
    return this.request('getDashboard', { companyId });
  },
  
  async createRecord(sheetName, data) {
    return this.request('createRecord', { sheetName, data }, 'POST');
  },
  
  async updateRecord(sheetName, key, keyValue, data) {
    return this.request('updateRecord', { sheetName, key, keyValue, data }, 'POST');
  },
  
  async deleteRecord(sheetName, key, keyValue) {
    return this.request('deleteRecord', { sheetName, key, keyValue }, 'POST');
  },
  
  async findRecords(sheetName, filters = {}) {
    return this.request('findRecords', { sheetName, filters });
  },
  
  handleError(error) {
    console.error('API Error:', error);
    return {
      status: 'error',
      message: error.message || 'Connection failed',
      code: 'NETWORK_ERROR'
    };
  }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = APIClient;
}
