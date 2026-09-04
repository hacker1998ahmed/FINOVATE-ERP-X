/**
 * FINOVATE ERP X - Cash & Bank Management Module
 * Phase 09: Cash + Banks + Reconciliation
 * 
 * Features:
 * - Cashbox Management (Petty Cash)
 * - Bank Accounts Management
 * - Cash Receipts & Payments
 * - Bank Deposits & Withdrawals
 * - Transfers between Cash/Bank
 * - Bank Reconciliation
 * - Cash/Bank Statements
 */

class CashBankModule {
    constructor() {
        this.cashboxes = [];
        this.bankAccounts = [];
        this.transactions = [];
        this.reconciliations = [];
        this.init();
    }

    async init() {
        await this.loadCashboxes();
        await this.loadBankAccounts();
        await this.loadTransactions();
        await this.loadReconciliations();
    }

    // ==================== Cashboxes ====================
    
    async loadCashboxes() {
        try {
            const response = await api.get('cashboxes');
            this.cashboxes = response.data || this.getDefaultCashboxes();
        } catch (error) {
            console.error('Error loading cashboxes:', error);
            this.cashboxes = this.getDefaultCashboxes();
        }
    }

    getDefaultCashboxes() {
        return [
            {
                id: 'CB-001',
                code: 'CB-MAIN',
                nameEn: 'Main Cashbox',
                nameAr: 'الخزنة الرئيسية',
                currency: 'EGP',
                balance: 5000.00,
                minimumBalance: 500.00,
                maximumBalance: 50000.00,
                isActive: true,
                companyId: companies.getCurrentCompany()?.id,
                branchId: companies.getCurrentBranch()?.id,
                createdAt: new Date().toISOString()
            },
            {
                id: 'CB-002',
                code: 'CB-PETTY',
                nameEn: 'Petty Cash',
                nameAr: 'صندوق النفقات النثرية',
                currency: 'EGP',
                balance: 1000.00,
                minimumBalance: 100.00,
                maximumBalance: 5000.00,
                isActive: true,
                companyId: companies.getCurrentCompany()?.id,
                branchId: companies.getCurrentBranch()?.id,
                createdAt: new Date().toISOString()
            }
        ];
    }

    async createCashbox(cashboxData) {
        const newCashbox = {
            id: 'CB-' + Date.now(),
            code: cashboxData.code,
            nameEn: cashboxData.nameEn,
            nameAr: cashboxData.nameAr,
            currency: cashboxData.currency || 'EGP',
            balance: 0,
            minimumBalance: cashboxData.minimumBalance || 0,
            maximumBalance: cashboxData.maximumBalance || 100000,
            isActive: true,
            companyId: companies.getCurrentCompany()?.id,
            branchId: companies.getCurrentBranch()?.id,
            createdAt: new Date().toISOString(),
            createdBy: auth.getCurrentUser()?.email
        };
        
        this.cashboxes.push(newCashbox);
        
        try {
            await api.post('cashboxes', newCashbox);
            return newCashbox;
        } catch (error) {
            console.error('Error creating cashbox:', error);
            throw error;
        }
    }

    getCashboxBalance(cashboxId) {
        const cashbox = this.cashboxes.find(c => c.id === cashboxId);
        if (!cashbox) return 0;
        
        const receipts = this.transactions.filter(t => 
            t.type === 'receipt' && t.cashboxId === cashboxId && t.status === 'posted'
        ).reduce((sum, t) => sum + t.amount, 0);
        
        const payments = this.transactions.filter(t => 
            t.type === 'payment' && t.cashboxId === cashboxId && t.status === 'posted'
        ).reduce((sum, t) => sum + t.amount, 0);
        
        return cashbox.balance + receipts - payments;
    }

    // ==================== Bank Accounts ====================
    
    async loadBankAccounts() {
        try {
            const response = await api.get('bank-accounts');
            this.bankAccounts = response.data || this.getDefaultBankAccounts();
        } catch (error) {
            console.error('Error loading bank accounts:', error);
            this.bankAccounts = this.getDefaultBankAccounts();
        }
    }

