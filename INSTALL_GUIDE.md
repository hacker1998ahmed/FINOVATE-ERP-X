# 🚀 FINOVATE ERP X - دليل التثبيت والنشر

## نظرة عامة
**FINOVATE ERP X** هو نظام تخطيط موارد المؤسسات متكامل مصمم لإدارة الشركات والمؤسسات بشكل احترافي.

**المطور:** Ahmed Mostafa Ibrahim  
**العلامة التجارية:** FINOVATE – AHMED EG  
**الإصدار:** 1.0.0  
**التقنيات:** HTML5, CSS3, JavaScript, Google Apps Script, Google Sheets, Google Drive

---

## 📋 المتطلبات الأساسية

### للتشغيل المحلي:
- Python 3.x (للخادم المحلي)
- متصفح حديث (Chrome, Firefox, Edge, Safari)

### للنشر الإنتاجي:
- حساب Google (لـ Google Apps Script و Google Sheets)
- استضافة ويب (اختياري - يمكن استخدام GitHub Pages مجاناً)

---

## 🔧 خطوات التثبيت

### 1. التحضير الأولي

```bash
cd /workspace
```

### 2. إعداد Google Apps Script (Backend)

1. اذهب إلى [script.google.com](https://script.google.com)
2. اضغط على **New Project**
3. انسخ محتويات مجلد `apps-script/`:
   - `Code.gs` - الواجهة الرئيسية للـ API
   - `Database.gs` - عمليات قاعدة البيانات
4. الصق الكود في المحرر
5. احفظ المشروع باسم "FINOVATE ERP X"

### 3. نشر Google Apps Script

1. اضغط على **Deploy** > **New Deployment**
2. اختر النوع: **Web App**
3. الإعدادات:
   - **Execute as:** Me
   - **Who has access:** Anyone
4. اضغط **Deploy**
5. انسخ رابط الـ URL الناتج (سيبدأ بـ `https://script.google.com/macros/s/...`)

### 4. تحديث إعدادات الواجهة

افتح ملف `/workspace/js/api.js` واستبدل:
```javascript
const GOOGLE_SCRIPT_URL = 'YOUR_GOOGLE_SCRIPT_URL';
```
بـ:
```javascript
const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec';
```

### 5. إعداد قاعدة البيانات (Google Sheets)

1. أنشئ Google Sheet جديد
2. سمّه "FINOVATE ERP Database"
3. أنشئ الأوراق (Sheets) التالية بالأسماء الدقيقة:
   - Users
   - Roles
   - Permissions
   - Companies
   - Branches
   - Customers
   - Suppliers
   - Products
   - Categories
   - Warehouses
   - Stock
   - Sales
   - SalesItems
   - Purchases
   - PurchaseItems
   - Accounts
   - Journal
   - JournalLines
   - Cashboxes
   - Banks
   - Employees
   - Departments
   - Payroll
   - Attendance
   - AuditLogs
   - Settings

4. أضف الأعمدة المناسبة لكل ورقة (راجع `Database.gs`)

5. انسخ معرف الـ Sheet من الرابط (بين `/d/` و `/edit`)
6. أضفه في `Database.gs`:
   ```javascript
   const SPREADSHEET_ID = 'YOUR_SPREADSHEET_ID';
   ```

---

## 🌐 النشر للإنتاج

### الطريقة 1: استخدام سكريبت النشر (موصى به)

```bash
chmod +x deploy.sh
./deploy.sh
```

سيقوم السكريبت بـ:
- التحقق من المتطلبات
- نسخ الملفات إلى مجلد `dist/`
- إنشاء ملف التكوين
- عرض تعليمات النشر

### الطريقة 2: GitHub Pages (مجاني)

```bash
# تأكد من وجود Git
git init
git add .
git commit -m "Initial commit"

# ارفع المستودع إلى GitHub
git remote add origin https://github.com/yourusername/finovate-erp.git
git push -u origin main

# في GitHub:
# Settings > Pages > Source > main branch > Save
```

### الطريقة 3: Netlify (مجاني)

1. اذهب إلى [netlify.com](https://netlify.com)
2. اسحب وأفلت مجلد `dist/`
3. سيتم النشر تلقائياً

### الطريقة 4: Vercel (مجاني)

```bash
npm install -g vercel
cd dist
vercel
```

---

## ▶️ التشغيل المحلي

### للخادم المحلي:

```bash
cd /workspace
python3 -m http.server 4173
```

افتح المتصفح على:
```
http://localhost:4173
```

أو للتشغيل المباشر:
```bash
# افتح index.html مباشرة في المتصفح
```

---

## 🔐 بيانات الدخول الافتراضية

بعد التثبيت، استخدم هذه الحسابات للتجربة:

| الدور | البريد الإلكتروني | كلمة المرور | الصلاحيات |
|-------|------------------|-------------|-----------|
| مدير النظام | admin@finovate.com | admin123 | صلاحيات كاملة |
| محاسب | accountant@finovate.com | account123 | عمليات محاسبية |
| مدير | manager@finovate.com | manager123 | عرض وموافقات |

**⚠️ مهم:** غيّر كلمات المرور فوراً بعد أول دخول!

---

## 📱 تثبيت كتطبيق (PWA)

النظام يدعم التثبيت كتطبيق Progressive Web App:

### على Chrome/Edge (Desktop):
1. افتح النظام
2. انقر على أيقونة **+** أو **تثبيت** في شريط العنوان
3. اتبع التعليمات

### على Android (Chrome):
1. افتح النظام
2. انقر على القائمة (⋮)
3. اختر **Add to Home screen**

### على iOS (Safari):
1. افتح النظام
2. انقر على زر المشاركة
3. اختر **Add to Home Screen**

---

## 🧪 الاختبار والجودة

### تشغيل مجموعة الاختبارات:

```bash
# افتح المتصفح على:
http://localhost:4173/tests/test-suite.html
```

أو من وحدة التحكم:
```javascript
const tests = new TestSuite();
tests.runAllTests();
```

### توليد بيانات تجريبية:

```javascript
const generator = new DemoDataGenerator();
generator.generateAll();
```

---

## 🔄 النسخ الاحتياطي

### النسخ اليدوي:
1. اذهب إلى **الإعدادات** > **النسخ الاحتياطي**
2. اضغط **تصدير البيانات**
3. احفظ الملف JSON

### النسخ التلقائي:
- يتم إعداد نسخة احتياطية يومية تلقائياً
- تُحفظ في Google Drive
- يمكن استعادتها من نفس الصفحة

---

## 🔒 الأمان

### أفضل الممارسات:
1. غيّر كلمات المرور الافتراضية فوراً
2. فعّل المصادقة الثنائية (إن وجدت)
3. حدّث الصلاحيات حسب الحاجة
4. راقب سجل التدقيق بانتظام
5. خذ نسخاً احتياطية منتظمة

---

## 🛠️ الدعم الفني

### للمساعدة:
- **المطور:** Ahmed Mostafa Ibrahim
- **العلامة التجارية:** FINOVATE – AHMED EG
- **الإصدار:** 1.0.0

### الملفات المهمة:
- `/README.md` - نظرة عامة على المشروع
- `/IMPLEMENTATION_STATUS.md` - حالة التنفيذ
- `/apps-script/` - كود الخلفية
- `/js/` - كود الواجهة
- `/locales/` - ملفات الترجمة

---

## 📊 الوحدات المكتملة (24/24)

✅ Phase 01-03: الأساسيات والمصادقة والشركات  
✅ Phase 04-07: العملاء والمنتجات والمبيعات والمشتريات  
✅ Phase 08-11: المحاسبة والبنوك والموارد البشرية والرواتب  
✅ Phase 12-17: الأصول وCRM والتصنيع والأسطول والمشاريع والميزانية  
✅ Phase 18-21: التقارير والمستندات والنسخ الاحتياطي والتدقيق  
✅ Phase 22: الذكاء الاصطناعي (Finovate AI)  
✅ Phase 23: الاختبار الشامل (QA)  
✅ Phase 24: النشر الإنتاجي (PWA)  

---

## 🎯 الميزات الرئيسية

- **35 لغة** مدعومة مع RTL/LTR تلقائي
- **Multi-Company** - إدارة شركات متعددة
- **Multi-Branch** - فروع غير محدودة
- **Multi-Warehouse** - مخازن متعددة
- **Multi-Currency** - عملات متعددة
- **RBAC** - صلاحيات متقدمة حسب الأدوار
- **Offline Mode** - يعمل بدون إنترنت (PWA)
- **AI Assistant** - مساعد ذكي مدمج
- **Audit Trail** - سجل تدقيق كامل
- **Responsive** - يعمل على جميع الأجهزة

---

## 📝 الترخيص

جميع الحقوق محفوظة © 2024 FINOVATE – AHMED EG  
Developer: Ahmed Mostafa Ibrahim

---

**🎉 جاهز للاستخدام!**

ابدأ الآن بتسجيل الدخول وتخصيص النظام حسب احتياجات شركتك.
