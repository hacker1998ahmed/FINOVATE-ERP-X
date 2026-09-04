/**
 * FINOVATE ERP X - CRM Module
 * Phase 13: Customer Relationship Management
 * 
 * Features:
 * - Lead Management (Capture, Qualify, Convert)
 * - Sales Pipeline (Stages, Probability)
 * - Opportunity Tracking
 * - Contact Management
 * - Activity Logging (Calls, Meetings, Tasks)
 * - Follow-up Reminders
 * - Conversion Analytics
 */

class CRMModule {
    constructor() {
        this.leads = [];
        this.opportunities = [];
        this.contacts = [];
        this.activities = [];
        this.pipelineStages = [
            { id: 'new', name: 'New Lead', probability: 0.1 },
            { id: 'contacted', name: 'Contacted', probability: 0.25 },
            { id: 'qualified', name: 'Qualified', probability: 0.5 },
            { id: 'proposal', name: 'Proposal Sent', probability: 0.7 },
            { id: 'negotiation', name: 'Negotiation', probability: 0.85 },
            { id: 'closed_won', name: 'Closed Won', probability: 1.0 },
            { id: 'closed_lost', name: 'Closed Lost', probability: 0 }
        ];
    }

    // Initialize module
    async init() {
        await this.loadLeads();
        await this.loadOpportunities();
        await this.loadContacts();
        await this.loadActivities();
        console.log('CRM Module initialized');
    }

    // Load leads
    async loadLeads() {
        try {
            const response = await api.get('leads', { companyId: App.currentCompany });
            this.leads = response.data || [];
        } catch (error) {
            console.error('Error loading leads:', error);
            this.leads = [];
        }
    }

    // Load opportunities
    async loadOpportunities() {
        try {
            const response = await api.get('opportunities', { companyId: App.currentCompany });
            this.opportunities = response.data || [];
        } catch (error) {
            console.error('Error loading opportunities:', error);
            this.opportunities = [];
        }
    }

    // Load contacts
    async loadContacts() {
        try {
            const response = await api.get('contacts', { companyId: App.currentCompany });
            this.contacts = response.data || [];
        } catch (error) {
            console.error('Error loading contacts:', error);
            this.contacts = [];
        }
    }

    // Load activities
    async loadActivities() {
        try {
            const response = await api.get('activities', { companyId: App.currentCompany });
            this.activities = response.data || [];
        } catch (error) {
            console.error('Error loading activities:', error);
            this.activities = [];
        }
    }

    // Create new lead
    async createLead(leadData) {
        const lead = {
            id: 'LEAD-' + Date.now(),
            source: leadData.source || 'website',
            firstName: leadData.firstName,
            lastName: leadData.lastName,
            email: leadData.email,
            phone: leadData.phone,
            company: leadData.company,
            title: leadData.title,
            industry: leadData.industry,
            status: 'new',
            rating: leadData.rating || 'warm',
            assignedTo: leadData.assignedTo || Auth.currentUser?.email,
            notes: leadData.notes,
            createdAt: new Date().toISOString(),
            createdBy: Auth.currentUser?.email,
            companyId: App.currentCompany
        };

        try {
            const response = await api.post('leads', lead);
            if (response.success) {
                this.leads.push(lead);
                
                // Create initial activity
                await this.logActivity({
                    type: 'lead_created',
                    relatedType: 'lead',
                    relatedId: lead.id,
                    description: `New lead created: ${lead.firstName} ${lead.lastName}`,
                    dueDate: new Date().toISOString()
                });

                return { success: true, data: lead };
            }
            return response;
        } catch (error) {
            console.error('Error creating lead:', error);
            return { success: false, error: error.message };
        }
    }