    getDefaultBankAccounts() {
        return [
            {
                id: 'BA-001',
                code: 'BA-NBE',
                nameEn: 'NBE Main Account',
                nameAr: 'حساب البنك الأهلي الرئيسي',
                bankName: 'National Bank of Egypt',
                accountNumber: '1234567890123456',
                iban: 'EG380019000500000000123456789',
                currency: 'EGP',
                balance: 100000.00,
                minimumBalance: 1000.00,
                isActive: true,
                companyId: companies.getCurrentCompany()?.id,
                branchId: companies.getCurrentBranch()?.id,
                createdAt: new Date().toISOString()
            },
            {
                id: 'BA-002',
                code: 'BA-CIB',
                nameEn: 'CIB Business Account',
                nameAr: 'حساب بنك CIB للأعمال',
                bankName: 'Commercial International Bank',
                accountNumber: '9876543210987654',
                iban: 'EG750014000100000000987654321',
                currency: 'USD',
                balance: 50000.00,
                minimumBalance: 5000.00,
                isActive: true,
                companyId: companies.getCurrentCompany()?.id,
                branchId: companies.getCurrentBranch()?.id,
                createdAt: new Date().toISOString()
            }
        ];
    }

    async createBankAccount(accountData) {
        const newAccount = {
            id: 'BA-' + Date.now(),
            code: accountData.code,
            nameEn: accountData.nameEn,
            nameAr: accountData.nameAr,
            bankName: accountData.bankName,
            accountNumber: accountData.accountNumber,
            iban: accountData.iban,
            currency: accountData.currency || 'EGP',
            balance: 0,
            minimumBalance: accountData.minimumBalance || 0,
            isActive: true,
            companyId: companies.getCurrentCompany()?.id,
            branchId: companies.getCurrentBranch()?.id,
            createdAt: new Date().toISOString(),
            createdBy: auth.getCurrentUser()?.email
        };
        
        this.bankAccounts.push(newAccount);
        
        try {
            await api.post('bank-accounts', newAccount);
            return newAccount;
        } catch (error) {
            console.error('Error creating bank account:', error);
            throw error;
        }
    }

    getBankAccountBalance(accountId) {
        const account = this.bankAccounts.find(a => a.id === accountId);
        if (!account) return 0;
        
        const deposits = this.transactions.filter(t => 
            t.type === 'deposit' && t.bankAccountId === accountId && t.status === 'posted'
        ).reduce((sum, t) => sum + t.amount, 0);
        
        const withdrawals = this.transactions.filter(t => 
            t.type === 'withdrawal' && t.bankAccountId === accountId && t.status === 'posted'
        ).reduce((sum, t) => sum + t.amount, 0);
        
        return account.balance + deposits - withdrawals;
    }

    // ==================== Transactions ====================
    
    async loadTransactions() {
        try {
            const response = await api.get('cash-bank-transactions');
            this.transactions = response.data || [];
        } catch (error) {
            console.error('Error loading transactions:', error);
            this.transactions = [];
        }
    }

    createReceipt(receiptData) {
        const receipt = {
            id: 'RCT-' + Date.now(),
            receiptNumber: this.generateTransactionNumber('RCT'),
            type: 'receipt',
            date: receiptData.date,
            amount: receiptData.amount,
            currency: receiptData.currency || 'EGP',
            paymentMethod: receiptData.paymentMethod, // cash, bank_transfer, check, credit_card
            cashboxId: receiptData.cashboxId,
            bankAccountId: receiptData.bankAccountId,
            customerId: receiptData.customerId,
            customerName: receiptData.customerName,
            description: receiptData.description,
            referenceNumber: receiptData.referenceNumber, // check number, transfer ref, etc.
            status: 'draft', // draft, posted, cancelled
            companyId: companies.getCurrentCompany()?.id,
            branchId: companies.getCurrentBranch()?.id,
            createdAt: new Date().toISOString(),
            createdBy: auth.getCurrentUser()?.email
        };
        
        return receipt;
    }

    createPayment(paymentData) {
        const payment = {
            id: 'PAY-' + Date.now(),
            paymentNumber: this.generateTransactionNumber('PAY'),
            type: 'payment',
            date: paymentData.date,
            amount: paymentData.amount,
            currency: paymentData.currency || 'EGP',
            paymentMethod: paymentData.paymentMethod,
            cashboxId: paymentData.cashboxId,
            bankAccountId: paymentData.bankAccountId,
            supplierId: paymentData.supplierId,
            supplierName: paymentData.supplierName,
            expenseAccountId: paymentData.expenseAccountId,
            description: paymentData.description,
            referenceNumber: paymentData.referenceNumber,
            status: 'draft',
            companyId: companies.getCurrentCompany()?.id,
            branchId: companies.getCurrentBranch()?.id,
            createdAt: new Date().toISOString(),
            createdBy: auth.getCurrentUser()?.email
        };
        
        return payment;
    }

