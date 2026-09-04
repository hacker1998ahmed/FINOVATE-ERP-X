/**
 * FINOVATE ERP X - Assets Management Module
 * Phase 12: Fixed Assets + Cost Centers
 * 
 * Features:
 * - Asset Registry (Name, Category, Serial, Purchase Info)
 * - Depreciation Calculation (Straight-line method)
 * - Asset Location & Status Tracking
 * - Maintenance History
 * - Disposal & Transfer
 * - Auto-generate depreciation journal entries
 * - Cost Center Assignment
 * - Asset Reports & Valuation
 */

class AssetsModule {
    constructor() {
        this.assets = [];
        this.categories = [];
        this.costCenters = [];
        this.depreciationRecords = [];
        this.maintenanceLogs = [];
    }

    // Initialize module
    async init() {
        await this.loadAssets();
        await this.loadCategories();
        await this.loadCostCenters();
        console.log('Assets Module initialized');
    }

    // Load assets from database
    async loadAssets() {
        try {
            const response = await api.get('assets', { companyId: App.currentCompany });
            this.assets = response.data || [];
        } catch (error) {
            console.error('Error loading assets:', error);
            this.assets = [];
        }
    }

    // Load asset categories
    async loadCategories() {
        try {
            const response = await api.get('assetCategories', { companyId: App.currentCompany });
            this.categories = response.data || [];
        } catch (error) {
            console.error('Error loading categories:', error);
            this.categories = [];
        }
    }

    // Load cost centers
    async loadCostCenters() {
        try {
            const response = await api.get('costCenters', { companyId: App.currentCompany });
            this.costCenters = response.data || [];
        } catch (error) {
            console.error('Error loading cost centers:', error);
            this.costCenters = [];
        }
    }

    // Create new asset
    async createAsset(assetData) {
        const asset = {
            id: 'AST-' + Date.now(),
            code: assetData.code || this.generateAssetCode(),
            name: assetData.name,
            categoryId: assetData.categoryId,
            serialNumber: assetData.serialNumber,
            barcode: assetData.barcode,
            purchaseDate: assetData.purchaseDate,
            purchaseCost: parseFloat(assetData.purchaseCost) || 0,
            salvageValue: parseFloat(assetData.salvageValue) || 0,
            usefulLife: parseInt(assetData.usefulLife) || 5,
            depreciationMethod: assetData.depreciationMethod || 'straight-line',
            location: assetData.location,
            branchId: assetData.branchId,
            costCenterId: assetData.costCenterId,
            status: 'active',
            accumulatedDepreciation: 0,
            netBookValue: parseFloat(assetData.purchaseCost) || 0,
            lastDepreciationDate: null,
            notes: assetData.notes,
            createdAt: new Date().toISOString(),
            createdBy: Auth.currentUser?.email
        };

        try {
            const response = await api.post('assets', asset);
            if (response.success) {
                this.assets.push(asset);
                
                // Generate opening journal entry
                await this.createAssetOpeningEntry(asset);
                
                return { success: true, data: asset };
            }
            return response;
        } catch (error) {
            console.error('Error creating asset:', error);
            return { success: false, error: error.message };
        }
    }

    // Generate unique asset code
    generateAssetCode() {
        const prefix = 'AST';
        const year = new Date().getFullYear();
        const count = this.assets.filter(a => a.code.startsWith(`${prefix}-${year}`)).length + 1;
        return `${prefix}-${year}-${String(count).padStart(4, '0')}`;
    }

    // Create opening journal entry for asset
    async createAssetOpeningEntry(asset) {
        const entry = {
            id: 'JE-' + Date.now(),
            date: asset.purchaseDate,
            reference: asset.code,
            description: `Asset Acquisition: ${asset.name}`,
            lines: [
                {
                    accountId: await this.getAccountIdByType('asset'),
                    debit: asset.purchaseCost,
                    credit: 0,
                    costCenterId: asset.costCenterId
                },
                {
                    accountId: await this.getAccountIdByType('cash_bank'),
                    debit: 0,
                    credit: asset.purchaseCost,
                    costCenterId: asset.costCenterId
                }
            ],
            status: 'posted',
            companyId: App.currentCompany,
            branchId: asset.branchId,
            createdAt: new Date().toISOString()
        };

        return await accounting.createJournalEntry(entry);
    }

