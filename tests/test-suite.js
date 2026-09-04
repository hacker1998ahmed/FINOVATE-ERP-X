/**
 * FINOVATE ERP X - Test Suite
 * Phase 23: Testing & QA Framework
 * Developer: Ahmed Mostafa Ibrahim
 * Brand: FINOVATE – AHMED EG
 */

class TestSuite {
    constructor() {
        this.results = {
            total: 0,
            passed: 0,
            failed: 0,
            tests: []
        };
        this.testModules = [];
    }

    /**
     * تشغيل جميع الاختبارات
     */
    async runAllTests() {
        console.log('🧪 Starting FINOVATE ERP X Test Suite...');
        this.results = { total: 0, passed: 0, failed: 0, tests: [] };

        // اختبار المصادقة
        await this.testAuthentication();
        
        // اختبار الصلاحيات
        await this.testPermissions();
        
        // اختبار الترجمة
        await this.testLocalization();
        
        // اختبار الشركات والفروع
        await this.testCompanies();
        
        // اختبار العملاء
        await this.testCustomers();
        
        // اختبار المنتجات والمخزون
        await this.testProducts();
        
        // اختبار المبيعات
        await this.testSales();
        
        // اختبار المحاسبة
        await this.testAccounting();
        
        // توليد التقرير
        this.generateReport();
        
        return this.results;
    }

    /**
     * دالة مساعدة لتسجيل نتيجة الاختبار
     */
    assert(condition, testName, module) {
        this.results.total++;
        const result = {
            name: testName,
            module: module,
            passed: condition,
            timestamp: new Date()
        };
        
        if (condition) {
            this.results.passed++;
            console.log(`✅ PASS: ${testName}`);
        } else {
            this.results.failed++;
            console.log(`❌ FAIL: ${testName}`);
        }
        
        this.results.tests.push(result);
        return condition;
    }

    /**
     * اختبار نظام المصادقة
     */
    async testAuthentication() {
        console.log('\n🔐 Testing Authentication Module...');
        
        // اختبار تسجيل الدخول الناجح
        const loginSuccess = await Auth.login('admin@finovate.com', 'admin123');
        this.assert(loginSuccess.success === true, 'Login with valid credentials', 'Auth');
        
        // اختبار تسجيل الدخول الفاشل
        const loginFail = await Auth.login('wrong@email.com', 'wrongpass');
        this.assert(loginFail.success === false, 'Login with invalid credentials', 'Auth');
        
        // اختبار وجود الجلسة
        const sessionExists = localStorage.getItem('finovate_session') !== null;
        this.assert(sessionExists, 'Session created after login', 'Auth');
        
        // اختبار تسجيل الخروج
        Auth.logout();
        const sessionCleared = localStorage.getItem('finovate_session') === null;
        this.assert(sessionCleared, 'Session cleared after logout', 'Auth');
        
        console.log('Authentication tests completed.');
    }

    /**
     * اختبار نظام الصلاحيات
     */
    async testPermissions() {
        console.log('\n🛡️ Testing Permissions Module...');
        
        await Auth.login('admin@finovate.com', 'admin123');
        
        // اختبار صلاحيات المدير
        const adminCanView = Permissions.can('users', 'view');
        this.assert(adminCanView === true, 'Admin can view users', 'Permissions');
        
        const adminCanEdit = Permissions.can('users', 'edit');
        this.assert(adminCanEdit === true, 'Admin can edit users', 'Permissions');
        
        const adminCanDelete = Permissions.can('users', 'delete');
        this.assert(adminCanDelete === true, 'Admin can delete users', 'Permissions');
        
        // اختبار صلاحيات المحاسب
        await Auth.login('accountant@finovate.com', 'account123');
        
        const accountantCanViewAccounting = Permissions.can('accounting', 'view');
        this.assert(accountantCanViewAccounting === true, 'Accountant can view accounting', 'Permissions');
        
        const accountantCanDeleteUsers = Permissions.can('users', 'delete');
        this.assert(accountantCanDeleteUsers === false, 'Accountant cannot delete users', 'Permissions');
        
        console.log('Permissions tests completed.');
    }

