/**
 * FINOVATE ERP X - Accounting Module
 * Phase 08: Accounting + General Ledger
 * 
 * Features:
 * - Chart of Accounts (Multi-level)
 * - Journal Entries (Auto-balancing)
 * - General Ledger
 * - Trial Balance
 * - Financial Statements (Income Statement, Balance Sheet)
 * - Cost Centers
 * - Fiscal Years & Period Closing
 */

class AccountingModule {
    constructor() {
        this.accounts = [];
        this.journalEntries = [];
        this.costCenters = [];
        this.fiscalYears = [];
        this.currentFiscalYear = null;
        this.init();
    }

    async init() {
        await this.loadAccounts();
        await this.loadJournalEntries();
        await this.loadCostCenters();
        await this.loadFiscalYears();
    }

    // ==================== Chart of Accounts ====================
    
    async loadAccounts() {
        try {
            const response = await api.get('accounts');
            this.accounts = response.data || this.getDefaultAccounts();
        } catch (error) {
            console.error('Error loading accounts:', error);
            this.accounts = this.getDefaultAccounts();
        }
    }

    getDefaultAccounts() {
        return [
            // Assets (1xxx)
            { id: '1000', code: '1000', nameEn: 'Assets', nameAr: 'الأصول', type: 'asset', level: 1, parentId: null },
            { id: '1100', code: '1100', nameEn: 'Current Assets', nameAr: 'الأصول المتداولة', type: 'asset', level: 2, parentId: '1000' },
            { id: '1110', code: '1110', nameEn: 'Cash', nameAr: 'النقدية', type: 'asset', level: 3, parentId: '1100' },
            { id: '1120', code: '1120', nameEn: 'Bank Accounts', nameAr: 'الحسابات البنكية', type: 'asset', level: 3, parentId: '1100' },
            { id: '1130', code: '1130', nameEn: 'Accounts Receivable', nameAr: 'العملاء', type: 'asset', level: 3, parentId: '1100' },
            { id: '1140', code: '1140', nameEn: 'Inventory', nameAr: 'المخزون', type: 'asset', level: 3, parentId: '1100' },
            { id: '1200', code: '1200', nameEn: 'Fixed Assets', nameAr: 'الأصول الثابتة', type: 'asset', level: 2, parentId: '1000' },
            { id: '1210', code: '1210', nameEn: 'Property & Equipment', nameAr: 'المباني والمعدات', type: 'asset', level: 3, parentId: '1200' },
            
            // Liabilities (2xxx)
            { id: '2000', code: '2000', nameEn: 'Liabilities', nameAr: 'الخصوم', type: 'liability', level: 1, parentId: null },
            { id: '2100', code: '2100', nameEn: 'Current Liabilities', nameAr: 'الخصوم المتداولة', type: 'liability', level: 2, parentId: '2000' },
            { id: '2110', code: '2110', nameEn: 'Accounts Payable', nameAr: 'الموردون', type: 'liability', level: 3, parentId: '2100' },
            { id: '2120', code: '2120', nameEn: 'Accrued Expenses', nameAr: 'المصروفات المستحقة', type: 'liability', level: 3, parentId: '2100' },
            
            // Equity (3xxx)
            { id: '3000', code: '3000', nameEn: 'Equity', nameAr: 'حقوق الملكية', type: 'equity', level: 1, parentId: null },
            { id: '3100', code: '3100', nameEn: 'Share Capital', nameAr: 'رأس المال', type: 'equity', level: 2, parentId: '3000' },
            { id: '3200', code: '3200', nameEn: 'Retained Earnings', nameAr: 'الأرباح المبقاة', type: 'equity', level: 2, parentId: '3000' },
            
            // Revenue (4xxx)
            { id: '4000', code: '4000', nameEn: 'Revenue', nameAr: 'الإيرادات', type: 'revenue', level: 1, parentId: null },
            { id: '4100', code: '4100', nameEn: 'Sales Revenue', nameAr: 'إيرادات المبيعات', type: 'revenue', level: 2, parentId: '4000' },
            { id: '4200', code: '4200', nameEn: 'Service Revenue', nameAr: 'إيرادات الخدمات', type: 'revenue', level: 2, parentId: '4000' },
            
            // Expenses (5xxx)
            { id: '5000', code: '5000', nameEn: 'Expenses', nameAr: 'المصروفات', type: 'expense', level: 1, parentId: null },
            { id: '5100', code: '5100', nameEn: 'Cost of Goods Sold', nameAr: 'تكلفة البضاعة المباعة', type: 'expense', level: 2, parentId: '5000' },
            { id: '5200', code: '5200', nameEn: 'Salaries Expense', nameAr: 'مصروفات الرواتب', type: 'expense', level: 2, parentId: '5000' },
            { id: '5300', code: '5300', nameEn: 'Rent Expense', nameAr: 'مصروفات الإيجار', type: 'expense', level: 2, parentId: '5000' },
            { id: '5400', code: '5400', nameEn: 'Utilities Expense', nameAr: 'مصروفات المرافق', type: 'expense', level: 2, parentId: '5000' }
        ];
    }