    // Get account ID by type
    async getAccountIdByType(type) {
        const accounts = await accounting.getAccounts();
        switch(type) {
            case 'asset':
                return accounts.find(a => a.type === 'fixed_asset')?.id || '1100';
            case 'cash_bank':
                return accounts.find(a => a.type === 'bank')?.id || '1010';
            case 'depreciation_expense':
                return accounts.find(a => a.type === 'depreciation_expense')?.id || '6100';
            case 'accumulated_depreciation':
                return accounts.find(a => a.type === 'accumulated_depreciation')?.id || '1190';
            default:
                return '1100';
        }
    }

    // Calculate monthly depreciation
    calculateDepreciation(asset) {
        if (asset.depreciationMethod !== 'straight-line') return 0;
        
        const depreciableAmount = asset.purchaseCost - asset.salvageValue;
        const monthlyDepreciation = depreciableAmount / (asset.usefulLife * 12);
        return parseFloat(monthlyDepreciation.toFixed(2));
    }

    // Process depreciation for all assets
    async processMonthlyDepreciation(date = null) {
        const depreciationDate = date || new Date().toISOString().split('T')[0];
        const results = [];

        for (const asset of this.assets) {
            if (asset.status !== 'active') continue;
            
            // Check if already depreciated this month
            const lastDep = asset.lastDepreciationDate ? new Date(asset.lastDepreciationDate) : null;
            const currentMonth = new Date(depreciationDate).getMonth();
            const lastMonth = lastDep ? new Date(lastDep).getMonth() : -1;
            
            if (lastDep && currentMonth === lastMonth) continue;

            const depreciationAmount = this.calculateDepreciation(asset);
            if (depreciationAmount <= 0) continue;

            // Create depreciation journal entry
            const entry = {
                id: 'DEP-' + Date.now(),
                date: depreciationDate,
                reference: `DEP-${asset.code}-${new Date(depreciationDate).toISOString().slice(0, 7)}`,
                description: `Monthly Depreciation: ${asset.name}`,
                lines: [
                    {
                        accountId: await this.getAccountIdByType('depreciation_expense'),
                        debit: depreciationAmount,
                        credit: 0,
                        costCenterId: asset.costCenterId
                    },
                    {
                        accountId: await this.getAccountIdByType('accumulated_depreciation'),
                        debit: 0,
                        credit: depreciationAmount,
                        costCenterId: asset.costCenterId
                    }
                ],
                status: 'posted',
                companyId: App.currentCompany,
                branchId: asset.branchId,
                isDepreciation: true,
                assetId: asset.id,
                createdAt: new Date().toISOString()
            };

            const result = await accounting.createJournalEntry(entry);
            
            if (result.success) {
                // Update asset
                asset.accumulatedDepreciation += depreciationAmount;
                asset.netBookValue -= depreciationAmount;
                asset.lastDepreciationDate = depreciationDate;

                // Save depreciation record
                this.depreciationRecords.push({
                    id: 'DEPR-' + Date.now(),
                    assetId: asset.id,
                    date: depreciationDate,
                    amount: depreciationAmount,
                    journalEntryId: entry.id,
                    createdAt: new Date().toISOString()
                });

                results.push({ assetId: asset.id, amount: depreciationAmount, success: true });
            }
        }

        return results;
    }

    // Update asset status
    async updateAssetStatus(assetId, status) {
        const asset = this.assets.find(a => a.id === assetId);
        if (!asset) return { success: false, error: 'Asset not found' };

        asset.status = status;
        asset.updatedAt = new Date().toISOString();
        asset.updatedBy = Auth.currentUser?.email;

        try {
            const response = await api.put(`assets/${assetId}`, { status, updatedAt: asset.updatedAt, updatedBy: asset.updatedBy });
            return response;
        } catch (error) {
            console.error('Error updating asset status:', error);
            return { success: false, error: error.message };
        }
    }

