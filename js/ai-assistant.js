/**
 * FINOVATE AI Assistant - Finovate Copilot
 * Phase 22: AI Integration
 * Developer: Ahmed Mostafa Ibrahim
 * Brand: FINOVATE – AHMED EG
 */

class FinovateAI {
    constructor() {
        this.apiEndpoint = null;
        this.context = {
            currentCompany: null,
            currentUser: null,
            currentModule: null
        };
        this.conversationHistory = [];
        this.init();
    }

    init() {
        console.log('Finovate AI Assistant initialized');
        this.loadContext();
    }

    loadContext() {
        const session = JSON.parse(localStorage.getItem('finovate_session') || '{}');
        this.context.currentCompany = session.companyId || null;
        this.context.currentUser = session.userId || null;
        this.context.currentModule = window.currentModule || 'dashboard';
    }

    /**
     * تحليل مالي تلقائي
     */
    async analyzeFinancials(period = 'last_month') {
        try {
            const data = await Database.getFinancialSummary(period);
            
            const insights = {
                revenue: {
                    value: data.totalRevenue,
                    trend: this.calculateTrend(data.revenueHistory),
                    insight: this.generateRevenueInsight(data)
                },
                expenses: {
                    value: data.totalExpenses,
                    trend: this.calculateTrend(data.expenseHistory),
                    insight: this.generateExpenseInsight(data)
                },
                profit: {
                    value: data.netProfit,
                    margin: ((data.netProfit / data.totalRevenue) * 100).toFixed(2) + '%',
                    insight: this.generateProfitInsight(data)
                },
                anomalies: this.detectAnomalies(data)
            };

            return { success: true, data: insights };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    calculateTrend(history) {
        if (!history || history.length < 2) return 'stable';
        const last = history[history.length - 1];
        const prev = history[history.length - 2];
        const change = ((last - prev) / prev) * 100;
        
        if (change > 10) return 'increasing_strong';
        if (change > 0) return 'increasing';
        if (change < -10) return 'decreasing_strong';
        if (change < 0) return 'decreasing';
        return 'stable';
    }

    generateRevenueInsight(data) {
        const trend = this.calculateTrend(data.revenueHistory);
        const messages = {
            'increasing_strong': '📈 نمو قوي في الإيرادات بنسبة تزيد عن 10%',
            'increasing': '📈 نمو إيجابي في الإيرادات',
            'decreasing_strong': '📉 انخفاض حاد في الإيرادات يتطلب تدخلاً عاجلاً',
            'decreasing': '📉 انخفاض طفيف في الإيرادات',
            'stable': '➡️ استقرار في مستويات الإيرادات'
        };
        return messages[trend] || 'تحليل غير متوفر';
    }

    generateExpenseInsight(data) {
        const trend = this.calculateTrend(data.expenseHistory);
        const messages = {
            'increasing_strong': '⚠️ ارتفاع كبير في المصروفات يحتاج مراجعة',
            'increasing': '📊 زيادة في المصروفات',
            'decreasing_strong': '✅ توفير ممتاز في المصروفات',
            'decreasing': '✅ انخفاض جيد في المصروفات',
            'stable': '➡️ ثبات في مستويات المصروفات'
        };
        return messages[trend] || 'تحليل غير متوفر';
    }

    generateProfitInsight(data) {
        const margin = (data.netProfit / data.totalRevenue) * 100;
        if (margin > 20) return '🌟 هامش ربح ممتاز (>20%)';
        if (margin > 10) return '✅ هامش ربح جيد (10-20%)';
        if (margin > 0) return '⚠️ هامش ربح منخفض (<10%)';
        return '🔴 خسارة صافية - требуется خطة علاجية';
    }

    detectAnomalies(data) {
        const anomalies = [];
        // كشف الأنماط غير الطبيعية
        if (data.expenses > data.revenue * 0.9) {
            anomalies.push({
                type: 'warning',
                message: 'المصروفات تقترب من الإيرادات',
                severity: 'high'
            });
        }
        return anomalies;
    }

    /**
     * تنبؤ بالمخزون
     */
    async predictInventory(productId, days = 30) {
        try {
            const salesHistory = await Database.getProductSales(productId, 90);
            const currentStock = await Database.getProductStock(productId);
            
            const avgDailySales = salesHistory.reduce((a, b) => a + b.quantity, 0) / 90;
            const predictedDemand = avgDailySales * days;
            const daysUntilStockout = currentStock / avgDailySales;
            
            const prediction = {
                productId,
                currentStock,
                avgDailySales: avgDailySales.toFixed(2),
                predictedDemand: predictedDemand.toFixed(0),
                daysUntilStockout: Math.floor(daysUntilStockout),
                recommendation: this.generateStockRecommendation(daysUntilStockout, predictedDemand, currentStock),
                reorderPoint: (avgDailySales * 15).toFixed(0), // 15 days safety stock
                suggestedOrderQuantity: (predictedDemand - currentStock + (avgDailySales * 15)).toFixed(0)
            };

            return { success: true, data: prediction };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    generateStockRecommendation(daysUntilStockout, demand, stock) {
        if (daysUntilStockout < 7) return '🔴 عاجل: اطلب كمية جديدة فوراً';
        if (daysUntilStockout < 15) return '🟡 ينصح بالطلب خلال أسبوع';
        if (stock > demand * 2) return '🟢 المخزون كافٍ - قد يكون هناك فائض';
        return '🟢 المخزون ضمن المعدل الطبيعي';
    }

    /**
     * اقتراح قيود محاسبية ذكية (NLP Simulation)
     */
    suggestJournalEntry(description) {
        const patterns = [
            {
                keywords: ['مبيعات', 'بيع', 'فاتورة', 'invoice', 'sale'],
                entry: {
                    debit: { account: '1101', name: 'العملاء' },
                    credit: { account: '4101', name: 'إيرادات المبيعات' },
                    description: 'قيد مبيعات آجلة'
                }
            },
            {
                keywords: ['مشتريات', 'شراء', 'فاتورة مورد', 'purchase'],
                entry: {
                    debit: { account: '5101', name: 'تكلفة البضاعة المباعة' },
                    credit: { account: '2101', name: 'الموردون' },
                    description: 'قيد مشتريات آجلة'
                }
            },
            {
                keywords: ['مصروف', 'دفع', 'صرف', 'expense', 'payment'],
                entry: {
                    debit: { account: '6101', name: 'مصروفات عمومية' },
                    credit: { account: '1001', name: 'النقدية' },
                    description: 'قيد صرف مصروفات'
                }
            },
            {
                keywords: ['قبض', 'استلام', 'receipt', 'receive'],
                entry: {
                    debit: { account: '1001', name: 'النقدية' },
                    credit: { account: '1101', name: 'العملاء' },
                    description: 'قيد قبض من العملاء'
                }
            },
            {
                keywords: ['إهلاك', 'depreciation'],
                entry: {
                    debit: { account: '6201', name: 'مصروف الإهلاك' },
                    credit: { account: '1509', name: 'مجمع الإهلاك' },
                    description: 'قيد إهلاك الأصول'
                }
            }
        ];

        const lowerDesc = description.toLowerCase();
        for (const pattern of patterns) {
            if (pattern.keywords.some(kw => lowerDesc.includes(kw))) {
                return {
                    success: true,
                    suggestion: pattern.entry,
                    confidence: 0.85
                };
            }
        }

        return {
            success: true,
            suggestion: null,
            message: 'لم يتم التعرف على نمط محاسبي واضح. يرجى تحديد الحسابات يدوياً.',
            confidence: 0
        };
    }

    /**
     * تحليل مشاعر العملاء
     */
    analyzeCustomerSentiment(customerId) {
        // محاكاة لتحليل المشاعر
        const sentiments = ['positive', 'neutral', 'negative'];
        const feedbacks = [
            { text: 'خدمة ممتازة وسريعة', sentiment: 'positive', score: 0.9 },
            { text: 'جودة المنتجات جيدة', sentiment: 'positive', score: 0.8 },
            { text: 'التسليم تأخر قليلاً', sentiment: 'neutral', score: 0.5 },
            { text: 'السعر مرتفع مقارنة بالمنافسين', sentiment: 'negative', score: 0.3 },
            { text: 'دعم الفني رائع', sentiment: 'positive', score: 0.95 }
        ];

        return {
            customerId,
            overallSentiment: 'positive',
            averageScore: 0.68,
            feedbackCount: feedbacks.length,
            breakdown: {
                positive: 3,
                neutral: 1,
                negative: 1
            },
            recommendations: [
                'التركيز على تحسين وقت التسليم',
                'مراجعة سياسة التسعير',
                'الاستمرار في تقديم دعم فني ممتاز'
            ]
        };
    }

    /**
     * الدردشة مع المساعد الذكي
     */
    async chat(message) {
        this.conversationHistory.push({ role: 'user', content: message, timestamp: new Date() });

        const response = await this.processMessage(message);
        
        this.conversationHistory.push({ 
            role: 'assistant', 
            content: response, 
            timestamp: new Date() 
        });

        return response;
    }

    async processMessage(message) {
        const lowerMsg = message.toLowerCase();

        // أسئلة مالية
        if (lowerMsg.includes('ربح') || lowerMsg.includes('profit')) {
            const analysis = await this.analyzeFinancials();
            return `💰 ${analysis.data.profit.insight}\nهامش الربح: ${analysis.data.profit.margin}`;
        }

        if (lowerMsg.includes('إيراد') || lowerMsg.includes('revenue')) {
            const analysis = await this.analyzeFinancials();
            return `📈 ${analysis.data.revenue.insight}`;
        }

        if (lowerMsg.includes('مصروف') || lowerMsg.includes('expense')) {
            const analysis = await this.analyzeFinancials();
            return `📊 ${analysis.data.expenses.insight}`;
        }

        // أسئلة المخزون
        if (lowerMsg.includes('مخزون') || lowerMsg.includes('stock') || lowerMsg.includes('inventory')) {
            return '📦 يمكنني تحليل المخزون وتوقع النواقص. حدد منتجاً للحصول على تنبؤ دقيق.';
        }

        // أسئلة محاسبية
        if (lowerMsg.includes('قيد') || lowerMsg.includes('entry')) {
            return '📒 صف العملية المحاسبية وسأقترح عليك القيد المناسب. مثال: "دفعت مصروفات كهرباء"';
        }

        // ترحيب
        if (lowerMsg.includes('مرحبا') || lowerMsg.includes('hello') || lowerMsg.includes('help')) {
            return `👋 مرحباً! أنا مساعد Finovate الذكي.\n\nيمكنني مساعدتك في:\n• تحليل البيانات المالية\n• توقع المخزون والنواقص\n• اقتراح القيود المحاسبية\n• تحليل أداء العملاء\n• الإجابة على أسئلتك حول النظام\n\nاكتب سؤالك أو طلبك...`;
        }

        return '🤔 لم أفهم السؤال تماماً. يمكنك سؤالي عن: الأرباح، الإيرادات، المصروفات، المخزون، القيود المحاسبية، أو أي استفسار آخر عن بيانات شركتك.';
    }

    /**
     * توليد تقرير ذكي
     */
    async generateSmartReport(type, options = {}) {
        const report = {
            type,
            generatedAt: new Date(),
            summary: '',
            insights: [],
            recommendations: [],
            data: {}
        };

        switch (type) {
            case 'financial_health':
                const financials = await this.analyzeFinancials();
                report.summary = 'تحليل الصحة المالية الشاملة';
                report.insights = [
                    financials.data.profit.insight,
                    financials.data.revenue.insight,
                    financials.data.expenses.insight
                ];
                report.recommendations = financials.data.anomalies.map(a => a.message);
                report.data = financials.data;
                break;

            case 'inventory_optimization':
                report.summary = 'تحسين إدارة المخزون';
                report.insights = ['تحليل الأصناف بطيئة الحركة', 'تحديد فرص تقليل المخزون الراكد'];
                report.recommendations = [
                    'مراجعة أسعار الأصناف الراكدة',
                    'تنفيذ عروض ترويجية للمخزون القديم',
                    'تعديل نقاط إعادة الطلب'
                ];
                break;

            default:
                report.summary = 'تقرير عام';
        }

        return report;
    }

    /**
     * واجهة المستخدم للمساعد
     */
    renderChatInterface() {
        const container = document.createElement('div');
        container.id = 'finovate-ai-chat';
        container.innerHTML = `
            <div class="ai-chat-header">
                <h3>🤖 Finovate Copilot</h3>
                <button onclick="document.getElementById('finovate-ai-chat').remove()">✕</button>
            </div>
            <div class="ai-chat-messages" id="ai-messages"></div>
            <div class="ai-chat-input">
                <input type="text" id="ai-input" placeholder="اكتب سؤالك..." onkeypress="if(event.key==='Enter') sendAIQuery()">
                <button onclick="sendAIQuery()">إرسال</button>
            </div>
        `;
        
        document.body.appendChild(container);
        
        // رسالة ترحيبية
        setTimeout(() => {
            this.addAIMessage('assistant', '👋 مرحباً! كيف يمكنني مساعدتك اليوم؟');
        }, 500);
    }

    addAIMessage(role, content) {
        const messagesDiv = document.getElementById('ai-messages');
        if (!messagesDiv) return;

        const msgDiv = document.createElement('div');
        msgDiv.className = `ai-message ${role}`;
        msgDiv.innerHTML = `<p>${content}</p>`;
        messagesDiv.appendChild(msgDiv);
        messagesDiv.scrollTop = messagesDiv.scrollHeight;
    }
}

// دالة عامة لإرسال الاستعلامات
async function sendAIQuery() {
    const input = document.getElementById('ai-input');
    const message = input.value.trim();
    if (!message) return;

    const ai = new FinovateAI();
    ai.addAIMessage('user', message);
    input.value = '';

    const response = await ai.chat(message);
    ai.addAIMessage('assistant', response);
}

// تصدير الفئة
if (typeof module !== 'undefined' && module.exports) {
    module.exports = FinovateAI;
}
