/**
 * FINOVATE ERP X - Manufacturing Module
 * Phase 14: Manufacturing + BOM + Production
 * 
 * Features:
 * - Bill of Materials (BOM) - Multi-level
 * - Work Orders / Production Orders
 * - Raw Material Consumption
 * - Finished Goods Production
 * - Production Cost Calculation
 * - Scrap & Waste Tracking
 * - Production Variance Analysis
 */

class ManufacturingModule {
    constructor() {
        this.boms = [];
        this.workOrders = [];
        this.rawMaterials = [];
        this.finishedProducts = [];
        this.productionLogs = [];
        this.scraps = [];
    }

    // Initialize module
    async init() {
        await this.loadBOMs();
        await this.loadWorkOrders();
        await this.loadProductionLogs();
        console.log('Manufacturing Module initialized');
    }

    // Load BOMs
    async loadBOMs() {
        try {
            const response = await api.get('boms', { companyId: App.currentCompany });
            this.boms = response.data || [];
        } catch (error) {
            console.error('Error loading BOMs:', error);
            this.boms = [];
        }
    }

    // Load work orders
    async loadWorkOrders() {
        try {
            const response = await api.get('workOrders', { companyId: App.currentCompany });
            this.workOrders = response.data || [];
        } catch (error) {
            console.error('Error loading work orders:', error);
            this.workOrders = [];
        }
    }

    // Load production logs
    async loadProductionLogs() {
        try {
            const response = await api.get('productionLogs', { companyId: App.currentCompany });
            this.productionLogs = response.data || [];
        } catch (error) {
            console.error('Error loading production logs:', error);
            this.productionLogs = [];
        }
    }

    // Create BOM (Bill of Materials)
    async createBOM(bomData) {
        const bom = {
            id: 'BOM-' + Date.now(),
            productId: bomData.productId,
            productName: bomData.productName,
            version: bomData.version || '1.0',
            status: 'draft',
            items: bomData.items.map(item => ({
                materialId: item.materialId,
                materialName: item.materialName,
                quantity: parseFloat(item.quantity),
                unit: item.unit,
                wastePercentage: parseFloat(item.wastePercentage) || 0,
                cost: 0
            })),
            totalMaterialCost: 0,
            laborCost: parseFloat(bomData.laborCost) || 0,
            overheadCost: parseFloat(bomData.overheadCost) || 0,
            totalCost: 0,
            createdAt: new Date().toISOString(),
            createdBy: Auth.currentUser?.email,
            companyId: App.currentCompany
        };

        // Calculate costs
        await this.calculateBOMCost(bom);

        try {
            const response = await api.post('boms', bom);
            if (response.success) {
                this.boms.push(bom);
                return { success: true, data: bom };
            }
            return response;
        } catch (error) {
            console.error('Error creating BOM:', error);
            return { success: false, error: error.message };
        }
    }

    // Calculate BOM cost
    async calculateBOMCost(bom) {
        let totalMaterialCost = 0;

        for (const item of bom.items) {
            // Get material cost from products
            const product = await products.getProduct(item.materialId);
            if (product) {
                const materialCost = product.costPrice || product.purchasePrice || 0;
                const quantityWithWaste = item.quantity * (1 + item.wastePercentage / 100);
                item.cost = materialCost * quantityWithWaste;
                totalMaterialCost += item.cost;
            }
        }

        bom.totalMaterialCost = totalMaterialCost;
        bom.totalCost = totalMaterialCost + bom.laborCost + bom.overheadCost;
    }

