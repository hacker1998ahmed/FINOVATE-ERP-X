# 🌍 FINOVATE ERP X
## Complete Enterprise Resource Planning & Business Management System

<div align="center">

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![License](https://img.shields.io/badge/license-proprietary-red.svg)
![Status](https://img.shields.io/badge/status-production%20ready-green.svg)
![Languages](https://img.shields.io/badge/languages-35-orange.svg)

**Brand:** FINOVATE – AHMED EG  
**Developer:** Ahmed Mostafa Ibrahim  
**Technology Stack:** HTML5 + CSS3 + JavaScript (Vanilla) + Google Apps Script + Google Sheets + Google Drive

[Features](#-features) • [Installation](#-installation) • [Usage](#-usage) • [Documentation](#-documentation) • [Security](SECURITY.md)

</div>

---

## 🚀 About The Project

**FINOVATE ERP X** is a comprehensive, cloud-based Enterprise Resource Planning system designed to manage all aspects of a business. Built from the ground up to be **Multi-Company, Multi-Branch, Multi-Currency, and Multi-Language**, it leverages the power of Google Cloud Stack (Sheets, Drive, Apps Script) to provide a robust, scalable, and cost-effective solution without the need for traditional server infrastructure.

### 🎯 Key Capabilities
- **Financial Management:** Full Accounting, Cash/Bank, Budgeting, Assets.
- **Operations:** Sales, POS, Purchasing, Inventory, Manufacturing, Fleet.
- **Human Capital:** HR, Payroll, Attendance, Leave Management.
- **Growth:** CRM, Projects, Business Intelligence (BI), AI Assistant.
- **Global Ready:** 35+ Languages, RTL/LTR Support, Multi-Currency.

---

## ✨ Features

### 🏢 Core Architecture
- ✅ **Multi-Tenancy:** Support for unlimited Companies, Branches, and Warehouses.
- ✅ **Security:** Role-Based Access Control (RBAC) with granular permissions (View, Create, Edit, Delete, Approve, etc.).
- ✅ **Audit Trail:** Complete logging of every action taken in the system.
- ✅ **Offline First:** PWA enabled with Service Workers for offline usage and sync.

### 🌐 Internationalization (i18n)
- 🌍 **35+ Languages:** Arabic, English, French, Spanish, German, Chinese, Japanese, and more.
- 🔄 **Auto Direction:** Automatic switching between RTL (Right-to-Left) and LTR (Left-to-Right) based on language.
- 📅 **Localization:** Date, time, currency, and number formatting per locale.

### 💰 Finance & Accounting
- 📒 General Ledger, Chart of Accounts, Journal Entries.
- 📊 Financial Statements (Balance Sheet, Income Statement, Cash Flow).
- 🏦 Bank Reconciliation & Cash Box Management.
- 📉 Budgeting & Cost Centers.
- 🏭 Fixed Assets & Depreciation.

### 📦 Operations & Supply Chain
- 🛒 End-to-End Purchasing Cycle (RFQ → PO → GRN → Invoice).
- 💳 End-to-End Sales Cycle (Quotation → Order → Delivery → Invoice).
- 🏪 Point of Sale (POS) with Barcode support and Shift Management.
- 📦 Advanced Inventory (Batches, Serial Numbers, Expiry Dates).
- 🏭 Manufacturing (BOM, Work Orders, Production Costs).
- 🚚 Fleet Management (Vehicles, Fuel, Maintenance).

### 👥 Human Resources
- 👨‍💼 Employee Database & Documents.
- ⏱️ Attendance & Shifts.
- 💵 Payroll Engine (Salary, Allowances, Deductions, Loans).
- 🗓️ Leave Management & Workflows.

### 📈 Intelligence & Growth
- 🤖 **Finovate AI:** AI-powered assistant for insights and data entry.
- 📊 **BI Dashboard:** Real-time analytics and KPIs.
- 🤝 **CRM:** Leads, Opportunities, and Pipeline management.
- 📑 **Document Management:** Integrated with Google Drive.

---

## 🛠️ Technology Stack

| Layer | Technology |
| :--- | :--- |
| **Frontend** | HTML5, CSS3, Vanilla JavaScript (ES6+) |
| **Backend** | Google Apps Script (Serverless) |
| **Database** | Google Sheets (Structured Data) |
| **Storage** | Google Drive (Documents & Attachments) |
| **PWA** | Service Workers, Manifest.json |
| **Charts** | Chart.js (Integrated) |
| **Icons** | FontAwesome / Material Icons |

---

## 📦 Installation

### Prerequisites
- A Google Account.
- A code editor (VS Code recommended).
- Python (for local testing) or any static file server.

### Step 1: Clone the Repository
```bash
git clone https://github.com/yourusername/finovate-erp-x.git
cd finovate-erp-x
```

### Step 2: Setup Google Backend
1. Go to [Google Apps Script](https://script.google.com/).
2. Create a new project.
3. Copy the contents of `/apps-script/Code.gs` and `/apps-script/Database.gs` into the editor.
4. Deploy as a Web App:
   - **Execute as:** Me
   - **Who has access:** Anyone
5. Copy the generated URL.

### Step 3: Configure Frontend
1. Open `js/api.js`.
2. Replace `YOUR_GOOGLE_SCRIPT_URL` with the URL from Step 2.
3. (Optional) Create a new Google Sheet to act as your database and note the ID if manual setup is required (though the script auto-creates sheets).

### Step 4: Run Locally
```bash
# Using Python
python3 -m http.server 4173

# Or using Node.js (http-server)
npx http-server -p 4173
```
Open your browser at `http://localhost:4173`.

---

## 💻 Usage

### Default Login Credentials
| Role | Email | Password | Permissions |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@finovate.com` | `admin123` | Full Access |
| **Manager** | `manager@finovate.com` | `manager123` | Approval & Reports |
| **Accountant** | `accountant@finovate.com` | `account123` | Finance & Accounting |

### Generating Demo Data
To test the system with realistic data:
1. Log in as **Admin**.
2. Navigate to **Settings > System Tools**.
3. Click **"Generate Demo Data"**. This will populate customers, products, invoices, and employees.

---

## 📂 Project Structure

```
FINOVATE_ERP_X/
├── apps-script/          # Backend logic (Google Apps Script)
├── css/                  # Stylesheets (Core, Auth, RTL, Themes)
├── js/                   # Frontend Logic (Modules, Controllers, Services)
│   ├── auth.js           # Authentication
│   ├── accounting.js     # Finance Module
│   ├── sales.js          # Sales Module
│   ├── ai-assistant.js   # AI Logic
│   └── ...               # (27+ Modules)
├── locales/              # Translation files (35 Languages)
├── tests/                # QA and Unit Tests
├── index.html            # Main Dashboard (PWA)
├── login.html            # Login Page
├── manifest.json         # PWA Configuration
├── sw.js                 # Service Worker
├── README.md             # Documentation
└── SECURITY.md           # Security Policy
```

---

## 🔒 Security

FINOVATE ERP X takes security seriously.
- **Data Encryption:** All data transmitted via HTTPS (Google Infrastructure).
- **Access Control:** Granular RBAC ensures users only see what they are allowed to.
- **Audit Logs:** Every change is recorded with user ID, timestamp, and old/new values.
- **Session Management:** Automatic timeout and secure token handling.

For detailed security policies, see [SECURITY.md](SECURITY.md).

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:
1. Fork the repository.
2. Create a feature branch (`git checkout -b feature/AmazingFeature`).
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`).
4. Push to the branch (`git push origin feature/AmazingFeature`).
5. Open a Pull Request.

---

## 📄 License

This project is proprietary software developed by **FINOVATE – AHMED EG**.
All rights reserved © 2024 Ahmed Mostafa Ibrahim.

---

## 👨‍💻 Developer Info

**Ahmed Mostafa Ibrahim**  
*Lead Developer & System Architect*  
🌐 [Website](#) | 📧 [Email](#) | 💼 [LinkedIn](#)

---

<div align="center">
  <sub>Built with ❤️ by FINOVATE Team</sub>
</div>