    // Convert lead to customer and opportunity
    async convertLead(leadId, conversionData) {
        const lead = this.leads.find(l => l.id === leadId);
        if (!lead) return { success: false, error: 'Lead not found' };

        // Create customer from lead
        const customerData = {
            name: conversionData.customerName || `${lead.firstName} ${lead.lastName}`,
            email: lead.email,
            phone: lead.phone,
            company: lead.company,
            address: conversionData.address,
            taxNumber: conversionData.taxNumber,
            creditLimit: conversionData.creditLimit || 0,
            source: 'converted_lead',
            originalLeadId: leadId
        };

        const customerResult = await customers.createCustomer(customerData);
        
        if (!customerResult.success) {
            return customerResult;
        }

        // Create opportunity
        const opportunity = {
            id: 'OPP-' + Date.now(),
            name: conversionData.opportunityName || `${lead.company} - Opportunity`,
            customerId: customerResult.data.id,
            amount: parseFloat(conversionData.amount) || 0,
            stage: 'qualified',
            probability: 0.5,
            expectedCloseDate: conversionData.expectedCloseDate,
            description: conversionData.description,
            assignedTo: lead.assignedTo,
            sourceLeadId: leadId,
            status: 'open',
            createdAt: new Date().toISOString(),
            createdBy: Auth.currentUser?.email,
            companyId: App.currentCompany
        };

        const oppResult = await this.createOpportunity(opportunity);

        if (oppResult.success) {
            // Update lead status
            lead.status = 'converted';
            lead.convertedAt = new Date().toISOString();
            lead.convertedCustomerId = customerResult.data.id;
            lead.convertedOpportunityId = oppResult.data.id;

            await api.put(`leads/${leadId}`, {
                status: 'converted',
                convertedAt: lead.convertedAt,
                convertedCustomerId: lead.convertedCustomerId,
                convertedOpportunityId: lead.convertedOpportunityId
            });

            return { 
                success: true, 
                customer: customerResult.data, 
                opportunity: oppResult.data 
            };
        }

        return oppResult;
    }

    // Create opportunity
    async createOpportunity(opportunityData) {
        const opportunity = {
            id: opportunityData.id || 'OPP-' + Date.now(),
            name: opportunityData.name,
            customerId: opportunityData.customerId,
            amount: parseFloat(opportunityData.amount) || 0,
            stage: opportunityData.stage || 'new',
            probability: this.getStageProbability(opportunityData.stage),
            expectedCloseDate: opportunityData.expectedCloseDate,
            description: opportunityData.description,
            assignedTo: opportunityData.assignedTo || Auth.currentUser?.email,
            sourceLeadId: opportunityData.sourceLeadId,
            status: 'open',
            nextStep: opportunityData.nextStep,
            nextStepDate: opportunityData.nextStepDate,
            createdAt: opportunityData.createdAt || new Date().toISOString(),
            createdBy: Auth.currentUser?.email,
            companyId: App.currentCompany
        };

        try {
            const response = await api.post('opportunities', opportunity);
            if (response.success) {
                this.opportunities.push(opportunity);
                return { success: true, data: opportunity };
            }
            return response;
        } catch (error) {
            console.error('Error creating opportunity:', error);
            return { success: false, error: error.message };
        }
    }

    // Get probability by stage
    getStageProbability(stage) {
        const stageObj = this.pipelineStages.find(s => s.id === stage);
        return stageObj ? stageObj.probability : 0.1;
    }

    // Update opportunity stage
    async updateOpportunityStage(opportunityId, newStage) {
        const opportunity = this.opportunities.find(o => o.id === opportunityId);
        if (!opportunity) return { success: false, error: 'Opportunity not found' };

        const oldStage = opportunity.stage;
        opportunity.stage = newStage;
        opportunity.probability = this.getStageProbability(newStage);
        opportunity.updatedAt = new Date().toISOString();

        // Check if closed
        if (newStage === 'closed_won') {
            opportunity.status = 'won';
            opportunity.closedAt = new Date().toISOString();
            
            // Log won activity
            await this.logActivity({
                type: 'opportunity_won',
                relatedType: 'opportunity',
                relatedId: opportunityId,
                description: `Opportunity won: ${opportunity.name} - ${opportunity.amount.toLocaleString()} EGP`
            });
        } else if (newStage === 'closed_lost') {
            opportunity.status = 'lost';
            opportunity.closedAt = new Date().toISOString();
            opportunity.lossReason = opportunity.lossReason || 'No reason specified';
        }

        try {
            const response = await api.put(`opportunities/${opportunityId}`, {
                stage: newStage,
                probability: opportunity.probability,
                status: opportunity.status,
                updatedAt: opportunity.updatedAt
            });
            
            if (response.success) {
                // Log stage change
                await this.logActivity({
                    type: 'stage_changed',
                    relatedType: 'opportunity',
                    relatedId: opportunityId,
                    description: `Stage changed from ${oldStage} to ${newStage}`
                });
            }

            return response;
        } catch (error) {
            console.error('Error updating opportunity stage:', error);
            return { success: false, error: error.message };
        }
    }

