/**
 * FINOVATE ERP X - Database Module
 * Google Sheets Database Operations
 */

const DB_CONFIG = {
  spreadsheetId: null, // Set your Spreadsheet ID here
  sheets: [
    'Users', 'Roles', 'Permissions', 'Companies', 'Branches', 
    'Departments', 'Employees', 'Customers', 'Suppliers', 
    'Products', 'Categories', 'Units', 'Warehouses', 'Stock',
    'Sales', 'SalesItems', 'Purchases', 'PurchaseItems',
    'Payments', 'Receipts', 'Cashboxes', 'Banks',
    'Accounts', 'Journal', 'JournalLines', 'CostCenters',
    'Assets', 'Payroll', 'Attendance', 'Leaves',
    'Projects', 'Tasks', 'Notifications', 'AuditLogs',
    'Settings', 'Translations'
  ]
};

// Initialize database
function initDatabase() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  DB_CONFIG.spreadsheetId = ss.getId();
  
  DB_CONFIG.sheets.forEach(sheetName => {
    let sheet = ss.getSheetByName(sheetName);
    if (!sheet) {
      sheet = ss.insertSheet(sheetName);
      createSheetHeaders(sheet, sheetName);
    }
  });
  
  return { status: 'success', message: 'Database initialized' };
}

// Create headers for each sheet type
function createSheetHeaders(sheet, name) {
  const headersMap = {
    'Users': ['id', 'email', 'password', 'name', 'role', 'companyId', 'branchId', 'language', 'status', 'lastLogin', 'createdAt', 'updatedAt'],
    'Roles': ['id', 'name', 'description', 'permissions', 'createdAt'],
    'Permissions': ['id', 'code', 'name', 'module', 'actions'],
    'Companies': ['id', 'name', 'code', 'logo', 'currency', 'language', 'timezone', 'taxId', 'address', 'phone', 'email', 'status', 'createdAt'],
    'Branches': ['id', 'companyId', 'name', 'code', 'address', 'phone', 'managerId', 'status', 'createdAt'],
    'Departments': ['id', 'companyId', 'branchId', 'name', 'code', 'managerId', 'status'],
    'Employees': ['id', 'companyId', 'branchId', 'departmentId', 'firstName', 'lastName', 'email', 'phone', 'position', 'hireDate', 'salary', 'status'],
    'Customers': ['id', 'companyId', 'name', 'type', 'email', 'phone', 'taxId', 'address', 'city', 'country', 'creditLimit', 'currency', 'language', 'status'],
    'Suppliers': ['id', 'companyId', 'name', 'email', 'phone', 'taxId', 'address', 'city', 'country', 'currency', 'status'],
    'Products': ['id', 'companyId', 'sku', 'barcode', 'name', 'description', 'categoryId', 'brandId', 'unitId', 'costPrice', 'sellingPrice', 'taxRate', 'minStock', 'maxStock', 'status'],
    'Categories': ['id', 'companyId', 'name', 'parentId', 'level', 'status'],
    'Units': ['id', 'companyId', 'code', 'name', 'type'],
    'Warehouses': ['id', 'companyId', 'branchId', 'name', 'code', 'address', 'managerId', 'status'],
    'Stock': ['id', 'productId', 'warehouseId', 'quantity', 'reservedQty', 'availableQty', 'batchNumber', 'serialNumber', 'expiryDate', 'lastUpdated'],
    'Sales': ['id', 'companyId', 'branchId', 'customerId', 'invoiceNumber', 'date', 'dueDate', 'subtotal', 'taxAmount', 'discountAmount', 'total', 'paidAmount', 'status', 'currency'],
    'SalesItems': ['id', 'saleId', 'productId', 'quantity', 'unitPrice', 'taxRate', 'discount', 'total'],
    'Purchases': ['id', 'companyId', 'branchId', 'supplierId', 'orderNumber', 'date', 'dueDate', 'subtotal', 'taxAmount', 'total', 'status', 'currency'],
    'PurchaseItems': ['id', 'purchaseId', 'productId', 'quantity', 'unitPrice', 'taxRate', 'total'],
    'Payments': ['id', 'companyId', 'saleId', 'customerId', 'amount', 'method', 'date', 'reference', 'notes'],
    'Receipts': ['id', 'companyId', 'purchaseId', 'supplierId', 'amount', 'method', 'date', 'reference'],
    'Cashboxes': ['id', 'companyId', 'branchId', 'name', 'currency', 'balance'],
    'Banks': ['id', 'companyId', 'name', 'accountNumber', 'bankName', 'currency', 'balance'],
    'Accounts': ['id', 'companyId', 'code', 'name', 'type', 'parentId', 'level', 'balance', 'status'],
    'Journal': ['id', 'companyId', 'voucherNumber', 'date', 'description', 'reference', 'totalDebit', 'totalCredit', 'status', 'postedBy', 'postedAt'],
    'JournalLines': ['id', 'journalId', 'accountId', 'description', 'debit', 'credit', 'branchId', 'costCenterId'],
    'CostCenters': ['id', 'companyId', 'code', 'name', 'type', 'status'],
    'Assets': ['id', 'companyId', 'code', 'name', 'category', 'purchaseDate', 'cost', 'depreciationMethod', 'usefulLife', 'accumulatedDepreciation', 'netValue'],
    'Payroll': ['id', 'companyId', 'employeeId', 'period', 'basicSalary', 'allowances', 'overtime', 'deductions', 'netSalary', 'status', 'paidDate'],
    'Attendance': ['id', 'companyId', 'employeeId', 'date', 'checkIn', 'checkOut', 'hoursWorked', 'lateMinutes', 'status'],
    'Leaves': ['id', 'companyId', 'employeeId', 'type', 'startDate', 'endDate', 'days', 'status', 'approvedBy', 'approvedAt'],
    'Projects': ['id', 'companyId', 'name', 'code', 'description', 'startDate', 'endDate', 'budget', 'status', 'managerId'],
    'Tasks': ['id', 'projectId', 'name', 'description', 'assignedTo', 'dueDate', 'priority', 'status', 'completedAt'],
    'Notifications': ['id', 'userId', 'type', 'title', 'message', 'isRead', 'createdAt', 'actionUrl'],
    'AuditLogs': ['id', 'userId', 'action', 'entity', 'entityId', 'oldValue', 'newValue', 'ipAddress', 'timestamp'],
    'Settings': ['id', 'key', 'value', 'type', 'companyId', 'updatedAt'],
    'Translations': ['id', 'key', 'ar', 'en', 'fr', 'es', 'de', 'it', 'pt', 'tr', 'ru', 'zh-CN']
  };
  
  const headers = headersMap[name] || ['id', 'createdAt'];
  sheet.appendRow(headers);
  
  // Format header row
  sheet.getRange(1, 1, 1, headers.length)
    .setBackground('#1a2d4a')
    .setFontColor('#ffffff')
    .setFontWeight('bold');
}