    // Create Work Order
    async createWorkOrder(workOrderData) {
        const bom = this.boms.find(b => b.id === workOrderData.bomId);
        if (!bom) return { success: false, error: 'BOM not found' };

        const workOrder = {
            id: 'WO-' + Date.now(),
            number: this.generateWONumber(),
            bomId: bom.id,
            productId: bom.productId,
            productName: bom.productName,
            quantity: parseInt(workOrderData.quantity),
            status: 'planned',
            plannedStartDate: workOrderData.plannedStartDate,
            plannedEndDate: workOrderData.plannedEndDate,
            actualStartDate: null,
            actualEndDate: null,
            warehouseId: workOrderData.warehouseId,
            assignedTo: workOrderData.assignedTo,
            notes: workOrderData.notes,
            materialsIssued: [],
            finishedQuantity: 0,
            scrapQuantity: 0,
            actualMaterialCost: 0,
            actualLaborCost: 0,
            actualOverheadCost: 0,
            totalActualCost: 0,
            variance: 0,
            createdAt: new Date().toISOString(),
            createdBy: Auth.currentUser?.email,
            companyId: App.currentCompany
        };

        try {
            const response = await api.post('workOrders', workOrder);
            if (response.success) {
                this.workOrders.push(workOrder);
                return { success: true, data: workOrder };
            }
            return response;
        } catch (error) {
            console.error('Error creating work order:', error);
            return { success: false, error: error.message };
        }
    }

    // Generate work order number
    generateWONumber() {
        const prefix = 'WO';
        const year = new Date().getFullYear();
        const count = this.workOrders.filter(wo => wo.number.startsWith(`${prefix}-${year}`)).length + 1;
        return `${prefix}-${year}-${String(count).padStart(4, '0')}`;
    }

    // Start work order
    async startWorkOrder(workOrderId) {
        const workOrder = this.workOrders.find(wo => wo.id === workOrderId);
        if (!workOrder) return { success: false, error: 'Work order not found' };

        workOrder.status = 'in_progress';
        workOrder.actualStartDate = new Date().toISOString();

        // Issue materials to production
        await this.issueMaterials(workOrder);

        try {
            const response = await api.put(`workOrders/${workOrderId}`, {
                status: 'in_progress',
                actualStartDate: workOrder.actualStartDate
            });
            return response;
        } catch (error) {
            console.error('Error starting work order:', error);
            return { success: false, error: error.message };
        }
    }

    // Issue materials to production
    async issueMaterials(workOrder) {
        const bom = this.boms.find(b => b.id === workOrder.bomId);
        if (!bom) return;

        for (const item of bom.items) {
            const quantityToIssue = item.quantity * workOrder.quantity;
            
            // Create stock issue transaction
            const issueData = {
                type: 'production_issue',
                productId: item.materialId,
                quantity: quantityToIssue,
                warehouseId: workOrder.warehouseId,
                reference: workOrder.id,
                notes: `Material issued for WO: ${workOrder.number}`
            };

            await products.adjustStock(issueData);
            
            workOrder.materialsIssued.push({
                materialId: item.materialId,
                quantity: quantityToIssue,
                issuedAt: new Date().toISOString()
            });

            workOrder.actualMaterialCost += item.cost * workOrder.quantity;
        }
    }

