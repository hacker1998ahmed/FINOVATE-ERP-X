from pathlib import Path
import json, re, subprocess, sys

SPREADSHEET_ID = "1Y_1pXGbUMYXJFYne-5uqM3kYgMhDjrVWoej4yII60mM"

headers = {
    "Users": ["id", "email", "passwordHash", "name", "role", "companyId", "branchId", "language", "status", "lastLogin", "createdAt", "updatedAt"],
    "Roles": ["id", "name", "description", "permissions", "createdAt"],
    "Permissions": ["id", "code", "name", "module", "actions"],
    "Companies": ["id", "name", "code", "logo", "currency", "language", "timezone", "taxId", "address", "phone", "email", "status", "createdAt"],
    "Branches": ["id", "companyId", "name", "code", "address", "phone", "managerId", "status", "createdAt"],
    "Departments": ["id", "companyId", "branchId", "name", "code", "managerId", "status"],
    "Employees": ["id", "companyId", "branchId", "departmentId", "firstName", "lastName", "email", "phone", "position", "hireDate", "salary", "status"],
    "Customers": ["id", "companyId", "name", "type", "email", "phone", "taxId", "address", "city", "country", "creditLimit", "currency", "language", "status"],
    "Suppliers": ["id", "companyId", "name", "email", "phone", "taxId", "address", "city", "country", "currency", "status"],
    "Products": ["id", "companyId", "sku", "barcode", "name", "description", "categoryId", "brandId", "unitId", "costPrice", "sellingPrice", "taxRate", "minStock", "maxStock", "status"],
    "Categories": ["id", "companyId", "name", "parentId", "level", "status"],
    "Units": ["id", "companyId", "code", "name", "type"],
    "Warehouses": ["id", "companyId", "branchId", "name", "code", "address", "managerId", "status"],
    "Stock": ["id", "productId", "warehouseId", "quantity", "reservedQty", "availableQty", "batchNumber", "serialNumber", "expiryDate", "lastUpdated"],
    "Sales": ["id", "companyId", "branchId", "customerId", "invoiceNumber", "date", "dueDate", "subtotal", "taxAmount", "discountAmount", "total", "paidAmount", "status", "currency"],
    "SalesItems": ["id", "saleId", "productId", "quantity", "unitPrice", "taxRate", "discount", "total"],
    "SalesReturns": ["id", "companyId", "saleId", "customerId", "date", "reason", "total", "status", "createdBy"],
    "Purchases": ["id", "companyId", "branchId", "supplierId", "orderNumber", "date", "dueDate", "subtotal", "taxAmount", "total", "status", "currency"],
    "PurchaseItems": ["id", "purchaseId", "productId", "quantity", "unitPrice", "taxRate", "total"],
    "PurchaseInvoices": ["id", "companyId", "purchaseId", "supplierId", "invoiceNumber", "date", "subtotal", "taxAmount", "total", "status", "currency"],
    "Payments": ["id", "companyId", "saleId", "customerId", "supplierId", "amount", "method", "date", "reference", "notes", "type"],
    "PurchasePayments": ["id", "companyId", "purchaseId", "supplierId", "amount", "method", "date", "reference", "notes"],
    "Receipts": ["id", "companyId", "purchaseId", "supplierId", "amount", "method", "date", "reference"],
    "Cashboxes": ["id", "companyId", "branchId", "name", "currency", "balance"],
    "Banks": ["id", "companyId", "name", "accountNumber", "bankName", "currency", "balance"],
    "Accounts": ["id", "companyId", "code", "name", "type", "parentId", "level", "balance", "status"],
    "Journal": ["id", "companyId", "voucherNumber", "date", "description", "reference", "totalDebit", "totalCredit", "status", "postedBy", "postedAt"],
    "JournalLines": ["id", "journalId", "accountId", "description", "debit", "credit", "branchId", "costCenterId"],
    "CostCenters": ["id", "companyId", "code", "name", "type", "status"],
    "Assets": ["id", "companyId", "code", "name", "category", "purchaseDate", "cost", "depreciationMethod", "usefulLife", "accumulatedDepreciation", "netValue"],
    "Payroll": ["id", "companyId", "employeeId", "period", "basicSalary", "allowances", "overtime", "deductions", "netSalary", "status", "paidDate"],
    "Attendance": ["id", "companyId", "employeeId", "date", "checkIn", "checkOut", "hoursWorked", "lateMinutes", "status"],
    "Leaves": ["id", "companyId", "employeeId", "type", "startDate", "endDate", "days", "status", "approvedBy", "approvedAt"],
    "Projects": ["id", "companyId", "name", "code", "description", "startDate", "endDate", "budget", "status", "managerId"],
    "Tasks": ["id", "projectId", "name", "description", "assignedTo", "dueDate", "priority", "status", "completedAt"],
    "Notifications": ["id", "userId", "type", "title", "message", "isRead", "createdAt", "actionUrl"],
    "AuditLogs": ["id", "userId", "action", "entity", "entityId", "oldValue", "newValue", "ipAddress", "timestamp"],
    "ProductActivities": ["id", "productId", "userId", "userName", "action", "details", "createdAt"],
    "SupplierActivities": ["id", "supplierId", "userId", "userName", "action", "details", "createdAt"],
    "Settings": ["id", "key", "value", "type", "companyId", "updatedAt"],
    "Translations": ["id", "key", "ar", "en", "fr", "es", "de", "it", "pt", "tr", "ru", "zh-CN"],
}

def run_gws(args):
    cmd = ["gws"] + args
    result = subprocess.run(cmd, text=True, capture_output=True)
    if result.returncode:
        print(result.stderr or result.stdout, file=sys.stderr)
        raise SystemExit(result.returncode)
    return json.loads(result.stdout)

meta = run_gws(["sheets", "spreadsheets", "get", "--params", json.dumps({"spreadsheetId": SPREADSHEET_ID, "includeGridData": False})])
existing = {s["properties"]["title"]: s["properties"]["sheetId"] for s in meta.get("sheets", [])}
requests = []
for title in headers:
    if title not in existing:
        requests.append({"addSheet": {"properties": {"title": title}}})
if requests:
    run_gws(["sheets", "spreadsheets", "batchUpdate", "--params", json.dumps({"spreadsheetId": SPREADSHEET_ID}), "--json", json.dumps({"requests": requests})])

meta = run_gws(["sheets", "spreadsheets", "get", "--params", json.dumps({"spreadsheetId": SPREADSHEET_ID, "includeGridData": False})])
existing = {s["properties"]["title"]: s["properties"]["sheetId"] for s in meta.get("sheets", [])}
updates = []
for title, row in headers.items():
    if title in existing:
        updates.append({"range": f"'{title}'!A1", "majorDimension": "ROWS", "values": [row]})
run_gws(["sheets", "spreadsheets", "values", "batchUpdate", "--params", json.dumps({"spreadsheetId": SPREADSHEET_ID}), "--json", json.dumps({"valueInputOption": "RAW", "data": updates})])

print(json.dumps({"spreadsheetId": SPREADSHEET_ID, "sheetCount": len(existing), "sheets": list(headers), "status": "initialized"}, ensure_ascii=False, indent=2))
Path("/home/ubuntu/FINOVATE-ERP-X/sheets-schema.json").write_text(json.dumps(headers, ensure_ascii=False, indent=2), encoding="utf-8")