// Generate unique ID
function generateId(prefix = '') {
  const timestamp = new Date().getTime().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return prefix + timestamp + random;
}

// Get sheet by name
function getSheetByName(sheetName) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(sheetName);
  
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
    createSheetHeaders(sheet, sheetName);
  }
  
  return sheet;
}

// Insert record
function dbInsert(sheetName, data) {
  try {
    const sheet = getSheetByName(sheetName);
    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    
    // Add ID and timestamps if not present
    if (!data.id) data.id = generateId();
    if (!data.createdAt) data.createdAt = new Date().toISOString();
    data.updatedAt = new Date().toISOString();
    
    const row = headers.map(h => data[h] !== undefined ? data[h] : '');
    sheet.appendRow(row);
    
    return { status: 'success', id: data.id, row: sheet.getLastRow() };
  } catch (error) {
    return { status: 'error', message: error.toString() };
  }
}

// Get all records
function dbFindAll(sheetName, filters = {}) {
  try {
    const sheet = getSheetByName(sheetName);
    const data = sheet.getDataRange().getValues();
    
    if (data.length <= 1) return [];
    
    const headers = data[0];
    const records = [];
    
    for (let i = 1; i < data.length; i++) {
      const record = {};
      let matches = true;
      
      headers.forEach((header, index) => {
        record[header] = data[i][index];
        
        // Apply filters
        if (filters[header] && data[i][index] != filters[header]) {
          matches = false;
        }
      });
      
      if (matches) records.push(record);
    }
    
    return records;
  } catch (error) {
    return [];
  }
}

// Find single record
function dbFindOne(sheetName, key, value) {
  const records = dbFindAll(sheetName, { [key]: value });
  return records.length > 0 ? records[0] : null;
}

// Update record
function dbUpdate(sheetName, key, keyValue, data) {
  try {
    const sheet = getSheetByName(sheetName);
    const values = sheet.getDataRange().getValues();
    const headers = values[0];
    const keyIndex = headers.indexOf(key);
    
    data.updatedAt = new Date().toISOString();
    
    for (let i = 1; i < values.length; i++) {
      if (values[i][keyIndex] == keyValue) {
        headers.forEach((h, idx) => {
          if (data[h] !== undefined) {
            sheet.getRange(i + 1, idx + 1).setValue(data[h]);
          }
        });
        return { status: 'success', row: i + 1 };
      }
    }
    
    return { status: 'error', message: 'Record not found' };
  } catch (error) {
    return { status: 'error', message: error.toString() };
  }
}

// Delete record
function dbDelete(sheetName, key, keyValue) {
  try {
    const sheet = getSheetByName(sheetName);
    const values = sheet.getDataRange().getValues();
    const keyIndex = values[0].indexOf(key);
    
    for (let i = 1; i < values.length; i++) {
      if (values[i][keyIndex] == keyValue) {
        sheet.deleteRow(i + 1);
        return { status: 'success' };
      }
    }
    
    return { status: 'error', message: 'Record not found' };
  } catch (error) {
    return { status: 'error', message: error.toString() };
  }
}