    // Log activity
    async logActivity(activityData) {
        const activity = {
            id: 'ACT-' + Date.now(),
            type: activityData.type,
            relatedType: activityData.relatedType,
            relatedId: activityData.relatedId,
            description: activityData.description,
            status: activityData.status || 'completed',
            priority: activityData.priority || 'normal',
            assignedTo: activityData.assignedTo || Auth.currentUser?.email,
            dueDate: activityData.dueDate,
            completedAt: activityData.completedAt || new Date().toISOString(),
            notes: activityData.notes,
            createdAt: new Date().toISOString(),
            createdBy: Auth.currentUser?.email,
            companyId: App.currentCompany
        };

        this.activities.push(activity);

        try {
            const response = await api.post('activities', activity);
            return response;
        } catch (error) {
            console.error('Error logging activity:', error);
            return { success: false, error: error.message };
        }
    }

    // Schedule follow-up
    async scheduleFollowUp(relatedType, relatedId, followUpData) {
        return await this.logActivity({
            type: 'follow_up',
            relatedType: relatedType,
            relatedId: relatedId,
            description: followUpData.description,
            status: 'pending',
            priority: followUpData.priority || 'normal',
            dueDate: followUpData.dueDate,
            notes: followUpData.notes
        });
    }

    // Get pipeline summary
    getPipelineSummary() {
        const openOpps = this.opportunities.filter(o => o.status === 'open');
        
        const summary = {
            totalOpportunities: openOpps.length,
            totalValue: openOpps.reduce((sum, o) => sum + o.amount, 0),
            weightedValue: openOpps.reduce((sum, o) => sum + (o.amount * o.probability), 0),
            byStage: {}
        };

        for (const stage of this.pipelineStages) {
            const stageOpps = openOpps.filter(o => o.stage === stage.id);
            summary.byStage[stage.id] = {
                name: stage.name,
                count: stageOpps.length,
                value: stageOpps.reduce((sum, o) => sum + o.amount, 0),
                probability: stage.probability
            };
        }

        return summary;
    }

    // Get conversion analytics
    getConversionAnalytics() {
        const totalLeads = this.leads.length;
        const convertedLeads = this.leads.filter(l => l.status === 'converted').length;
        const conversionRate = totalLeads > 0 ? (convertedLeads / totalLeads) * 100 : 0;

        const wonOpps = this.opportunities.filter(o => o.status === 'won');
        const totalOpps = this.opportunities.length;
        const winRate = totalOpps > 0 ? (wonOpps.length / totalOpps) * 100 : 0;

        return {
            totalLeads,
            convertedLeads,
            conversionRate: parseFloat(conversionRate.toFixed(2)),
            totalOpportunities: totalOpps,
            wonOpportunities: wonOpps.length,
            winRate: parseFloat(winRate.toFixed(2)),
            totalWonValue: wonOpps.reduce((sum, o) => sum + o.amount, 0)
        };
    }

    // Get upcoming activities
    getUpcomingActivities(days = 7) {
        const today = new Date();
        const future = new Date(today.getTime() + days * 24 * 60 * 60 * 1000);

        return this.activities.filter(act => {
            if (act.status !== 'pending' || !act.dueDate) return false;
            const dueDate = new Date(act.dueDate);
            return dueDate <= future && dueDate >= today;
        }).sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
    }