    // Complete production - add finished goods
    async completeProduction(workOrderId, completionData) {
        const workOrder = this.workOrders.find(wo => wo.id === workOrderId);
        if (!workOrder) return { success: false, error: 'Work order not found' };

        const finishedQty = parseInt(completionData.finishedQuantity);
        const scrapQty = parseInt(completionData.scrapQuantity) || 0;

        // Add finished goods to inventory
        const productionData = {
            type: 'production_complete',
            productId: workOrder.productId,
            quantity: finishedQty,
            warehouseId: workOrder.warehouseId,
            reference: workOrder.id,
            batchNumber: completionData.batchNumber,
            expiryDate: completionData.expiryDate,
            costPerUnit: workOrder.totalActualCost / finishedQty,
            notes: `Production completed for WO: ${workOrder.number}`
        };

        await products.adjustStock(productionData);

        // Record scrap if any
        if (scrapQty > 0) {
            await this.recordScrap({
                workOrderId: workOrderId,
                productId: workOrder.productId,
                quantity: scrapQty,
                reason: completionData.scrapReason || 'Production waste',
                warehouseId: workOrder.warehouseId
            });
        }

        // Update work order
        workOrder.finishedQuantity = finishedQty;
        workOrder.scrapQuantity = scrapQty;
        workOrder.status = 'completed';
        workOrder.actualEndDate = new Date().toISOString();

        // Calculate variance
        const bom = this.boms.find(b => b.id === workOrder.bomId);
        const expectedCost = bom.totalCost * workOrder.quantity;
        workOrder.variance = workOrder.totalActualCost - expectedCost;

        // Log production
        this.productionLogs.push({
            id: 'PROD-' + Date.now(),
            workOrderId: workOrder.id,
            date: new Date().toISOString(),
            productId: workOrder.productId,
            quantity: finishedQty,
            scrapQuantity: scrapQty,
            cost: workOrder.totalActualCost,
            variance: workOrder.variance
        });

        try {
            const response = await api.put(`workOrders/${workOrderId}`, {
                finishedQuantity: finishedQty,
                scrapQuantity: scrapQty,
                status: 'completed',
                actualEndDate: workOrder.actualEndDate,
                variance: workOrder.variance
            });
            return response;
        } catch (error) {
            console.error('Error completing production:', error);
            return { success: false, error: error.message };
        }
    }

    // Record scrap
    async recordScrap(scrapData) {
        const scrap = {
            id: 'SCRAP-' + Date.now(),
            workOrderId: scrapData.workOrderId,
            productId: scrapData.productId,
            quantity: scrapData.quantity,
            reason: scrapData.reason,
            warehouseId: scrapData.warehouseId,
            recordedAt: new Date().toISOString(),
            recordedBy: Auth.currentUser?.email,
            companyId: App.currentCompany
        };

        this.scraps.push(scrap);

        try {
            const response = await api.post('scraps', scrap);
            return response;
        } catch (error) {
            console.error('Error recording scrap:', error);
            return { success: false, error: error.message };
        }
    }

    // Get production cost report
    getProductionCostReport(startDate, endDate) {
        const filteredOrders = this.workOrders.filter(wo => {
            const orderDate = new Date(wo.createdAt);
            return orderDate >= new Date(startDate) && orderDate <= new Date(endDate);
        });

        const report = {
            totalOrders: filteredOrders.length,
            completedOrders: filteredOrders.filter(wo => wo.status === 'completed').length,
            totalPlannedCost: 0,
            totalActualCost: 0,
            totalVariance: 0,
            byProduct: {}
        };

        for (const wo of filteredOrders) {
            const bom = this.boms.find(b => b.id === wo.bomId);
            if (bom) {
                const plannedCost = bom.totalCost * wo.quantity;
                report.totalPlannedCost += plannedCost;
                report.totalActualCost += wo.totalActualCost;
                report.totalVariance += wo.variance || 0;

                if (!report.byProduct[wo.productName]) {
                    report.byProduct[wo.productName] = {
                        orders: 0,
                        plannedCost: 0,
                        actualCost: 0,
                        variance: 0
                    };
                }

                report.byProduct[wo.productName].orders++;
                report.byProduct[wo.productName].plannedCost += plannedCost;
                report.byProduct[wo.productName].actualCost += wo.totalActualCost;
                report.byProduct[wo.productName].variance += wo.variance || 0;
            }
        }

        report.variancePercentage = report.totalPlannedCost > 0 
            ? ((report.totalVariance / report.totalPlannedCost) * 100).toFixed(2) 
            : 0;

        return report;
    }

    // Get BOM usage report
    getBOMUsageReport(productId) {
        return this.boms.filter(bom => bom.productId === productId);
    }

