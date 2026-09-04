/**
 * FINOVATE ERP X - Database Service Module
 * Local database operations and Google Sheets sync
 */

const DBService = {
  // Local cache for offline support
  cache: new Map(),
  
  // Initialize database connection
  async init() {
    console.log('FINOVATE DB: Initializing...');
    await this.loadFromCache();
    return { status: 'success', message: 'Database initialized' };
  },
  
  // Load data from local cache
  async loadFromCache() {
    const cached = localStorage.getItem('finovate-db-cache');
    if (cached) {
      this.cache = new Map(JSON.parse(cached));
    }
  },
  
  // Save to local cache
  async saveToCache() {
    const data = Array.from(this.cache.entries());
    localStorage.setItem('finovate-db-cache', JSON.stringify(data));
  },
  
  // Get records from sheet
  async find(sheetName, filters = {}) {
    const cacheKey = `${sheetName}_${JSON.stringify(filters)}`;
    
    // Check cache first
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }
    
    // Fetch from API
    const result = await APIClient.findRecords(sheetName, filters);
    
    if (result.status === 'success') {
      this.cache.set(cacheKey, result.data || []);
      await this.saveToCache();
      return result.data || [];
    }
    
    return [];
  },
  
  // Get single record
  async findOne(sheetName, key, value) {
    const records = await this.find(sheetName, { [key]: value });
    return records.length > 0 ? records[0] : null;
  },
  
  // Get all records
  async findAll(sheetName) {
    return this.find(sheetName, {});
  },
  
  // Insert new record
  async insert(sheetName, data) {
    // Generate ID if not present
    if (!data.id) {
      data.id = this.generateId(sheetName.substring(0, 3));
    }
    
    const result = await APIClient.createRecord(sheetName, data);
    
    if (result.status === 'success') {
      // Invalidate cache
      await this.clearCache(sheetName);
      return { status: 'success', id: data.id };
    }
    
    return result;
  },
  
  // Update record
  async update(sheetName, key, keyValue, data) {
    const result = await APIClient.updateRecord(sheetName, key, keyValue, data);
    
    if (result.status === 'success') {
      // Invalidate cache
      await this.clearCache(sheetName);
    }
    
    return result;
  },
  
  // Delete record
  async delete(sheetName, key, keyValue) {
    const result = await APIClient.deleteRecord(sheetName, key, keyValue);
    
    if (result.status === 'success') {
      // Invalidate cache
      await this.clearCache(sheetName);
    }
    
    return result;
  },
  
  // Clear cache for specific sheet
  async clearCache(sheetName) {
    const keysToDelete = [];
    for (const key of this.cache.keys()) {
      if (key.startsWith(sheetName)) {
        keysToDelete.push(key);
      }
    }
    keysToDelete.forEach(key => this.cache.delete(key));
    await this.saveToCache();
  },
  
  // Clear all cache
  async clearAllCache() {
    this.cache.clear();
    localStorage.removeItem('finovate-db-cache');
  },
  
  // Generate unique ID
  generateId(prefix = '') {
    const timestamp = new Date().getTime().toString(36);
    const random = Math.random().toString(36).substring(2, 8);
    return prefix.toUpperCase() + timestamp + random;
  },
  
  // Batch operations
  async batchInsert(sheetName, records) {
    const results = [];
    for (const record of records) {
      const result = await this.insert(sheetName, record);
      results.push(result);
    }
    return results;
  },
  
  // Query builder helper
  query(sheetName) {
    return {
      sheetName,
      filters: {},
      
      where(field, value) {
        this.filters[field] = value;
        return this;
      },
      
      async find() {
        return DBService.find(this.sheetName, this.filters);
      },
      
      async findOne() {
        const results = await this.find();
        return results.length > 0 ? results[0] : null;
      },
      
      async count() {
        const results = await this.find();
        return results.length;
      }
    };
  }
};

// Initialize on load
if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => {
    DBService.init();
  });
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = DBService;
}