    // Render CRM dashboard
    renderDashboard() {
        const container = document.getElementById('app-content');
        if (!container) return;

        const pipeline = this.getPipelineSummary();
        const analytics = this.getConversionAnalytics();
        const upcoming = this.getUpcomingActivities();

        container.innerHTML = `
            <div class="module-header">
                <h2 data-i18n="crm.title">Customer Relationship Management</h2>
                <button class="btn btn-primary" onclick="crm.showAddLeadModal()">
                    <i class="icon-plus"></i> <span data-i18n="crm.addLead">Add Lead</span>
                </button>
            </div>

            <div class="stats-grid">
                <div class="stat-card">
                    <h3 data-i18n="crm.totalLeads">Total Leads</h3>
                    <p class="stat-value">${analytics.totalLeads}</p>
                </div>
                <div class="stat-card">
                    <h3 data-i18n="crm.conversionRate">Conversion Rate</h3>
                    <p class="stat-value">${analytics.conversionRate}%</p>
                </div>
                <div class="stat-card">
                    <h3 data-i18n="crm.pipelineValue">Pipeline Value</h3>
                    <p class="stat-value">${pipeline.totalValue.toLocaleString()} EGP</p>
                </div>
                <div class="stat-card">
                    <h3 data-i18n="crm.weightedValue">Weighted Value</h3>
                    <p class="stat-value">${pipeline.weightedValue.toLocaleString()} EGP</p>
                </div>
            </div>

            <div class="crm-pipeline">
                <h3 data-i18n="crm.salesPipeline">Sales Pipeline</h3>
                <div class="pipeline-stages">
                    ${this.pipelineStages.map(stage => `
                        <div class="pipeline-stage">
                            <div class="stage-header">
                                <span>${stage.name}</span>
                                <span class="stage-probability">${(stage.probability * 100)}%</span>
                            </div>
                            <div class="stage-cards">
                                ${this.opportunities
                                    .filter(o => o.stage === stage.id && o.status === 'open')
                                    .map(opp => `
                                        <div class="opportunity-card" onclick="crm.viewOpportunity('${opp.id}')">
                                            <div class="opp-name">${opp.name}</div>
                                            <div class="opp-amount">${opp.amount.toLocaleString()} EGP</div>
                                            <div class="opp-customer">${customers.getCustomerName(opp.customerId)}</div>
                                        </div>
                                    `).join('')}
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>

            <div class="upcoming-activities">
                <h3 data-i18n="crm.upcomingActivities">Upcoming Activities</h3>
                <table class="data-table">
                    <thead>
                        <tr>
                            <th data-i18n="crm.type">Type</th>
                            <th data-i18n="crm.description">Description</th>
                            <th data-i18n="crm.dueDate">Due Date</th>
                            <th data-i18n="crm.priority">Priority</th>
                            <th data-i18n="actions.actions">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${upcoming.map(act => `
                            <tr>
                                <td><span class="badge badge-${act.type}">${act.type}</span></td>
                                <td>${act.description}</td>
                                <td>${new Date(act.dueDate).toLocaleDateString()}</td>
                                <td><span class="badge badge-${act.priority}">${act.priority}</span></td>
                                <td>
                                    <button class="btn-icon" onclick="crm.completeActivity('${act.id}')">
                                        <i class="icon-check"></i>
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

    showAddLeadModal() {
        alert('Add Lead Modal - Coming soon');
    }

    viewOpportunity(id) {
        const opp = this.opportunities.find(o => o.id === id);
        console.log('View opportunity:', opp);
    }

    completeActivity(id) {
        const activity = this.activities.find(a => a.id === id);
        if (activity) {
            activity.status = 'completed';
            activity.completedAt = new Date().toISOString();
            api.put(`activities/${id}`, { status: 'completed', completedAt: activity.completedAt });
            this.renderDashboard();
        }
    }
}

// Initialize module
const crm = new CRMModule();