    // Dispose/Sell asset
    async disposeAsset(assetId, disposalData) {
        const asset = this.assets.find(a => a.id === assetId);
        if (!asset) return { success: false, error: 'Asset not found' };

        const salePrice = parseFloat(disposalData.salePrice) || 0;
        const gainLoss = salePrice - asset.netBookValue;

        // Create disposal journal entry
        const entry = {
            id: 'DISP-' + Date.now(),
            date: disposalData.date,
            reference: `DISPOSAL-${asset.code}`,
            description: `Asset Disposal: ${asset.name}`,
            lines: [
                {
                    accountId: await this.getAccountIdByType('cash_bank'),
                    debit: salePrice,
                    credit: 0
                },
                {
                    accountId: await this.getAccountIdByType('accumulated_depreciation'),
                    debit: asset.accumulatedDepreciation,
                    credit: 0
                },
                {
                    accountId: await this.getAccountIdByType('asset'),
                    debit: 0,
                    credit: asset.purchaseCost
                },
                {
                    accountId: gainLoss >= 0 ? '7200' : '6300', // Gain or Loss account
                    debit: gainLoss < 0 ? Math.abs(gainLoss) : 0,
                    credit: gainLoss >= 0 ? gainLoss : 0
                }
            ],
            status: 'posted',
            companyId: App.currentCompany,
            isDisposal: true,
            assetId: assetId,
            createdAt: new Date().toISOString()
        };

        const result = await accounting.createJournalEntry(entry);
        
        if (result.success) {
            await this.updateAssetStatus(assetId, 'disposed');
            return { success: true, gainLoss, data: entry };
        }
        return result;
    }

    // Add maintenance log
    async addMaintenance(assetId, maintenanceData) {
        const log = {
            id: 'MAINT-' + Date.now(),
            assetId: assetId,
            date: maintenanceData.date,
            type: maintenanceData.type,
            description: maintenanceData.description,
            cost: parseFloat(maintenanceData.cost) || 0,
            vendor: maintenanceData.vendor,
            nextMaintenanceDate: maintenanceData.nextMaintenanceDate,
            createdAt: new Date().toISOString()
        };

        this.maintenanceLogs.push(log);

        // If maintenance has cost, create expense entry
        if (log.cost > 0) {
            const asset = this.assets.find(a => a.id === assetId);
            const entry = {
                id: 'MAINT-JE-' + Date.now(),
                date: log.date,
                reference: log.id,
                description: `Maintenance: ${asset.name}`,
                lines: [
                    {
                        accountId: '6200', // Maintenance expense
                        debit: log.cost,
                        credit: 0,
                        costCenterId: asset.costCenterId
                    },
                    {
                        accountId: await this.getAccountIdByType('cash_bank'),
                        debit: 0,
                        credit: log.cost
                    }
                ],
                status: 'posted',
                companyId: App.currentCompany,
                createdAt: new Date().toISOString()
            };
            await accounting.createJournalEntry(entry);
        }

        try {
            const response = await api.post('maintenanceLogs', log);
            return response;
        } catch (error) {
            console.error('Error adding maintenance log:', error);
            return { success: false, error: error.message };
        }
    }

    // Get asset valuation report
    getValuationReport() {
        const report = {
            totalCost: 0,
            totalAccumulatedDepreciation: 0,
            totalNetBookValue: 0,
            byCategory: {},
            assets: []
        };

        for (const asset of this.assets) {
            if (asset.status === 'disposed') continue;

            report.totalCost += asset.purchaseCost;
            report.totalAccumulatedDepreciation += asset.accumulatedDepreciation;
            report.totalNetBookValue += asset.netBookValue;

            const category = this.categories.find(c => c.id === asset.categoryId);
            const categoryName = category?.name || 'Uncategorized';

            if (!report.byCategory[categoryName]) {
                report.byCategory[categoryName] = {
                    cost: 0,
                    accumulatedDepreciation: 0,
                    netBookValue: 0,
                    count: 0
                };
            }

            report.byCategory[categoryName].cost += asset.purchaseCost;
            report.byCategory[categoryName].accumulatedDepreciation += asset.accumulatedDepreciation;
            report.byCategory[categoryName].netBookValue += asset.netBookValue;
            report.byCategory[categoryName].count++;

            report.assets.push({
                code: asset.code,
                name: asset.name,
                category: categoryName,
                purchaseDate: asset.purchaseDate,
                purchaseCost: asset.purchaseCost,
                accumulatedDepreciation: asset.accumulatedDepreciation,
                netBookValue: asset.netBookValue,
                status: asset.status
            });
        }

        return report;
    }