    createDeposit(depositData) {
        const deposit = {
            id: 'DEP-' + Date.now(),
            depositNumber: this.generateTransactionNumber('DEP'),
            type: 'deposit',
            date: depositData.date,
            amount: depositData.amount,
            currency: depositData.currency || 'EGP',
            bankAccountId: depositData.bankAccountId,
            sourceCashboxId: depositData.sourceCashboxId,
            sourceType: depositData.sourceType, // cashbox, other_bank, customer
            description: depositData.description,
            referenceNumber: depositData.referenceNumber,
            status: 'draft',
            companyId: companies.getCurrentCompany()?.id,
            branchId: companies.getCurrentBranch()?.id,
            createdAt: new Date().toISOString(),
            createdBy: auth.getCurrentUser()?.email
        };
        
        return deposit;
    }

    createWithdrawal(withdrawalData) {
        const withdrawal = {
            id: 'WDR-' + Date.now(),
            withdrawalNumber: this.generateTransactionNumber('WDR'),
            type: 'withdrawal',
            date: withdrawalData.date,
            amount: withdrawalData.amount,
            currency: withdrawalData.currency || 'EGP',
            bankAccountId: withdrawalData.bankAccountId,
            destinationCashboxId: withdrawalData.destinationCashboxId,
            destinationType: withdrawalData.destinationType, // cashbox, other_bank, supplier
            description: withdrawalData.description,
            referenceNumber: withdrawalData.referenceNumber,
            status: 'draft',
            companyId: companies.getCurrentCompany()?.id,
            branchId: companies.getCurrentBranch()?.id,
            createdAt: new Date().toISOString(),
            createdBy: auth.getCurrentUser()?.email
        };
        
        return withdrawal;
    }

    createTransfer(transferData) {
        const transfer = {
            id: 'TRF-' + Date.now(),
            transferNumber: this.generateTransactionNumber('TRF'),
            type: 'transfer',
            date: transferData.date,
            amount: transferData.amount,
            currency: transferData.currency || 'EGP',
            fromType: transferData.fromType, // cashbox, bank
            fromId: transferData.fromId,
            toType: transferData.toType,
            toId: transferData.toId,
            description: transferData.description,
            status: 'draft',
            companyId: companies.getCurrentCompany()?.id,
            branchId: companies.getCurrentBranch()?.id,
            createdAt: new Date().toISOString(),
            createdBy: auth.getCurrentUser()?.email
        };
        
        return transfer;
    }

    generateTransactionNumber(prefix) {
        const year = new Date().getFullYear();
        const count = this.transactions.filter(t => 
            t.transactionNumber?.startsWith(`${prefix}-${year}`)
        ).length + 1;
        return `${prefix}-${year}-${String(count).padStart(6, '0')}`;
    }

    async postTransaction(transactionId) {
        const transaction = this.transactions.find(t => t.id === transactionId);
        if (!transaction) throw new Error('Transaction not found');
        
        if (transaction.status !== 'draft') {
            throw new Error('Only draft transactions can be posted');
        }
        
        // Validate balances
        if (transaction.type === 'payment' || transaction.type === 'withdrawal') {
            let currentBalance = 0;
            if (transaction.cashboxId) {
                currentBalance = this.getCashboxBalance(transaction.cashboxId);
            } else if (transaction.bankAccountId) {
                currentBalance = this.getBankAccountBalance(transaction.bankAccountId);
            }
            
            if (currentBalance < transaction.amount) {
                throw new Error('Insufficient balance');
            }
        }
        
        transaction.status = 'posted';
        transaction.postedAt = new Date().toISOString();
        transaction.postedBy = auth.getCurrentUser()?.email;
        
        // Update balances
        this.updateBalances(transaction);
        
        // Generate accounting entry
        this.generateTransactionAccountingEntry(transaction);
        
        try {
            await api.put(`cash-bank-transactions/${transactionId}`, transaction);
            return transaction;
        } catch (error) {
            console.error('Error posting transaction:', error);
            throw error;
        }
    }

