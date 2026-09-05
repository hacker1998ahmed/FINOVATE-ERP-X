/** FINOVATE ERP X - API client */
const API_CONFIG = {
  baseUrl: (window.FINOVATE_CONFIG && window.FINOVATE_CONFIG.apiEndpoint) || 'REPLACE_WITH_APPS_SCRIPT_URL',
  timeout: 30000,
  retryAttempts: 2
};

const APIClient = {
  async request(action, params = {}, method = 'GET') {
    if (!API_CONFIG.baseUrl || API_CONFIG.baseUrl.includes('REPLACE_WITH')) {
      return { status: 'error', message: 'API endpoint is not configured', code: 'CONFIG_ERROR' };
    }
    const payload = Object.assign({}, params, { action });
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), API_CONFIG.timeout);
    try {
      const query = new URLSearchParams();
      Object.entries(payload).forEach(([key, value]) => {
        query.set(key, value !== null && typeof value === 'object' ? JSON.stringify(value) : String(value));
      });
      const response = await fetch(`${API_CONFIG.baseUrl}?${query.toString()}`, { method: 'GET', signal: controller.signal });
      const result = await response.json();
      return response.ok ? result : { status: 'error', message: `HTTP ${response.status}` };
    } catch (error) {
      return this.handleError(error);
    } finally {
      clearTimeout(timer);
    }
  },
  login(email, password) { return this.request('login', { email, password }, 'POST'); },
  getUser(userId) { return this.request('getUser', { userId }); },
  getCompanies() { return this.request('getCompanies'); },
  getDashboardData(companyId) { return this.request('getDashboard', { companyId }); },
  createRecord(sheetName, data) { return this.request('createRecord', { sheetName, data }, 'POST'); },
  updateRecord(sheetName, key, keyValue, data) { return this.request('updateRecord', { sheetName, key, keyValue, data }, 'POST'); },
  deleteRecord(sheetName, key, keyValue) { return this.request('deleteRecord', { sheetName, key, keyValue }, 'POST'); },
  findRecords(sheetName, filters = {}) { return this.request('findRecords', { sheetName, filters }); },
  handleError(error) { return { status: 'error', message: error.name === 'AbortError' ? 'Request timed out' : (error.message || 'Connection failed'), code: 'NETWORK_ERROR' }; }
};
if (typeof module !== 'undefined' && module.exports) module.exports = APIClient;