    // Get upcoming maintenance
    getUpcomingMaintenance(days = 30) {
        const today = new Date();
        const future = new Date(today.getTime() + days * 24 * 60 * 60 * 1000);

        return this.maintenanceLogs.filter(log => {
            if (!log.nextMaintenanceDate) return false;
            const nextDate = new Date(log.nextMaintenanceDate);
            return nextDate <= future && nextDate >= today;
        }).map(log => {
            const asset = this.assets.find(a => a.id === log.assetId);
            return {
                ...log,
                assetName: asset?.name,
                assetCode: asset?.code
            };
        });
    }

    // Render UI for assets module
    renderUI() {
        const container = document.getElementById('app-content');
        if (!container) return;

        container.innerHTML = `
            <div class="module-header">
                <h2 data-i18n="assets.title">Fixed Assets</h2>
                <button class="btn btn-primary" onclick="assets.showAddModal()">
                    <i class="icon-plus"></i> <span data-i18n="actions.add">Add Asset</span>
                </button>
            </div>

            <div class="stats-grid">
                <div class="stat-card">
                    <h3 data-i18n="assets.totalAssets">Total Assets</h3>
                    <p class="stat-value">${this.assets.filter(a => a.status === 'active').length}</p>
                </div>
                <div class="stat-card">
                    <h3 data-i18n="assets.totalValue">Total Value</h3>
                    <p class="stat-value">${this.getValuationReport().totalNetBookValue.toLocaleString()} EGP</p>
                </div>
                <div class="stat-card">
                    <h3 data-i18n="assets.monthlyDepreciation">Monthly Depreciation</h3>
                    <p class="stat-value">${this.calculateTotalMonthlyDepreciation().toLocaleString()} EGP</p>
                </div>
                <div class="stat-card">
                    <h3 data-i18n="assets.upcomingMaintenance">Upcoming Maintenance</h3>
                    <p class="stat-value">${this.getUpcomingMaintenance().length}</p>
                </div>
            </div>

            <div class="data-table-container">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th data-i18n="assets.code">Code</th>
                            <th data-i18n="assets.name">Name</th>
                            <th data-i18n="assets.category">Category</th>
                            <th data-i18n="assets.purchaseCost">Purchase Cost</th>
                            <th data-i18n="assets.accumulatedDepreciation">Accum. Depreciation</th>
                            <th data-i18n="assets.netBookValue">Net Book Value</th>
                            <th data-i18n="assets.status">Status</th>
                            <th data-i18n="actions.actions">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${this.assets.map(asset => `
                            <tr>
                                <td>${asset.code}</td>
                                <td>${asset.name}</td>
                                <td>${this.categories.find(c => c.id === asset.categoryId)?.name || '-'}</td>
                                <td>${asset.purchaseCost.toLocaleString()}</td>
                                <td>${asset.accumulatedDepreciation.toLocaleString()}</td>
                                <td>${asset.netBookValue.toLocaleString()}</td>
                                <td><span class="badge badge-${asset.status}">${asset.status}</span></td>
                                <td>
                                    <button class="btn-icon" onclick="assets.viewAsset('${asset.id}')" title="View">
                                        <i class="icon-eye"></i>
                                    </button>
                                    <button class="btn-icon" onclick="assets.editAsset('${asset.id}')" title="Edit">
                                        <i class="icon-edit"></i>
                                    </button>
                                    <button class="btn-icon" onclick="assets.disposeAsset('${asset.id}')" title="Dispose">
                                        <i class="icon-trash"></i>
                                    </button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;

        localization.applyTranslations();
    }

    calculateTotalMonthlyDepreciation() {
        return this.assets
            .filter(a => a.status === 'active')
            .reduce((total, asset) => total + this.calculateDepreciation(asset), 0);
    }

    showAddModal() {
        // Implementation for modal
        alert('Add Asset Modal - Coming soon');
    }

    viewAsset(id) {
        const asset = this.assets.find(a => a.id === id);
        console.log('View asset:', asset);
    }

    editAsset(id) {
        const asset = this.assets.find(a => a.id === id);
        console.log('Edit asset:', asset);
    }

    disposeAsset(id) {
        const asset = this.assets.find(a => a.id === id);
        console.log('Dispose asset:', asset);
    }
}

// Initialize module
const assets = new AssetsModule();