    getAccountTree() {
        const tree = [];
        const accountMap = new Map();
        
        this.accounts.forEach(acc => {
            accountMap.set(acc.id, { ...acc, children: [] });
        });
        
        accountMap.forEach((acc, id) => {
            if (acc.parentId) {
                const parent = accountMap.get(acc.parentId);
                if (parent) {
                    parent.children.push(acc);
                } else {
                    tree.push(acc);
                }
            } else {
                tree.push(acc);
            }
        });
        
        return tree;
    }

    async createAccount(accountData) {
        const newAccount = {
            id: 'ACC-' + Date.now(),
            code: accountData.code,
            nameEn: accountData.nameEn,
            nameAr: accountData.nameAr,
            type: accountData.type,
            level: accountData.level,
            parentId: accountData.parentId,
            currency: accountData.currency || 'EGP',
            isActive: true,
            createdAt: new Date().toISOString(),
            createdBy: auth.getCurrentUser()?.email
        };
        
        this.accounts.push(newAccount);
        
        try {
            await api.post('accounts', newAccount);
            return newAccount;
        } catch (error) {
            console.error('Error creating account:', error);
            throw error;
        }
    }

    async updateAccount(id, updates) {
        const index = this.accounts.findIndex(a => a.id === id);
        if (index === -1) throw new Error('Account not found');
        
        const updatedAccount = { ...this.accounts[index], ...updates };
        this.accounts[index] = updatedAccount;
        
        try {
            await api.put(`accounts/${id}`, updatedAccount);
            return updatedAccount;
        } catch (error) {
            console.error('Error updating account:', error);
            throw error;
        }
    }

    // ==================== Journal Entries ====================
    
    async loadJournalEntries() {
        try {
            const response = await api.get('journal-entries');
            this.journalEntries = response.data || [];
        } catch (error) {
            console.error('Error loading journal entries:', error);
            this.journalEntries = [];
        }
    }

    createJournalEntry(entryData) {
        const totalDebit = entryData.lines.reduce((sum, line) => sum + (parseFloat(line.debit) || 0), 0);
        const totalCredit = entryData.lines.reduce((sum, line) => sum + (parseFloat(line.credit) || 0), 0);
        
        if (Math.abs(totalDebit - totalCredit) > 0.01) {
            throw new Error(`Journal entry is not balanced! Debit: ${totalDebit}, Credit: ${totalCredit}`);
        }
        
        if (entryData.lines.length === 0) {
            throw new Error('Journal entry must have at least one line');
        }
        
        const newEntry = {
            id: 'JE-' + Date.now(),
            entryNumber: this.generateEntryNumber(),
            date: entryData.date,
            description: entryData.description,
            referenceType: entryData.referenceType, // 'sales', 'purchase', 'manual', etc.
            referenceId: entryData.referenceId,
            lines: entryData.lines.map(line => ({
                accountId: line.accountId,
                accountCode: this.getAccountCode(line.accountId),
                accountName: this.getAccountName(line.accountId),
                debit: parseFloat(line.debit) || 0,
                credit: parseFloat(line.credit) || 0,
                costCenterId: line.costCenterId,
                description: line.description
            })),
            totalDebit: totalDebit,
            totalCredit: totalCredit,
            status: entryData.status || 'draft', // draft, posted, cancelled
            createdAt: new Date().toISOString(),
            createdBy: auth.getCurrentUser()?.email,
            companyId: companies.getCurrentCompany()?.id,
            branchId: companies.getCurrentBranch()?.id
        };
        
        return newEntry;
    }

