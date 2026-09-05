/**
 * FINOVATE ERP X - Production Google Apps Script API
 * Bound to the FINOVATE_DB spreadsheet.
 */

const SPREADSHEET_ID = '1Y_1pXGbUMYXJFYne-5uqM3kYgMhDjrVWoej4yII60mM';
const ALLOWED_SHEETS = [
  'Users','Roles','Permissions','Companies','Branches','Departments','Employees',
  'Customers','Suppliers','Products','Categories','Units','Warehouses','Stock',
  'Sales','SalesItems','SalesReturns','Purchases','PurchaseItems','PurchaseInvoices',
  'Payments','PurchasePayments','Receipts','Cashboxes','Banks','Accounts','Journal',
  'JournalLines','CostCenters','Assets','Payroll','Attendance','Leaves','Projects',
  'Tasks','Notifications','AuditLogs','ProductActivities','SupplierActivities',
  'Settings','Translations','POSSessions','HeldOrders'
];

function doGet(e) { return handleRequest_(e || {}); }
function doPost(e) { return handleRequest_(e || {}); }

function handleRequest_(e) {
  const request = parseRequest_(e);
  const action = String(request.action || 'health');
  try {
    switch (action) {
      case 'health': return json_({ status: 'success', message: 'FINOVATE ERP API is healthy', database: SPREADSHEET_ID });
      case 'login': return login_(request);
      case 'getUser': return getUser_(request);
      case 'getCompanies': return success_('companies', findAll_('Companies'));
      case 'getDashboard': return dashboard_(request);
      case 'findRecords': return findRecords_(request);
      case 'createRecord': return createRecord_(request);
      case 'updateRecord': return updateRecord_(request);
      case 'deleteRecord': return deleteRecord_(request);
      default: return json_({ status: 'error', message: 'Unsupported action: ' + action }, 400);
    }
  } catch (error) {
    console.error(error);
    return json_({ status: 'error', message: 'Server error', detail: String(error) }, 500);
  }
}

function parseRequest_(e) {
  const params = Object.assign({}, e.parameter || {});
  if (e.postData && e.postData.contents) {
    try { Object.assign(params, JSON.parse(e.postData.contents)); } catch (_) {}
  }
  ['data', 'filters'].forEach(function(key) {
    if (typeof params[key] === 'string') {
      try { params[key] = JSON.parse(params[key]); } catch (_) {}
    }
  });
  return params;
}

function login_(request) {
  const email = String(request.email || '').trim().toLowerCase();
  const password = String(request.password || '');
  const passwordHash = String(request.passwordHash || '');
  if (!email || (!password && !passwordHash)) return json_({ status: 'error', message: 'Email and password are required' }, 400);
  const user = findOne_('Users', 'email', email);
  if (!user || String(user.status || '').toLowerCase() === 'inactive') {
    return json_({ status: 'error', message: 'Invalid credentials' }, 401);
  }
  const expected = String(user.passwordHash || '');
  const received = passwordHash || sha256_(password);
  if (!expected || received !== expected) return json_({ status: 'error', message: 'Invalid credentials' }, 401);
  const safeUser = sanitizeUser_(user);
  appendAudit_(safeUser.id, 'login', 'Users', safeUser.id, '');
  return json_({ status: 'success', user: safeUser, token: Utilities.base64EncodeWebSafe(JSON.stringify({ id: safeUser.id, exp: Date.now() + 3600000 })) });
}

function getUser_(request) {
  const user = findOne_('Users', 'id', request.userId);
  return json_({ status: 'success', user: user ? sanitizeUser_(user) : null });
}

function dashboard_(request) {
  const companyId = request.companyId || '';
  const sales = findAll_('Sales').filter(function(r) { return !companyId || r.companyId == companyId; });
  const customers = findAll_('Customers').filter(function(r) { return !companyId || r.companyId == companyId; });
  const revenue = sales.reduce(function(sum, r) { return sum + Number(r.total || 0); }, 0);
  return json_({ status: 'success', data: { revenue: revenue, netProfit: 0, outstanding: 0, activeCustomers: customers.length, currency: 'EGP' } });
}

function findRecords_(request) {
  const sheetName = safeSheet_(request.sheetName);
  const filters = request.filters && typeof request.filters === 'object' ? request.filters : {};
  return json_({ status: 'success', data: findAll_(sheetName, filters) });
}