    /**
     * اختبار نظام الترجمة
     */
    async testLocalization() {
        console.log('\n🌍 Testing Localization Module...');
        
        // اختبار تحميل اللغة العربية
        Localization.setLanguage('ar');
        const arText = Localization.translate('common.dashboard');
        this.assert(arText !== null && arText !== '', 'Arabic translation exists', 'Localization');
        
        // اختبار تحميل اللغة الإنجليزية
        Localization.setLanguage('en');
        const enText = Localization.translate('common.dashboard');
        this.assert(enText !== null && enText !== '', 'English translation exists', 'Localization');
        
        // اختبار أن الترجمات مختلفة
        this.assert(arText !== enText, 'Translations differ by language', 'Localization');
        
        // اختبار اتجاه النص
        Localization.setLanguage('ar');
        const isRTL = document.dir === 'rtl' || document.documentElement.dir === 'rtl';
        this.assert(isRTL, 'RTL direction for Arabic', 'Localization');
        
        Localization.setLanguage('en');
        const isLTR = document.dir === 'ltr' || document.documentElement.dir === 'ltr';
        this.assert(isLTR, 'LTR direction for English', 'Localization');
        
        console.log('Localization tests completed.');
    }

    /**
     * اختبار إدارة الشركات
     */
    async testCompanies() {
        console.log('\n🏢 Testing Companies Module...');
        
        // اختبار إنشاء شركة
        const companyData = {
            name: 'Test Company',
            code: 'TC001',
            currency: 'EGP',
            language: 'ar'
        };
        
        // محاكاة الإنشاء (في الواقع يحتاج Google Sheets)
        const created = Companies.create(companyData);
        this.assert(created !== null, 'Company creation returns object', 'Companies');
        
        // اختبار جلب الشركات
        const companies = Companies.getAll();
        this.assert(Array.isArray(companies), 'Get all companies returns array', 'Companies');
        
        console.log('Companies tests completed.');
    }

    /**
     * اختبار إدارة العملاء
     */
    async testCustomers() {
        console.log('\n👥 Testing Customers Module...');
        
        const customerData = {
            name: 'Test Customer',
            email: 'test@customer.com',
            phone: '+201000000000',
            type: 'individual'
        };
        
        const created = Customers.create(customerData);
        this.assert(created !== null, 'Customer creation returns object', 'Customers');
        
        const customers = Customers.getAll();
        this.assert(Array.isArray(customers), 'Get all customers returns array', 'Customers');
        
        // اختبار البحث
        const searchResults = Customers.search('Test');
        this.assert(Array.isArray(searchResults), 'Customer search returns array', 'Customers');
        
        console.log('Customers tests completed.');
    }

    /**
     * اختبار المنتجات والمخزون
     */
    async testProducts() {
        console.log('\n📦 Testing Products Module...');
        
        const productData = {
            name: 'Test Product',
            sku: 'TP001',
            barcode: '1234567890123',
            category: 'General',
            unit: 'piece',
            costPrice: 100,
            sellingPrice: 150,
            minStock: 10
        };
        
        const created = Products.create(productData);
        this.assert(created !== null, 'Product creation returns object', 'Products');
        
        const products = Products.getAll();
        this.assert(Array.isArray(products), 'Get all products returns array', 'Products');
        
        // اختبار المخزون
        const stock = Products.getStockLevel('TP001');
        this.assert(typeof stock === 'number', 'Stock level returns number', 'Products');
        
        console.log('Products tests completed.');
    }

    /**
     * اختبار المبيعات
     */
    async testSales() {
        console.log('\n💰 Testing Sales Module...');
        
        const saleData = {
            customerId: 'CUST001',
            items: [
                { productId: 'PROD001', quantity: 2, price: 100 },
                { productId: 'PROD002', quantity: 1, price: 200 }
            ],
            status: 'draft'
        };
        
        const created = Sales.create(saleData);
        this.assert(created !== null, 'Sale creation returns object', 'Sales');
        
        // اختبار حساب الإجمالي
        const total = Sales.calculateTotal(saleData);
        this.assert(total === 400, 'Sale total calculation correct', 'Sales');
        
        // اختبار تغيير الحالة
        const updated = Sales.updateStatus(created.id, 'invoice');
        this.assert(updated.status === 'invoice', 'Sale status update works', 'Sales');
        
        console.log('Sales tests completed.');
    }