    async postJournalEntry(entryId) {
        const entry = this.journalEntries.find(e => e.id === entryId);
        if (!entry) throw new Error('Journal entry not found');
        
        if (entry.status !== 'draft') {
            throw new Error('Only draft entries can be posted');
        }
        
        entry.status = 'posted';
        entry.postedAt = new Date().toISOString();
        entry.postedBy = auth.getCurrentUser()?.email;
        
        try {
            await api.put(`journal-entries/${entryId}`, entry);
            return entry;
        } catch (error) {
            console.error('Error posting journal entry:', error);
            throw error;
        }
    }

    generateEntryNumber() {
        const prefix = 'JE';
        const year = new Date().getFullYear();
        const count = this.journalEntries.filter(e => 
            e.entryNumber.startsWith(`${prefix}-${year}`)
        ).length + 1;
        return `${prefix}-${year}-${String(count).padStart(6, '0')}`;
    }

    getAccountCode(accountId) {
        const account = this.accounts.find(a => a.id === accountId);
        return account ? account.code : '';
    }

    getAccountName(accountId) {
        const account = this.accounts.find(a => a.id === accountId);
        if (!account) return '';
        return localization.getCurrentLanguage() === 'ar' ? account.nameAr : account.nameEn;
    }

    // ==================== General Ledger ====================
    
    getGeneralLedger(accountId, startDate, endDate) {
        const entries = this.journalEntries.filter(e => 
            e.status === 'posted' &&
            e.date >= startDate &&
            e.date <= endDate
        );
        
        const ledger = [];
        let runningBalance = 0;
        
        entries.forEach(entry => {
            entry.lines.forEach(line => {
                if (line.accountId === accountId) {
                    const account = this.accounts.find(a => a.id === accountId);
                    const isDebitNormal = ['asset', 'expense'].includes(account?.type);
                    
                    const balance = line.debit - line.credit;
                    runningBalance += isDebitNormal ? balance : -balance;
                    
                    ledger.push({
                        date: entry.date,
                        entryNumber: entry.entryNumber,
                        description: entry.description,
                        debit: line.debit,
                        credit: line.credit,
                        balance: runningBalance,
                        referenceType: entry.referenceType,
                        referenceId: entry.referenceId
                    });
                }
            });
        });
        
        return ledger;
    }

    // ==================== Trial Balance ====================
    
    getTrialBalance(startDate, endDate) {
        const balances = {};
        
        this.accounts.forEach(account => {
            balances[account.id] = {
                account: account,
                debit: 0,
                credit: 0
            };
        });
        
        const entries = this.journalEntries.filter(e => 
            e.status === 'posted' &&
            e.date >= startDate &&
            e.date <= endDate
        );
        
        entries.forEach(entry => {
            entry.lines.forEach(line => {
                if (balances[line.accountId]) {
                    balances[line.accountId].debit += line.debit;
                    balances[line.accountId].credit += line.credit;
                }
            });
        });
        
        const result = Object.values(balances).filter(b => b.debit !== 0 || b.credit !== 0);
        const totalDebit = result.reduce((sum, b) => sum + b.debit, 0);
        const totalCredit = result.reduce((sum, b) => sum + b.credit, 0);
        
        return {
            items: result,
            totalDebit,
            totalCredit,
            isBalanced: Math.abs(totalDebit - totalCredit) < 0.01
        };
    }

    // ==================== Financial Statements ====================
    
    getIncomeStatement(startDate, endDate) {
        const revenue = this.getAccountBalanceByType('revenue', startDate, endDate);
        const expenses = this.getAccountBalanceByType('expense', startDate, endDate);
        const cogs = this.getAccountBalanceBySpecificAccounts(['5100'], startDate, endDate);
        
        const grossProfit = revenue - cogs;
        const netIncome = revenue - expenses;
        
        return {
            revenue,
            costOfGoodsSold: cogs,
            grossProfit,
            operatingExpenses: expenses - cogs,
            netIncome,
            details: {
                revenue: this.getAccountsByType('revenue'),
                expenses: this.getAccountsByType('expense')
            }
        };
    }

    getBalanceSheet(asOfDate) {
        const assets = this.getAccountBalanceByType('asset', null, asOfDate);
        const liabilities = this.getAccountBalanceByType('liability', null, asOfDate);
        const equity = this.getAccountBalanceByType('equity', null, asOfDate);
        
        const retainedEarnings = this.getRetainedEarnings(asOfDate);
        const totalEquity = equity + retainedEarnings;
        
        return {
            assets,
            liabilities,
            equity: totalEquity,
            retainedEarnings,
            isBalanced: Math.abs(assets - (liabilities + totalEquity)) < 0.01
        };
    }