    // Render manufacturing dashboard
    renderDashboard() {
        const container = document.getElementById('app-content');
        if (!container) return;

        const activeOrders = this.workOrders.filter(wo => wo.status === 'in_progress');
        const plannedOrders = this.workOrders.filter(wo => wo.status === 'planned');
        const completedToday = this.workOrders.filter(wo => {
            const today = new Date().toDateString();
            return wo.status === 'completed' && new Date(wo.actualEndDate).toDateString() === today;
        });

        container.innerHTML = `
            <div class="module-header">
                <h2 data-i18n="manufacturing.title">Manufacturing</h2>
                <button class="btn btn-primary" onclick="manufacturing.showCreateBOMModal()">
                    <i class="icon-plus"></i> <span data-i18n="manufacturing.createBOM">Create BOM</span>
                </button>
            </div>

            <div class="stats-grid">
                <div class="stat-card">
                    <h3 data-i18n="manufacturing.activeOrders">Active Orders</h3>
                    <p class="stat-value">${activeOrders.length}</p>
                </div>
                <div class="stat-card">
                    <h3 data-i18n="manufacturing.plannedOrders">Planned Orders</h3>
                    <p class="stat-value">${plannedOrders.length}</p>
                </div>
                <div class="stat-card">
                    <h3 data-i18n="manufacturing.completedToday">Completed Today</h3>
                    <p class="stat-value">${completedToday.length}</p>
                </div>
                <div class="stat-card">
                    <h3 data-i18n="manufacturing.totalBOMs">Total BOMs</h3>
                    <p class="stat-value">${this.boms.length}</p>
                </div>
            </div>

            <div class="data-table-container">
                <h3 data-i18n="manufacturing.workOrders">Work Orders</h3>
                <table class="data-table">
                    <thead>
                        <tr>
                            <th data-i18n="manufacturing.orderNumber">Order #</th>
                            <th data-i18n="manufacturing.product">Product</th>
                            <th data-i18n="manufacturing.quantity">Quantity</th>
                            <th data-i18n="manufacturing.status">Status</th>
                            <th data-i18n="manufacturing.startDate">Start Date</th>
                            <th data-i18n="manufacturing.endDate">End Date</th>
                            <th data-i18n="actions.actions">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${this.workOrders.map(wo => `
                            <tr>
                                <td>${wo.number}</td>
                                <td>${wo.productName}</td>
                                <td>${wo.quantity}</td>
                                <td><span class="badge badge-${wo.status}">${wo.status}</span></td>
                                <td>${wo.actualStartDate ? new Date(wo.actualStartDate).toLocaleDateString() : wo.plannedStartDate ? new Date(wo.plannedStartDate).toLocaleDateString() : '-'}</td>
                                <td>${wo.actualEndDate ? new Date(wo.actualEndDate).toLocaleDateString() : wo.plannedEndDate ? new Date(wo.plannedEndDate).toLocaleDateString() : '-'}</td>
                                <td>
                                    ${wo.status === 'planned' ? `
                                        <button class="btn-icon" onclick="manufacturing.startWorkOrder('${wo.id}')">
                                            <i class="icon-play"></i>
                                        </button>
                                    ` : ''}
                                    ${wo.status === 'in_progress' ? `
                                        <button class="btn-icon" onclick="manufacturing.completeWorkOrder('${wo.id}')">
                                            <i class="icon-check"></i>
                                        </button>
                                    ` : ''}
                                    <button class="btn-icon" onclick="manufacturing.viewWorkOrder('${wo.id}')">
                                        <i class="icon-eye"></i>
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

    showCreateBOMModal() {
        alert('Create BOM Modal - Coming soon');
    }

    startWorkOrder(id) {
        this.startWorkOrder(id);
    }

    completeWorkOrder(id) {
        alert('Complete Production Modal - Coming soon');
    }

    viewWorkOrder(id) {
        const wo = this.workOrders.find(w => w.id === id);
        console.log('View work order:', wo);
    }
}

// Initialize module
const manufacturing = new ManufacturingModule();