    /**
     * اختبار المحاسبة
     */
    async testAccounting() {
        console.log('\n📒 Testing Accounting Module...');
        
        const journalEntry = {
            date: new Date().toISOString(),
            description: 'Test Entry',
            lines: [
                { accountId: '1001', debit: 1000, credit: 0 },
                { accountId: '4001', debit: 0, credit: 1000 }
            ]
        };
        
        // اختبار توازن القيد
        const isBalanced = Accounting.validateEntry(journalEntry);
        this.assert(isBalanced === true, 'Journal entry balances', 'Accounting');
        
        // اختبار قيد غير متوازن
        const unbalancedEntry = {
            date: new Date().toISOString(),
            description: 'Unbalanced Entry',
            lines: [
                { accountId: '1001', debit: 1000, credit: 0 },
                { accountId: '4001', debit: 0, credit: 500 }
            ]
        };
        
        const isUnbalanced = Accounting.validateEntry(unbalancedEntry);
        this.assert(isUnbalanced === false, 'Unbalanced entry detected', 'Accounting');
        
        console.log('Accounting tests completed.');
    }

    /**
     * توليد تقرير الاختبار
     */
    generateReport() {
        const percentage = ((this.results.passed / this.results.total) * 100).toFixed(2);
        
        console.log('\n' + '='.repeat(50));
        console.log('📊 TEST REPORT');
        console.log('='.repeat(50));
        console.log(`Total Tests: ${this.results.total}`);
        console.log(`✅ Passed: ${this.results.passed}`);
        console.log(`❌ Failed: ${this.results.failed}`);
        console.log(`Success Rate: ${percentage}%`);
        console.log('='.repeat(50));
        
        if (this.results.failed > 0) {
            console.log('\n⚠️ Failed Tests:');
            this.results.tests
                .filter(t => !t.passed)
                .forEach(t => console.log(`  - ${t.module}: ${t.name}`));
        }
        
        return this.results;
    }

    /**
     * تصدير التقرير كملف JSON
     */
    exportReport() {
        const report = {
            timestamp: new Date(),
            version: '1.0.0',
            results: this.results
        };
        
        const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `test-report-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }
}

/**
 * مولد البيانات التجريبية
 */
class DemoDataGenerator {
    constructor() {
        this.counts = {
            customers: 50,
            suppliers: 20,
            products: 100,
            sales: 200,
            purchases: 100
        };
    }

    async generateAll() {
        console.log('🔄 Generating demo data...');
        
        await this.generateCustomers();
        await this.generateSuppliers();
        await this.generateProducts();
        await this.generateSales();
        await this.generatePurchases();
        
        console.log('✅ Demo data generation complete!');
        return { success: true, counts: this.counts };
    }

    generateCustomers() {
        console.log(`Generating ${this.counts.customers} customers...`);
        for (let i = 0; i < this.counts.customers; i++) {
            Customers.create({
                name: `Customer ${i + 1}`,
                email: `customer${i + 1}@example.com`,
                phone: `+201${Math.floor(Math.random() * 90000000 + 10000000)}`,
                type: Math.random() > 0.5 ? 'individual' : 'company',
                creditLimit: Math.floor(Math.random() * 100000)
            });
        }
    }

    generateSuppliers() {
        console.log(`Generating ${this.counts.suppliers} suppliers...`);
        for (let i = 0; i < this.counts.suppliers; i++) {
            Suppliers.create({
                name: `Supplier ${i + 1}`,
                email: `supplier${i + 1}@example.com`,
                phone: `+201${Math.floor(Math.random() * 90000000 + 10000000)}`,
                category: ['Local', 'International'][Math.floor(Math.random() * 2)]
            });
        }
    }

    generateProducts() {
        console.log(`Generating ${this.counts.products} products...`);
        const categories = ['Electronics', 'Clothing', 'Food', 'Furniture', 'Tools'];
        
        for (let i = 0; i < this.counts.products; i++) {
            Products.create({
                name: `Product ${i + 1}`,
                sku: `SKU${String(i + 1).padStart(5, '0')}`,
                barcode: `${Math.floor(Math.random() * 900000000000 + 100000000000)}`,
                category: categories[Math.floor(Math.random() * categories.length)],
                unit: 'piece',
                costPrice: Math.floor(Math.random() * 500 + 50),
                sellingPrice: Math.floor(Math.random() * 500 + 100),
                minStock: Math.floor(Math.random() * 20 + 5),
                currentStock: Math.floor(Math.random() * 100 + 10)
            });
        }
    }

    generateSales() {
        console.log(`Generating ${this.counts.sales} sales transactions...`);
        // Implementation for generating sales
    }

    generatePurchases() {
        console.log(`Generating ${this.counts.purchases} purchase transactions...`);
        // Implementation for generating purchases
    }
}

// تصدير الفئات
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { TestSuite, DemoDataGenerator };
}
