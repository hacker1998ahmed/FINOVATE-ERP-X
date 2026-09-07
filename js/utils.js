/**
 * FINOVATE ERP X - Utility Functions
 * Common helper functions used across the application
 */

const Utils = {
  /**
   * Format currency value
   * @param {number} amount - Amount to format
   * @param {string} currency - Currency code (default: SAR)
   * @param {string} locale - Locale for formatting (default: ar-SA)
   * @returns {string} Formatted currency string
   */
  formatCurrency(amount, currency = 'SAR', locale = 'ar-SA') {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2
    }).format(amount);
  },

  /**
   * Format date
   * @param {Date|string} date - Date to format
   * @param {string} locale - Locale for formatting
   * @param {Object} options - Intl.DateTimeFormat options
   * @returns {string} Formatted date string
   */
  formatDate(date, locale = 'ar-SA', options = {}) {
    const defaultOptions = {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    };
    
    const mergedOptions = { ...defaultOptions, ...options };
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    return new Intl.DateTimeFormat(locale, mergedOptions).format(dateObj);
  },

  /**
   * Format number with thousands separator
   * @param {number} num - Number to format
   * @param {string} locale - Locale for formatting
   * @returns {string} Formatted number string
   */
  formatNumber(num, locale = 'ar-SA') {
    return new Intl.NumberFormat(locale).format(num);
  },

  /**
   * Generate unique ID
   * @returns {string} Unique identifier
   */
  generateId() {
    return 'ID-' + Date.now().toString(36) + '-' + Math.random().toString(36).substr(2, 9);
  },

  /**
   * Debounce function execution
   * @param {Function} func - Function to debounce
   * @param {number} wait - Wait time in milliseconds
   * @returns {Function} Debounced function
   */
  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  },

  /**
   * Throttle function execution
   * @param {Function} func - Function to throttle
   * @param {number} limit - Time limit in milliseconds
   * @returns {Function} Throttled function
   */
  throttle(func, limit) {
    let inThrottle;
    return function(...args) {
      if (!inThrottle) {
        func.apply(this, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  },

  /**
   * Deep clone an object
   * @param {Object} obj - Object to clone
   * @returns {Object} Cloned object
   */
  deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
  },

  /**
   * Get value from nested object using dot notation
   * @param {Object} obj - Object to query
   * @param {string} path - Dot notation path (e.g., 'user.address.city')
   * @param {*} defaultValue - Default value if path doesn't exist
   * @returns {*} Value at path or default value
   */
  getNestedValue(obj, path, defaultValue = null) {
    return path.split('.').reduce((current, key) => {
      return current && current[key] !== undefined ? current[key] : defaultValue;
    }, obj);
  },

  /**
   * Set value in nested object using dot notation
   * @param {Object} obj - Object to modify
   * @param {string} path - Dot notation path
   * @param {*} value - Value to set
   */
  setNestedValue(obj, path, value) {
    const keys = path.split('.');
    const lastKey = keys.pop();
    const target = keys.reduce((current, key) => {
      return current[key] || (current[key] = {});
    }, obj);
    target[lastKey] = value;
  },

  /**
   * Validate email address
   * @param {string} email - Email to validate
   * @returns {boolean} True if valid email
   */
  isValidEmail(email) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  },

  /**
   * Validate phone number (Saudi format)
   * @param {string} phone - Phone number to validate
   * @returns {boolean} True if valid phone number
   */
  isValidPhone(phone) {
    const regex = /^(\+966|0)?5[0-9]{8}$/;
    return regex.test(phone.replace(/\s/g, ''));
  },

  /**
   * Validate Saudi National ID (Iqama)
   * @param {string} id - ID number to validate
   * @returns {boolean} True if valid ID
   */
  isValidSaudiId(id) {
    const regex = /^[12][0-9]{9}$/;
    if (!regex.test(id)) return false;
    
    let sum = 0;
    for (let i = 0; i < 10; i++) {
      let digit = parseInt(id[i]);
      if (i % 2 === 0) {
        digit *= 2;
        if (digit > 9) digit -= 9;
      }
      sum += digit;
    }
    return sum % 10 === 0;
  },

  /**
   * Calculate VAT (15%)
   * @param {number} amount - Base amount
   * @returns {Object} Object with base, vat, and total
   */
  calculateVAT(amount) {
    const vatRate = 0.15;
    const vatAmount = amount * vatRate;
    return {
      base: amount,
      vat: vatAmount,
      total: amount + vatAmount
    };
  },

  /**
   * Parse percentage string to decimal
   * @param {string} percentage - Percentage string (e.g., "15%")
   * @returns {number} Decimal value
   */
  parsePercentage(percentage) {
    return parseFloat(percentage.replace('%', '')) / 100;
  },

  /**
   * Convert Arabic numbers to English
   * @param {string} str - String with Arabic numbers
   * @returns {string} String with English numbers
   */
  arabicToEnglishNumbers(str) {
    const arabicNumerals = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
    return str.replace(/[٠-٩]/g, d => arabicNumerals.indexOf(d));
  },

  /**
   * Convert English numbers to Arabic
   * @param {string} str - String with English numbers
   * @returns {string} String with Arabic numbers
   */
  englishToArabicNumbers(str) {
    const arabicNumerals = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
    return str.replace(/[0-9]/g, d => arabicNumerals[d]);
  },

  /**
   * Truncate text with ellipsis
   * @param {string} text - Text to truncate
   * @param {number} maxLength - Maximum length
   * @returns {string} Truncated text
   */
  truncate(text, maxLength = 50) {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  },

  /**
   * Escape HTML special characters
   * @param {string} str - String to escape
   * @returns {string} Escaped string
   */
  escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  },

  /**
   * Download data as CSV file
   * @param {Array} data - Array of objects
   * @param {string} filename - Filename for download
   */
  downloadCSV(data, filename = 'export.csv') {
    if (!data || !data.length) return;
    
    const headers = Object.keys(data[0]);
    const csv = [
      headers.join(','),
      ...data.map(row => headers.map(header => 
        `"${String(row[header]).replace(/"/g, '""')}"`
      ).join(','))
    ].join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
    URL.revokeObjectURL(link.href);
  },

  /**
   * Download data as JSON file
   * @param {Object} data - Data to download
   * @param {string} filename - Filename for download
   */
  downloadJSON(data, filename = 'export.json') {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
    URL.revokeObjectURL(link.href);
  },

  /**
   * Show toast notification
   * @param {string} message - Message to display
   * @param {string} type - Notification type (success, error, warning, info)
   * @param {number} duration - Duration in milliseconds
   */
  showToast(message, type = 'info', duration = 3000) {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
      toast.classList.add('toast-hide');
      setTimeout(() => toast.remove(), 300);
    }, duration);
  },

  /**
   * Copy text to clipboard
   * @param {string} text - Text to copy
   * @returns {Promise<boolean>} Success status
   */
  async copyToClipboard(text) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (err) {
      console.error('Failed to copy:', err);
      return false;
    }
  },

  /**
   * Check if element is in viewport
   * @param {Element} element - Element to check
   * @returns {boolean} True if element is visible
   */
  isInViewport(element) {
    const rect = element.getBoundingClientRect();
    return (
      rect.top >= 0 &&
      rect.left >= 0 &&
      rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
      rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
  },

  /**
   * Scroll to element smoothly
   * @param {Element|string} element - Element or selector to scroll to
   * @param {Object} options - Scroll options
   */
  scrollTo(element, options = {}) {
    const el = typeof element === 'string' ? document.querySelector(element) : element;
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', ...options });
    }
  },

  /**
   * Group array by key
   * @param {Array} array - Array to group
   * @param {string|Function} key - Key or function to group by
   * @returns {Object} Grouped object
   */
  groupBy(array, key) {
    return array.reduce((result, item) => {
      const groupKey = typeof key === 'function' ? key(item) : item[key];
      (result[groupKey] = result[groupKey] || []).push(item);
      return result;
    }, {});
  },

  /**
   * Sort array by key
   * @param {Array} array - Array to sort
   * @param {string} key - Key to sort by
   * @param {string} order - Sort order (asc or desc)
   * @returns {Array} Sorted array
   */
  sortBy(array, key, order = 'asc') {
    return [...array].sort((a, b) => {
      const aVal = a[key];
      const bVal = b[key];
      const comparison = aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
      return order === 'desc' ? -comparison : comparison;
    });
  },

  /**
   * Remove duplicates from array
   * @param {Array} array - Array to deduplicate
   * @param {string} key - Optional key to compare by
   * @returns {Array} Deduplicated array
   */
  removeDuplicates(array, key = null) {
    if (key) {
      const seen = new Set();
      return array.filter(item => {
        const value = item[key];
        if (seen.has(value)) return false;
        seen.add(value);
        return true;
      });
    }
    return [...new Set(array)];
  },

  /**
   * Local storage wrapper with expiration
   */
  storage: {
    set(key, value, ttl = null) {
      const item = {
        value,
        expiry: ttl ? Date.now() + ttl : null
      };
      localStorage.setItem(key, JSON.stringify(item));
    },
    
    get(key) {
      const itemStr = localStorage.getItem(key);
      if (!itemStr) return null;
      
      const item = JSON.parse(itemStr);
      if (item.expiry && Date.now() > item.expiry) {
        localStorage.removeItem(key);
        return null;
      }
      return item.value;
    },
    
    remove(key) {
      localStorage.removeItem(key);
    },
    
    clear() {
      localStorage.clear();
    }
  }
};

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = Utils;
}