    updateBalances(transaction) {
        switch (transaction.type) {
            case 'receipt':
                if (transaction.cashboxId) {
                    const cashbox = this.cashboxes.find(c => c.id === transaction.cashboxId);
                    if (cashbox) cashbox.balance += transaction.amount;
                }
                if (transaction.bankAccountId) {
                    const account = this.bankAccounts.find(a => a.id === transaction.bankAccountId);
                    if (account) account.balance += transaction.amount;
                }
                break;
                
            case 'payment':
                if (transaction.cashboxId) {
                    const cashbox = this.cashboxes.find(c => c.id === transaction.cashboxId);
                    if (cashbox) cashbox.balance -= transaction.amount;
                }
                if (transaction.bankAccountId) {
                    const account = this.bankAccounts.find(a => a.id === transaction.bankAccountId);
                    if (account) account.balance -= transaction.amount;
                }
                break;
                
            case 'deposit':
                if (transaction.bankAccountId) {
                    const account = this.bankAccounts.find(a => a.id === transaction.bankAccountId);
                    if (account) account.balance += transaction.amount;
                }
                if (transaction.sourceCashboxId) {
                    const cashbox = this.cashboxes.find(c => c.id === transaction.sourceCashboxId);
                    if (cashbox) cashbox.balance -= transaction.amount;
                }
                break;
                
            case 'withdrawal':
                if (transaction.bankAccountId) {
                    const account = this.bankAccounts.find(a => a.id === transaction.bankAccountId);
                    if (account) account.balance -= transaction.amount;
                }
                if (transaction.destinationCashboxId) {
                    const cashbox = this.cashboxes.find(c => c.id === transaction.destinationCashboxId);
                    if (cashbox) cashbox.balance += transaction.amount;
                }
                break;
                
            case 'transfer':
                // Deduct from source
                if (transaction.fromType === 'cashbox') {
                    const cashbox = this.cashboxes.find(c => c.id === transaction.fromId);
                    if (cashbox) cashbox.balance -= transaction.amount;
                } else if (transaction.fromType === 'bank') {
                    const account = this.bankAccounts.find(a => a.id === transaction.fromId);
                    if (account) account.balance -= transaction.amount;
                }
                
                // Add to destination
                if (transaction.toType === 'cashbox') {
                    const cashbox = this.cashboxes.find(c => c.id === transaction.toId);
                    if (cashbox) cashbox.balance += transaction.amount;
                } else if (transaction.toType === 'bank') {
                    const account = this.bankAccounts.find(a => a.id === transaction.toId);
                    if (account) account.balance += transaction.amount;
                }
                break;
        }
    }

    generateTransactionAccountingEntry(transaction) {
        // Auto-generate journal entry for the transaction
        const entryData = {
            date: transaction.date,
            description: `${transaction.type.toUpperCase()} ${transaction.id}`,
            referenceType: `cash_bank_${transaction.type}`,
            referenceId: transaction.id,
            lines: [],
            status: 'draft'
        };
        
        // Simplified accounting logic - in production would be more complex
        if (transaction.type === 'receipt') {
            entryData.lines.push({
                accountId: transaction.cashboxId ? '1110' : '1120',
                debit: transaction.amount,
                credit: 0,
                description: transaction.description
            });
            entryData.lines.push({
                accountId: '1130',
                debit: 0,
                credit: transaction.amount,
                description: transaction.description
            });
        } else if (transaction.type === 'payment') {
            entryData.lines.push({
                accountId: '5400',
                debit: transaction.amount,
                credit: 0,
                description: transaction.description
            });
            entryData.lines.push({
                accountId: transaction.cashboxId ? '1110' : '1120',
                debit: 0,
                credit: transaction.amount,
                description: transaction.description
            });
        }
        
        if (entryData.lines.length > 0) {
            const entry = accounting.createJournalEntry(entryData);
            this.transactions.push(entry);
        }
    }

    // ==================== Bank Reconciliation ====================
    
    async loadReconciliations() {
        try {
            const response = await api.get('bank-reconciliations');
            this.reconciliations = response.data || [];
        } catch (error) {
            console.error('Error loading reconciliations:', error);
            this.reconciliations = [];
        }
    }

    createReconciliation(reconciliationData) {
        const bankAccount = this.bankAccounts.find(a => a.id === reconciliationData.bankAccountId);
        if (!bankAccount) throw new Error('Bank account not found');
        
        const reconciliation = {
            id: 'REC-' + Date.now(),
            bankAccountId: reconciliationData.bankAccountId,
            bankAccountName: bankAccount.nameEn,
            statementDate: reconciliationData.statementDate,
            statementBalance: reconciliationData.statementBalance,
            bookBalance: this.getBankAccountBalance(reconciliationData.bankAccountId),
            outstandingDeposits: reconciliationData.outstandingDeposits || [],
            outstandingChecks: reconciliationData.outstandingChecks || [],
            bankCharges: reconciliationData.bankCharges || [],
            adjustedBalance: 0,
            isReconciled: false,
            status: 'in_progress',
            companyId: companies.getCurrentCompany()?.id,
            branchId: companies.getCurrentBranch()?.id,
            createdAt: new Date().toISOString(),
            createdBy: auth.getCurrentUser()?.email
        };
        
        // Calculate adjusted balance
        reconciliation.adjustedBalance = reconciliation.statementBalance
            + reconciliation.outstandingDeposits.reduce((sum, d) => sum + d.amount, 0)
            - reconciliation.outstandingChecks.reduce((sum, c) => sum + c.amount, 0)
            - reconciliation.bankCharges.reduce((sum, c) => sum + c.amount, 0);
        
        reconciliation.isReconciled = Math.abs(reconciliation.adjustedBalance - reconciliation.bookBalance) < 0.01;
        
        return reconciliation;
    }

