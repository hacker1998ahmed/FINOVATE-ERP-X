/**
 * FINOVATE ERP X - Google Apps Script Backend
 * Developer: Ahmed Mostafa Ibrahim
 * Brand: FINOVATE – AHMED EG
 */

// Main entry point for doGet
function doGet(e) {
  return handleRequest(e);
}

// Main entry point for doPost
function doPost(e) {
  return handleRequest(e);
}

// Request handler
function handleRequest(e) {
  const action = e.parameter.action || 'default';
  
  try {
    switch(action) {
      case 'login':
        return handleLogin(e);
      case 'getUser':
        return getUser(e);
      case 'getCompanies':
        return getCompanies(e);
      case 'getDashboard':
        return getDashboardData(e);
      default:
        return jsonResponse({ status: 'ok', message: 'FINOVATE ERP X API Ready' });
    }
  } catch (error) {
    return jsonResponse({ status: 'error', message: error.toString() }, 500);
  }
}

// Handle user login
function handleLogin(e) {
  const email = e.parameter.email;
  const password = e.parameter.password;
  
  const sheet = getSheet('Users');
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const userEmail = row[headers.indexOf('email')];
    const userPassword = row[headers.indexOf('password')];
    
    if (userEmail === email && userPassword === password) {
      const user = {
        id: row[headers.indexOf('id')],
        email: userEmail,
        name: row[headers.indexOf('name')],
        role: row[headers.indexOf('role')],
        company: row[headers.indexOf('company')]
      };
      return jsonResponse({ status: 'success', user: user });
    }
  }
  
  return jsonResponse({ status: 'error', message: 'Invalid credentials' }, 401);
}

// Get user data
function getUser(e) {
  const userId = e.parameter.userId;
  const user = findRecord('Users', 'id', userId);
  return jsonResponse({ status: 'success', user: user });
}

// Get all companies
function getCompanies(e) {
  const companies = getAllRecords('Companies');
  return jsonResponse({ status: 'success', companies: companies });
}

// Get dashboard data
function getDashboardData(e) {
  const companyId = e.parameter.companyId;
  
  return jsonResponse({
    status: 'success',
    data: {
      revenue: 128430.00,
      netProfit: 42280.00,
      outstanding: 18640.00,
      activeCustomers: 1248,
      currency: 'USD'
    }
  });
}

// Utility: Get sheet by name
function getSheet(sheetName) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(sheetName);
  
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
    initializeSheet(sheet, sheetName);
  }
  
  return sheet;
}

// Initialize sheet with headers
function initializeSheet(sheet, sheetName) {
  const headers = {
    'Users': ['id', 'email', 'password', 'name', 'role', 'company', 'status', 'createdAt'],
    'Companies': ['id', 'name', 'code', 'currency', 'language', 'status', 'createdAt'],
    'Branches': ['id', 'companyId', 'name', 'code', 'address', 'status'],
    'Customers': ['id', 'companyId', 'name', 'email', 'phone', 'address', 'taxId'],
    'Suppliers': ['id', 'companyId', 'name', 'email', 'phone', 'address', 'taxId'],
    'Products': ['id', 'companyId', 'sku', 'name', 'category', 'unit', 'price', 'cost'],
    'Accounts': ['id', 'companyId', 'code', 'name', 'type', 'parentId', 'balance']
  };
  
  if (headers[sheetName]) {
    sheet.appendRow(headers[sheetName]);
  }
}

// Utility: Get all records from a sheet
function getAllRecords(sheetName) {
  const sheet = getSheet(sheetName);
  const data = sheet.getDataRange().getValues();
  
  if (data.length <= 1) return [];
  
  const headers = data[0];
  const records = [];
  
  for (let i = 1; i < data.length; i++) {
    const record = {};
    headers.forEach((header, index) => {
      record[header] = data[i][index];
    });
    records.push(record);
  }
  
  return records;
}

// Utility: Find single record
function findRecord(sheetName, key, value) {
  const records = getAllRecords(sheetName);
  return records.find(r => r[key] == value) || null;
}

// Utility: Return JSON response
function jsonResponse(data, statusCode) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

// Create new record
function createRecord(sheetName, data) {
  const sheet = getSheet(sheetName);
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const row = headers.map(h => data[h] || '');
  sheet.appendRow(row);
  return { status: 'success', id: row[0] };
}

// Update record
function updateRecord(sheetName, key, keyValue, data) {
  const sheet = getSheet(sheetName);
  const records = sheet.getDataRange().getValues();
  const headers = records[0];
  const keyIndex = headers.indexOf(key);
  
  for (let i = 1; i < records.length; i++) {
    if (records[i][keyIndex] == keyValue) {
      headers.forEach((h, idx) => {
        if (data[h] !== undefined) {
          sheet.getRange(i + 1, idx + 1).setValue(data[h]);
        }
      });
      return { status: 'success' };
    }
  }
  
  return { status: 'error', message: 'Record not found' };
}

// Delete record
function deleteRecord(sheetName, key, keyValue) {
  const sheet = getSheet(sheetName);
  const records = sheet.getDataRange().getValues();
  const keyIndex = records[0].indexOf(key);
  
  for (let i = 1; i < records.length; i++) {
    if (records[i][keyIndex] == keyValue) {
      sheet.deleteRow(i + 1);
      return { status: 'success' };
    }
  }
  
  return { status: 'error', message: 'Record not found' };
}