function createRecord_(request) {
  const sheetName = safeSheet_(request.sheetName);
  const data = request.data && typeof request.data === 'object' ? request.data : {};
  const result = insert_(sheetName, data);
  appendAudit_('system', 'create', sheetName, result.id, JSON.stringify(data));
  return json_(result);
}

function updateRecord_(request) {
  const sheetName = safeSheet_(request.sheetName);
  const data = request.data && typeof request.data === 'object' ? request.data : {};
  const result = update_(sheetName, request.key || 'id', request.keyValue, data);
  if (result.status === 'success') appendAudit_('system', 'update', sheetName, request.keyValue, JSON.stringify(data));
  return json_(result);
}

function deleteRecord_(request) {
  const sheetName = safeSheet_(request.sheetName);
  const result = remove_(sheetName, request.key || 'id', request.keyValue);
  if (result.status === 'success') appendAudit_('system', 'delete', sheetName, request.keyValue, '');
  return json_(result);
}

function safeSheet_(name) {
  const sheet = String(name || '');
  if (ALLOWED_SHEETS.indexOf(sheet) < 0) throw new Error('Invalid sheet name');
  return sheet;
}

function spreadsheet_() { return SpreadsheetApp.openById(SPREADSHEET_ID); }
function sheet_(name) {
  const sheet = spreadsheet_().getSheetByName(name);
  if (!sheet) throw new Error('Sheet not found: ' + name);
  return sheet;
}

function findAll_(name, filters) {
  const values = sheet_(name).getDataRange().getValues();
  if (values.length <= 1) return [];
  const headers = values[0].map(String);
  return values.slice(1).filter(function(row) {
    return Object.keys(filters || {}).every(function(key) { return row[headers.indexOf(key)] == filters[key]; });
  }).map(function(row) {
    const record = {}; headers.forEach(function(h, i) { record[h] = row[i]; }); return record;
  });
}

function findOne_(name, key, value) { return findAll_(name, {}).find(function(r) { return String(r[key]) === String(value); }) || null; }

function insert_(name, data) {
  const sheet = sheet_(name); const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0].map(String);
  const record = Object.assign({}, data);
  if (!record.id) record.id = Utilities.getUuid();
  if (headers.indexOf('createdAt') >= 0 && !record.createdAt) record.createdAt = new Date().toISOString();
  if (headers.indexOf('updatedAt') >= 0) record.updatedAt = new Date().toISOString();
  sheet.appendRow(headers.map(function(h) { return record[h] === undefined ? '' : record[h]; }));
  return { status: 'success', id: record.id, message: 'Record created' };
}

function update_(name, key, keyValue, data) {
  const sheet = sheet_(name); const values = sheet.getDataRange().getValues(); const headers = values[0].map(String); const index = headers.indexOf(key);
  if (index < 0) return { status: 'error', message: 'Key not found' };
  for (let i = 1; i < values.length; i++) if (String(values[i][index]) === String(keyValue)) {
    Object.keys(data).forEach(function(field) { const col = headers.indexOf(field); if (col >= 0) sheet.getRange(i + 1, col + 1).setValue(data[field]); });
    return { status: 'success', message: 'Record updated' };
  }
  return { status: 'error', message: 'Record not found' };
}

function remove_(name, key, keyValue) {
  const sheet = sheet_(name); const values = sheet.getDataRange().getValues(); const headers = values[0].map(String); const index = headers.indexOf(key);
  for (let i = 1; i < values.length; i++) if (String(values[i][index]) === String(keyValue)) { sheet.deleteRow(i + 1); return { status: 'success', message: 'Record deleted' }; }
  return { status: 'error', message: 'Record not found' };
}

function sanitizeUser_(user) {
  const safe = {}; ['id','email','name','role','companyId','branchId','language','status'].forEach(function(k) { safe[k] = user[k] || ''; }); return safe;
}
function sha256_(value) { return Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, value, Utilities.Charset.UTF_8).map(function(b) { return ('0' + (b & 0xff).toString(16)).slice(-2); }).join(''); }
function appendAudit_(userId, action, entity, entityId, details) { try { insert_('AuditLogs', { id: Utilities.getUuid(), userId: userId, action: action, entity: entity, entityId: entityId, newValue: details, timestamp: new Date().toISOString() }); } catch (_) {} }
function success_(key, value) { const result = { status: 'success' }; result[key] = value; return json_(result); }
function json_(data, code) { return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON); }