    async finalizeReconciliation(reconciliationId) {
        const reconciliation = this.reconciliations.find(r => r.id === reconciliationId);
        if (!reconciliation) throw new Error('Reconciliation not found');
        
        if (!reconciliation.isReconciled) {
            throw new Error('Cannot finalize unreconciled statement');
        }
        
        reconciliation.status = 'completed';
        reconciliation.completedAt = new Date().toISOString();
        reconciliation.completedBy = auth.getCurrentUser()?.email;
        
        try {
            await api.put(`bank-reconciliations/${reconciliationId}`, reconciliation);
            return reconciliation;
        } catch (error) {
            console.error('Error finalizing reconciliation:', error);
            throw error;
        }
    }

    // ==================== Reports ====================
    
    getCashStatement(cashboxId, startDate, endDate) {
        const transactions = this.transactions.filter(t => 
            t.cashboxId === cashboxId &&
            t.status === 'posted' &&
            t.date >= startDate &&
            t.date <= endDate &&
            (t.type === 'receipt' || t.type === 'payment')
        ).sort((a, b) => new Date(a.date) - new Date(b.date));
        
        let runningBalance = this.getCashboxBalance(cashboxId);
        const openingBalance = runningBalance;
        
        const statement = transactions.map(t => {
            if (t.type === 'receipt') {
                runningBalance += t.amount;
            } else {
                runningBalance -= t.amount;
            }
            
            return {
                date: t.date,
                number: t.type === 'receipt' ? t.receiptNumber : t.paymentNumber,
                type: t.type,
                description: t.description,
                debit: t.type === 'receipt' ? t.amount : 0,
                credit: t.type === 'payment' ? t.amount : 0,
                balance: runningBalance
            };
        });
        
        return {
            cashboxId,
            startDate,
            endDate,
            openingBalance,
            closingBalance: runningBalance,
            transactions: statement
        };
    }

    getBankStatement(bankAccountId, startDate, endDate) {
        const transactions = this.transactions.filter(t => 
            t.bankAccountId === bankAccountId &&
            t.status === 'posted' &&
            t.date >= startDate &&
            t.date <= endDate &&
            (t.type === 'deposit' || t.type === 'withdrawal')
        ).sort((a, b) => new Date(a.date) - new Date(b.date));
        
        let runningBalance = this.getBankAccountBalance(bankAccountId);
        const openingBalance = runningBalance;
        
        const statement = transactions.map(t => {
            if (t.type === 'deposit') {
                runningBalance += t.amount;
            } else {
                runningBalance -= t.amount;
            }
            
            return {
                date: t.date,
                number: t.type === 'deposit' ? t.depositNumber : t.withdrawalNumber,
                type: t.type,
                description: t.description,
                debit: t.type === 'deposit' ? t.amount : 0,
                credit: t.type === 'withdrawal' ? t.amount : 0,
                balance: runningBalance
            };
        });
        
        return {
            bankAccountId,
            startDate,
            endDate,
            openingBalance,
            closingBalance: runningBalance,
            transactions: statement
        };
    }

    getDailyCashReport(date) {
        const receipts = this.transactions.filter(t => 
            t.date === date &&
            t.status === 'posted' &&
            t.type === 'receipt'
        ).reduce((sum, t) => sum + t.amount, 0);
        
        const payments = this.transactions.filter(t => 
            t.date === date &&
            t.status === 'posted' &&
            t.type === 'payment'
        ).reduce((sum, t) => sum + t.amount, 0);
        
        const totalCashboxes = this.cashboxes.reduce((sum, c) => sum + this.getCashboxBalance(c.id), 0);
        const totalBanks = this.bankAccounts.reduce((sum, a) => sum + this.getBankAccountBalance(a.id), 0);
        
        return {
            date,
            receipts,
            payments,
            netCashFlow: receipts - payments,
            totalCashInHand: totalCashboxes,
            totalBankBalance: totalBanks,
            totalLiquidity: totalCashboxes + totalBanks
        };
    }
}

// Initialize module
const cashBank = new CashBankModule();
