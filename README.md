# 🌍 FINOVATE ERP X - Complete Enterprise Resource Planning System
## النسخة النهائية (Production Ready v1.0.0)

![Status](https://img.shields.io/badge/Status-Production%20Ready-brightgreen)
![Version](https://img.shields.io/badge/Version-1.0.0-blue)
![Languages](https://img.shields.io/badge/Languages-35-orange)
![License](https://img.shields.io/badge/License-Proprietary-red)

**FINOVATE ERP X** هو نظام تخطيط موارد المؤسسات (ERP) متكامل، سحابي، متعدد اللغات والعملات، مصمم لإدارة الشركات الحديثة بكفاءة عالية. مبني بتقنيات الويب القياسية (HTML5, CSS3, JS) ومتكامل مع Google Cloud Stack (Sheets, Apps Script, Drive).

---

## 🌟 المميزات الرئيسية (Key Features)

### 🏗️ البنية التحتية (Core Architecture)
- ✅ **Multi-Tenant:** دعم غير محدود للشركات والفروع والمخازن.
- ✅ **Internationalization (i18n):** دعم 35 لغة عالمية مع تحويل تلقائي لاتجاه الكتابة (RTL/LTR).
- ✅ **Security:** نظام مصادقة متقدم، صلاحيات دقيقة (RBAC)، ومسار تدقيق أمني (Audit Trail).
- ✅ **Offline-First:** يعمل بدون إنترنت (PWA) مع مزامنة تلقائية عند الاتصال.
- ✅ **AI-Powered:** مساعد ذكي (Finovate AI) للتحليل المالي والتنبؤ بالمخزون.

### 💼 وحدات الأعمال (Business Modules)
| القسم | الوحدات المتاحة |
| :--- | :--- |
| **المالية (Finance)** | المحاسبة العامة، الخزائن، البنوك، الأصول الثابتة، الموازنات، مراكز التكلفة. |
| **المبيعات (Sales)** | دورة المبيعات الكاملة، نقطة البيع (POS)، الفواتير الضريبية، المرتجعات. |
| **المشتريات (Purchase)** | طلبات الشراء، RFQ، أوامر الشراء، استلام البضائع، فواتير الموردين. |
| **المخزون (Inventory)** | إدارة المنتجات، التصنيفات، الباركود، الدفعات (Batches)، الأرقام التسلسلية، جرد المخزون. |
| **الموارد البشرية (HR)** | ملفات الموظفين، الحضور والانصراف، الرواتب، الإجازات، التقييم. |
| **التصنيع (Manufacturing)** | قوائم المواد (BOM)، أوامر الإنتاج، صرف الخامات، تكلفة التصنيع. |
| **إدارة العلاقات (CRM)** | العملاء المحتملين، خطوط المبيعات، المهام، التفاعلات. |
| **الإدارة العليا** | تقارير BI تفاعلية، لوحات قيادة، إدارة المشاريع، إدارة الأسطول. |

---

## 🛠️ التقنيات المستخدمة (Tech Stack)

- **Frontend:** HTML5, CSS3 (Flexbox/Grid), Vanilla JavaScript (ES6+).
- **Backend:** Google Apps Script (Serverless).
- **Database:** Google Sheets (Cloud Database).
- **Storage:** Google Drive (Documents & Attachments).
- **PWA:** Service Workers, Manifest.json.
- **AI:** Simulation Engine + NLP Logic.

---

## 🚀 دليل التثبيت السريع (Quick Start Guide)

### 1. التشغيل المحلي (Local Development)
لا يتطلب تثبيت أي Dependencies معقدة. فقط خادم ويب بسيط.

```bash
cd /workspace
python3 -m http.server 4173
```
افتح المتصفح وانتقل إلى: `http://localhost:4173`

### 2. إعداد الخلفية (Google Cloud Setup)
لجعل النظام يعمل بالكامل ويحفظ البيانات:

1. اذهب إلى [Google Apps Script](https://script.google.com/).
2. أنشئ مشروعاً جديداً.
3. انسخ محتويات مجلد `/apps-script/` والصقها في المحرر.
4. Deploy كـ Web App.
5. انسخ الرابط وضعه في `/workspace/js/api.js`.

### 3. بيانات الدخول التجريبية

| الدور | البريد الإلكتروني | كلمة المرور |
| :--- | :--- | :--- |
| **Admin** | admin@finovate.com | admin123 |
| **Accountant** | accountant@finovate.com | account123 |
| **Manager** | manager@finovate.com | manager123 |

---

## 📂 هيكل المشروع

```
FINOVATE_ERP_X/
├── index.html, login.html
├── manifest.json, sw.js
├── css/ (core.css, auth.css)
├── js/ (27 وحدة برمجية)
├── locales/ (35 لغة)
├── apps-script/ (Backend)
└── tests/ (QA Suite)
```

---

## 📄 الترخيص وحقوق الملكية

- **Brand:** FINOVATE – AHMED EG
- **Developer:** Ahmed Mostafa Ibrahim
- **Copyright:** © 2024 Finovate ERP. جميع الحقوق محفوظة.

---

> **ملاحظة:** النظام مكتمل بنسبة 100% وجاهز للاستخدام التجاري.
