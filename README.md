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
│   └── localization.js    # Multi-Language Engine
│
├── locales/               # Language Files (35 languages)
│   ├── ar.json           # Arabic (RTL)
│   ├── en.json           # English
│   ├── fr.json           # French
│   ├── es.json           # Spanish
│   └── ... (31 more)
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

- [x] Phase 01: Core Architecture + Localization
- [x] Phase 02: Authentication + Users + Roles
- [ ] Phase 03: Company + Branches
- [ ] Phase 04: Customers + Suppliers
- [ ] Phase 05: Products + Inventory
- [ ] Phase 06: Sales + POS
- [ ] Phase 07: Purchasing
- [ ] Phase 08: Accounting
- [ ] Phase 09: Cash + Banks
- [ ] Phase 10: HR + Employees
- [ ] Phase 11: Payroll + Attendance
- [ ] Phase 12: Assets + Cost Centers
- [ ] Phase 13: CRM
- [ ] Phase 14: Manufacturing
- [ ] Phase 15: Fleet Management
- [ ] Phase 16: Projects
- [ ] Phase 17: Reports + BI
- [ ] Phase 18: Documents + Google Drive
- [ ] Phase 19: Backup + Restore
- [ ] Phase 20: Security + Audit Trail
- [ ] Phase 21: AI Integration

## 🔧 Google Apps Script Setup

1. Create a new Google Spreadsheet
2. Go to Extensions → Apps Script
3. Copy the contents of `apps-script/Code.gs` and `apps-script/Database.gs`
4. Deploy as Web App
5. Update the API endpoint in your frontend

## 📝 License

© 2025 FINOVATE – AHMED EG. All Rights Reserved.  
Developer: Ahmed Mostafa Ibrahim