    getAccountBalanceByType(type, startDate, endDate) {
        const accounts = this.getAccountsByType(type);
        let totalBalance = 0;
        
        accounts.forEach(account => {
            const balance = this.getAccountBalance(account.id, startDate, endDate);
            totalBalance += balance;
        });
        
        return totalBalance;
    }

    getAccountBalanceBySpecificAccounts(accountCodes, startDate, endDate) {
        const accounts = this.accounts.filter(a => accountCodes.includes(a.code));
        let totalBalance = 0;
        
        accounts.forEach(account => {
            const balance = this.getAccountBalance(account.id, startDate, endDate);
            totalBalance += balance;
        });
        
        return totalBalance;
    }

    getAccountsByType(type) {
        return this.accounts.filter(a => a.type === type);
    }

    getAccountBalance(accountId, startDate, endDate) {
        const account = this.accounts.find(a => a.id === accountId);
        if (!account) return 0;
        
        const isDebitNormal = ['asset', 'expense'].includes(account.type);
        let balance = 0;
        
        const entries = this.journalEntries.filter(e => 
            e.status === 'posted' &&
            (!startDate || e.date >= startDate) &&
            (!endDate || e.date <= endDate)
        );
        
        entries.forEach(entry => {
            entry.lines.forEach(line => {
                if (line.accountId === accountId) {
                    balance += isDebitNormal ? (line.debit - line.credit) : (line.credit - line.debit);
                }
            });
        });
        
        return balance;
    }

    getRetainedEarnings(asOfDate) {
        const startDate = this.fiscalYears.find(fy => fy.isCurrent)?.startDate || new Date(new Date().getFullYear(), 0, 1).toISOString();
        const incomeStatement = this.getIncomeStatement(startDate, asOfDate);
        return incomeStatement.netIncome;
    }

    // ==================== Cost Centers ====================
    
    async loadCostCenters() {
        try {
            const response = await api.get('cost-centers');
            this.costCenters = response.data || [];
        } catch (error) {
            console.error('Error loading cost centers:', error);
            this.costCenters = [];
        }
    }

    async createCostCenter(costCenterData) {
        const newCostCenter = {
            id: 'CC-' + Date.now(),
            code: costCenterData.code,
            nameEn: costCenterData.nameEn,
            nameAr: costCenterData.nameAr,
            type: costCenterData.type, // department, project, branch
            isActive: true,
            createdAt: new Date().toISOString(),
            createdBy: auth.getCurrentUser()?.email
        };
        
        this.costCenters.push(newCostCenter);
        
        try {
            await api.post('cost-centers', newCostCenter);
            return newCostCenter;
        } catch (error) {
            console.error('Error creating cost center:', error);
            throw error;
        }
    }

    // ==================== Fiscal Years ====================
    
    async loadFiscalYears() {
        try {
            const response = await api.get('fiscal-years');
            this.fiscalYears = response.data || this.getDefaultFiscalYears();
            this.currentFiscalYear = this.fiscalYears.find(fy => fy.isCurrent);
        } catch (error) {
            console.error('Error loading fiscal years:', error);
            this.fiscalYears = this.getDefaultFiscalYears();
            this.currentFiscalYear = this.fiscalYears.find(fy => fy.isCurrent);
        }
    }

    getDefaultFiscalYears() {
        const currentYear = new Date().getFullYear();
        return [
            {
                id: 'FY-' + currentYear,
                name: currentYear.toString(),
                startDate: new Date(currentYear, 0, 1).toISOString(),
                endDate: new Date(currentYear, 11, 31).toISOString(),
                isCurrent: true,
                status: 'open',
                createdAt: new Date().toISOString()
            }
        ];
    }

    async createFiscalYear(fiscalYearData) {
        const newFiscalYear = {
            id: 'FY-' + fiscalYearData.name,
            name: fiscalYearData.name,
            startDate: fiscalYearData.startDate,
            endDate: fiscalYearData.endDate,
            isCurrent: false,
            status: 'open',
            createdAt: new Date().toISOString(),
            createdBy: auth.getCurrentUser()?.email
        };
        
        this.fiscalYears.push(newFiscalYear);
        
        try {
            await api.post('fiscal-years', newFiscalYear);
            return newFiscalYear;
        } catch (error) {
            console.error('Error creating fiscal year:', error);
            throw error;
        }
    }

