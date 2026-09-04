# FINOVATE ERP X

**Complete Enterprise Resource Planning & Business Management System**

Brand: **FINOVATE – AHMED EG**  
Developer: **Ahmed Mostafa Ibrahim**  
Technology: HTML5 + CSS3 + JavaScript + Google Apps Script + Google Sheets + Google Drive

## 🌟 Features

- ✅ Multi-Language Support (35+ Languages)
- ✅ RTL/LTR Direction Support
- ✅ Responsive Design (Desktop, Tablet, Mobile)
- ✅ Authentication System with Role-Based Access
- ✅ Multi-Company Ready
- ✅ Google Sheets Database Integration
- ✅ Google Apps Script Backend

## 📁 Project Structure

```
FINOVATE_ERP_X/
├── index.html              # Main Dashboard
├── login.html              # Login Page
├── README.md               # Documentation
│
├── css/
│   ├── core.css           # Core Styles & Components
│   └── auth.css           # Authentication Pages Styles
│
├── js/
│   ├── app.js             # Main Application Logic
│   ├── auth.js            # Authentication Module
│   ├── localization.js    # Multi-Language Engine (35 languages)
│   ├── api.js             # API Client for Google Apps Script
│   ├── database.js        # Database Service with Cache
│   ├── permissions.js     # Role-Based Access Control
│   ├── companies.js       # Companies & Branches Management
│   ├── customers.js       # Customer Relationship Management
│   ├── suppliers.js       # Supplier Relationship Management
│   ├── products.js        # Products & Inventory Management
│   ├── sales.js           # Sales & Invoicing System
│   ├── pos.js             # Point of Sale (POS) System
│   └── purchasing.js      # Purchasing & Procurement
│
├── locales/               # Language Files (36 files)
│   ├── ar.json           # Arabic (RTL)
│   ├── en.json           # English
│   ├── fr.json           # French
│   ├── es.json           # Spanish
│   ├── de.json           # German
│   ├── ... (30 more)
│   └── auto.json         # Auto-detect fallback
│
└── apps-script/           # Google Apps Script Backend
    ├── Code.gs           # Main API Handler
    └── Database.gs       # Database Operations
```

## 🚀 Quick Start

### Run Locally

This is a dependency-free static application. Serve it with any static server:

```bash
python3 -m http.server 4173
```

Then open `http://localhost:4173/login.html` in your browser.

### Demo Credentials

| Email | Password | Role |
|-------|----------|------|
| admin@finovate.com | admin123 | Administrator |
| accountant@finovate.com | account123 | Accountant |
| manager@finovate.com | manager123 | Manager |

## 🌍 Supported Languages

Arabic, English, French, Spanish, German, Italian, Portuguese, Turkish, Russian, Chinese (Simplified & Traditional), Japanese, Korean, Hindi, Bengali, Urdu, Persian, Indonesian, Malay, Thai, Vietnamese, Dutch, Polish, Ukrainian, Romanian, Greek, Czech, Swedish, Danish, Norwegian, Finnish, Hungarian, Hebrew, Filipino

## 📊 Planned Modules

- [x] Phase 01: Core Architecture + Localization (35 Languages)
- [x] Phase 02: Authentication + Users + Roles
- [x] Phase 03: Company + Branches Management
- [x] Phase 04: Customers + Suppliers (CRM)
- [x] Phase 05: Products + Inventory + Warehouses
- [x] Phase 06: Sales + POS + Invoicing
- [x] Phase 07: Purchasing + Procurement
- [ ] Phase 08: Accounting + General Ledger
- [ ] Phase 09: Cash + Banks + Reconciliation
- [ ] Phase 10: HR + Employees + Departments
- [ ] Phase 11: Payroll + Attendance + Leaves
- [ ] Phase 12: Assets + Cost Centers
- [ ] Phase 13: CRM + Pipeline
- [ ] Phase 14: Manufacturing + BOM + Production
- [ ] Phase 15: Fleet Management
- [ ] Phase 16: Projects + Tasks
- [ ] Phase 17: Reports + BI + Analytics
- [ ] Phase 18: Documents + Google Drive Integration
- [ ] Phase 19: Backup + Restore
- [ ] Phase 20: Security + Audit Trail
- [ ] Phase 21: AI Integration (Finovate AI)
- [ ] Phase 22: Testing + QA
- [ ] Phase 23: Production Deployment

## 🔧 Google Apps Script Setup

1. Create a new Google Spreadsheet
2. Go to Extensions → Apps Script
3. Copy the contents of `apps-script/Code.gs` and `apps-script/Database.gs`
4. Deploy as Web App
5. Update the API endpoint in your frontend

## 📝 License

© 2025 FINOVATE – AHMED EG. All Rights Reserved.  
Developer: Ahmed Mostafa Ibrahim