    async closeFiscalYear(fiscalYearId) {
        const fiscalYear = this.fiscalYears.find(fy => fy.id === fiscalYearId);
        if (!fiscalYear) throw new Error('Fiscal year not found');
        
        if (fiscalYear.status === 'closed') {
            throw new Error('Fiscal year is already closed');
        }
        
        fiscalYear.status = 'closed';
        fiscalYear.closedAt = new Date().toISOString();
        fiscalYear.closedBy = auth.getCurrentUser()?.email;
        
        try {
            await api.put(`fiscal-years/${fiscalYearId}`, fiscalYear);
            return fiscalYear;
        } catch (error) {
            console.error('Error closing fiscal year:', error);
            throw error;
        }
    }

    // ==================== Auto-generate Journal Entries ====================
    
    generateSalesInvoiceEntry(invoice) {
        const lines = [];
        
        // Debit: Accounts Receivable
        lines.push({
            accountId: '1130',
            debit: invoice.totalAmount,
            credit: 0,
            description: `Invoice ${invoice.invoiceNumber} - ${invoice.customerName}`
        });
        
        // Credit: Sales Revenue
        lines.push({
            accountId: '4100',
            debit: 0,
            credit: invoice.subtotal,
            description: `Sales - Invoice ${invoice.invoiceNumber}`
        });
        
        // Credit: Tax Payable (if applicable)
        if (invoice.taxAmount > 0) {
            lines.push({
                accountId: '2120',
                debit: 0,
                credit: invoice.taxAmount,
                description: `Tax - Invoice ${invoice.invoiceNumber}`
            });
        }
        
        return this.createJournalEntry({
            date: invoice.date,
            description: `Sales Invoice ${invoice.invoiceNumber}`,
            referenceType: 'sales_invoice',
            referenceId: invoice.id,
            lines: lines,
            status: 'draft'
        });
    }

    generatePurchaseInvoiceEntry(invoice) {
        const lines = [];
        
        // Debit: Inventory or Expense
        lines.push({
            accountId: '1140',
            debit: invoice.subtotal,
            credit: 0,
            description: `Purchase - Invoice ${invoice.invoiceNumber}`
        });
        
        // Debit: Tax Recoverable (if applicable)
        if (invoice.taxAmount > 0) {
            lines.push({
                accountId: '1110',
                debit: invoice.taxAmount,
                credit: 0,
                description: `Tax Recoverable - Invoice ${invoice.invoiceNumber}`
            });
        }
        
        // Credit: Accounts Payable
        lines.push({
            accountId: '2110',
            debit: 0,
            credit: invoice.totalAmount,
            description: `Supplier Invoice ${invoice.invoiceNumber}`
        });
        
        return this.createJournalEntry({
            date: invoice.date,
            description: `Purchase Invoice ${invoice.invoiceNumber}`,
            referenceType: 'purchase_invoice',
            referenceId: invoice.id,
            lines: lines,
            status: 'draft'
        });
    }

    generatePaymentEntry(payment) {
        const lines = [];
        
        if (payment.type === 'receipt') {
            // Debit: Cash/Bank
            lines.push({
                accountId: payment.paymentMethod === 'cash' ? '1110' : '1120',
                debit: payment.amount,
                credit: 0,
                description: `Payment Receipt ${payment.id}`
            });
            
            // Credit: Accounts Receivable
            lines.push({
                accountId: '1130',
                debit: 0,
                credit: payment.amount,
                description: `Customer Payment ${payment.id}`
            });
        } else {
            // Debit: Accounts Payable
            lines.push({
                accountId: '2110',
                debit: payment.amount,
                credit: 0,
                description: `Supplier Payment ${payment.id}`
            });
            
            // Credit: Cash/Bank
            lines.push({
                accountId: payment.paymentMethod === 'cash' ? '1110' : '1120',
                debit: 0,
                credit: payment.amount,
                description: `Payment ${payment.id}`
            });
        }
        
        return this.createJournalEntry({
            date: payment.date,
            description: `Payment ${payment.id}`,
            referenceType: 'payment',
            referenceId: payment.id,
            lines: lines,
            status: 'draft'
        });
    }
}

// Initialize module
const accounting = new AccountingModule();
