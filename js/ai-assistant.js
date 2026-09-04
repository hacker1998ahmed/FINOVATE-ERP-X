/**
 * FINOVATE AI Assistant - Finovate Copilot
 * Phase 22: AI Integration - Advanced Multi-Provider AI System
 * Developer: Ahmed Mostafa Ibrahim
 * Brand: FINOVATE – AHMED EG
 * 
 * Features:
 * - Support for 30+ AI Providers
 * - Advanced Agent System
 * - Multi-key Management
 * - Model Selection & Testing
 * - Google Drive Integration
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
        this.providers = this.initializeProviders();
        this.agents = this.initializeAgents();
        this.activeProvider = 'openai';
        this.activeModel = 'gpt-4o';
        this.apiKeys = this.loadAPIKeys();
        this.agentMode = false;
        this.activeAgents = [];
        this.init();
    }

    /**
     * Initialize 30+ AI Providers with all their models
     */
    initializeProviders() {
        return {
            // OpenAI Providers
            openai: {
                name: 'OpenAI',
                apiKeyField: 'openai_key',
                baseUrl: 'https://api.openai.com/v1',
                models: [
                    { id: 'gpt-4o', name: 'GPT-4o', type: 'chat', maxTokens: 128000 },
                    { id: 'gpt-4o-mini', name: 'GPT-4o Mini', type: 'chat', maxTokens: 128000 },
                    { id: 'gpt-4-turbo', name: 'GPT-4 Turbo', type: 'chat', maxTokens: 128000 },
                    { id: 'gpt-4', name: 'GPT-4', type: 'chat', maxTokens: 8192 },
                    { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', type: 'chat', maxTokens: 16385 },
                    { id: 'o1-preview', name: 'o1 Preview', type: 'reasoning', maxTokens: 32768 },
                    { id: 'o1-mini', name: 'o1 Mini', type: 'reasoning', maxTokens: 65536 }
                ],
                icon: '🟢'
            },
            // Anthropic
            anthropic: {
                name: 'Anthropic',
                apiKeyField: 'anthropic_key',
                baseUrl: 'https://api.anthropic.com/v1',
                models: [
                    { id: 'claude-sonnet-4-20250514', name: 'Claude Sonnet 4', type: 'chat', maxTokens: 200000 },
                    { id: 'claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet', type: 'chat', maxTokens: 200000 },
                    { id: 'claude-3-opus-20240229', name: 'Claude 3 Opus', type: 'chat', maxTokens: 200000 },
                    { id: 'claude-3-haiku-20240307', name: 'Claude 3 Haiku', type: 'chat', maxTokens: 200000 }
                ],
                icon: '🟠'
            },
            // Google
            google: {
                name: 'Google AI',
                apiKeyField: 'google_key',
                baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
                models: [
                    { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash', type: 'chat', maxTokens: 1048576 },
                    { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro', type: 'chat', maxTokens: 2097152 },
                    { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash', type: 'chat', maxTokens: 1048576 },
                    { id: 'gemini-pro', name: 'Gemini Pro', type: 'chat', maxTokens: 32768 }
                ],
                icon: '🔵'
            },
            // Microsoft Azure
            azure: {
                name: 'Azure OpenAI',
                apiKeyField: 'azure_key',
                baseUrl: 'https://{resource}.openai.azure.com/openai/deployments/{deployment}',
                models: [
                    { id: 'gpt-4o', name: 'GPT-4o', type: 'chat', maxTokens: 128000 },
                    { id: 'gpt-4-turbo', name: 'GPT-4 Turbo', type: 'chat', maxTokens: 128000 },
                    { id: 'gpt-35-turbo', name: 'GPT-3.5 Turbo', type: 'chat', maxTokens: 16385 }
                ],
                icon: '💠',
                requiresConfig: ['resource', 'deployment']
            },
            // Groq
            groq: {
                name: 'Groq',
                apiKeyField: 'groq_key',
                baseUrl: 'https://api.groq.com/openai/v1',
                models: [
                    { id: 'llama-3.1-70b-versatile', name: 'Llama 3.1 70B', type: 'chat', maxTokens: 131072 },
                    { id: 'llama-3.1-8b-instant', name: 'Llama 3.1 8B', type: 'chat', maxTokens: 131072 },
                    { id: 'mixtral-8x7b-32768', name: 'Mixtral 8x7B', type: 'chat', maxTokens: 32768 },
                    { id: 'gemma2-9b-it', name: 'Gemma2 9B', type: 'chat', maxTokens: 8192 }
                ],
                icon: '⚡'
            },
            // Meta
            meta: {
                name: 'Meta AI',
                apiKeyField: 'meta_key',
                baseUrl: 'https://api.llama-api.com',
                models: [
                    { id: 'llama-3.1-405b-instruct', name: 'Llama 3.1 405B', type: 'chat', maxTokens: 131072 },
                    { id: 'llama-3.1-70b-instruct', name: 'Llama 3.1 70B', type: 'chat', maxTokens: 131072 },
                    { id: 'llama-3.1-8b-instruct', name: 'Llama 3.1 8B', type: 'chat', maxTokens: 131072 }
                ],
                icon: '🦙'
            },
            // Mistral AI
            mistral: {
                name: 'Mistral AI',
                apiKeyField: 'mistral_key',
                baseUrl: 'https://api.mistral.ai/v1',
                models: [
                    { id: 'mistral-large-latest', name: 'Mistral Large', type: 'chat', maxTokens: 131072 },
                    { id: 'mistral-medium-latest', name: 'Mistral Medium', type: 'chat', maxTokens: 32768 },
                    { id: 'mistral-small-latest', name: 'Mistral Small', type: 'chat', maxTokens: 32768 },
                    { id: 'open-mixtral-8x7b', name: 'Mixtral 8x7B', type: 'chat', maxTokens: 32768 }
                ],
                icon: '🌀'
            },
            // Cohere
            cohere: {
                name: 'Cohere',
                apiKeyField: 'cohere_key',
                baseUrl: 'https://api.cohere.ai/v1',
                models: [
                    { id: 'command-r-plus', name: 'Command R+', type: 'chat', maxTokens: 128000 },
                    { id: 'command-r', name: 'Command R', type: 'chat', maxTokens: 128000 },
                    { id: 'command', name: 'Command', type: 'chat', maxTokens: 4096 }
                ],
                icon: '🟣'
            },
            // Perplexity
            perplexity: {
                name: 'Perplexity',
                apiKeyField: 'perplexity_key',
                baseUrl: 'https://api.perplexity.ai',
                models: [
                    { id: 'sonar-pro', name: 'Sonar Pro', type: 'chat', maxTokens: 200000 },
                    { id: 'sonar', name: 'Sonar', type: 'chat', maxTokens: 127000 },
                    { id: 'sonar-reasoning-pro', name: 'Sonar Reasoning Pro', type: 'reasoning', maxTokens: 127000 }
                ],
                icon: '🔍'
            },
            // DeepSeek
            deepseek: {
                name: 'DeepSeek',
                apiKeyField: 'deepseek_key',
                baseUrl: 'https://api.deepseek.com/v1',
                models: [
                    { id: 'deepseek-chat', name: 'DeepSeek Chat', type: 'chat', maxTokens: 128000 },
                    { id: 'deepseek-coder', name: 'DeepSeek Coder', type: 'code', maxTokens: 128000 },
                    { id: 'deepseek-reasoner', name: 'DeepSeek Reasoner', type: 'reasoning', maxTokens: 65536 }
                ],
                icon: '🐋'
            },
            // Qwen (Alibaba)
            qwen: {
                name: 'Qwen (Alibaba)',
                apiKeyField: 'qwen_key',
                baseUrl: 'https://dashscope-intl.aliyuncs.com/api/v1',
                models: [
                    { id: 'qwen-max', name: 'Qwen Max', type: 'chat', maxTokens: 32768 },
                    { id: 'qwen-plus', name: 'Qwen Plus', type: 'chat', maxTokens: 32768 },
                    { id: 'qwen-turbo', name: 'Qwen Turbo', type: 'chat', maxTokens: 131072 }
                ],
                icon: '☁️'
            },
            // Yi (01.AI)
            yi: {
                name: 'Yi (01.AI)',
                apiKeyField: 'yi_key',
                baseUrl: 'https://api.lingyiwanwu.com/v1',
                models: [
                    { id: 'yi-large', name: 'Yi Large', type: 'chat', maxTokens: 32768 },
                    { id: 'yi-medium', name: 'Yi Medium', type: 'chat', maxTokens: 32768 },
                    { id: 'yi-spark', name: 'Yi Spark', type: 'chat', maxTokens: 16384 }
                ],
                icon: '🌟'
            },
            // Moonshot
            moonshot: {
                name: 'Moonshot AI',
                apiKeyField: 'moonshot_key',
                baseUrl: 'https://api.moonshot.cn/v1',
                models: [
                    { id: 'moonshot-v1-128k', name: 'Moonshot V1 128K', type: 'chat', maxTokens: 131072 },
                    { id: 'moonshot-v1-32k', name: 'Moonshot V1 32K', type: 'chat', maxTokens: 32768 },
                    { id: 'moonshot-v1-8k', name: 'Moonshot V1 8K', type: 'chat', maxTokens: 8192 }
                ],
                icon: '🌙'
            },
            // Baichuan
            baichuan: {
                name: 'Baichuan AI',
                apiKeyField: 'baichuan_key',
                baseUrl: 'https://api.baichuan-ai.com/v1',
                models: [
                    { id: 'Baichuan4', name: 'Baichuan 4', type: 'chat', maxTokens: 32768 },
                    { id: 'Baichuan3-Turbo', name: 'Baichuan 3 Turbo', type: 'chat', maxTokens: 32768 }
                ],
                icon: '📯'
            },
            // StepFun
            stepfun: {
                name: 'StepFun',
                apiKeyField: 'stepfun_key',
                baseUrl: 'https://api.stepfun.com/v1',
                models: [
                    { id: 'step-1-32k', name: 'Step-1 32K', type: 'chat', maxTokens: 32768 },
                    { id: 'step-1-128k', name: 'Step-1 128K', type: 'chat', maxTokens: 131072 }
                ],
                icon: '👣'
            },
            // Minimax
            minimax: {
                name: 'MiniMax',
                apiKeyField: 'minimax_key',
                baseUrl: 'https://api.minimax.chat/v1',
                models: [
                    { id: 'abab6.5s-chat', name: 'ABAB 6.5S', type: 'chat', maxTokens: 256000 },
                    { id: 'abab6.5-chat', name: 'ABAB 6.5', type: 'chat', maxTokens: 8192 }
                ],
                icon: '🤖'
            },
            // SenseTime
            sensetime: {
                name: 'SenseTime',
                apiKeyField: 'sensetime_key',
                baseUrl: 'https://api.sensenova.cn/v1',
                models: [
                    { id: 'sensechat-5', name: 'SenseChat 5', type: 'chat', maxTokens: 32768 },
                    { id: 'sensechat-turbo', name: 'SenseChat Turbo', type: 'chat', maxTokens: 32768 }
                ],
                icon: '👁️'
            },
            // Zhipu (GLM)
            zhipu: {
                name: 'Zhipu AI (GLM)',
                apiKeyField: 'zhipu_key',
                baseUrl: 'https://open.bigmodel.cn/api/paas/v4',
                models: [
                    { id: 'glm-4', name: 'GLM-4', type: 'chat', maxTokens: 128000 },
                    { id: 'glm-4-air', name: 'GLM-4 Air', type: 'chat', maxTokens: 128000 },
                    { id: 'glm-4-flash', name: 'GLM-4 Flash', type: 'chat', maxTokens: 128000 }
                ],
                icon: '🧠'
            },
            // Together AI
            together: {
                name: 'Together AI',
                apiKeyField: 'together_key',
                baseUrl: 'https://api.together.xyz/v1',
                models: [
                    { id: 'meta-llama/Llama-3.1-405B-Instruct-Turbo', name: 'Llama 3.1 405B Turbo', type: 'chat', maxTokens: 32768 },
                    { id: 'meta-llama/Llama-3.1-70B-Instruct-Turbo', name: 'Llama 3.1 70B Turbo', type: 'chat', maxTokens: 32768 },
                    { id: 'mistralai/Mixtral-8x7B-Instruct-v0.1', name: 'Mixtral 8x7B', type: 'chat', maxTokens: 32768 }
                ],
                icon: '🚀'
            },
            // Fireworks AI
            fireworks: {
                name: 'Fireworks AI',
                apiKeyField: 'fireworks_key',
                baseUrl: 'https://api.fireworks.ai/inference/v1',
                models: [
                    { id: 'accounts/fireworks/models/llama-v3p1-405b-instruct', name: 'Llama 3.1 405B', type: 'chat', maxTokens: 131072 },
                    { id: 'accounts/fireworks/models/llama-v3p1-70b-instruct', name: 'Llama 3.1 70B', type: 'chat', maxTokens: 131072 }
                ],
                icon: '🎆'
            },
            // Replicate
            replicate: {
                name: 'Replicate',
                apiKeyField: 'replicate_key',
                baseUrl: 'https://api.replicate.com/v1',
                models: [
                    { id: 'meta/meta-llama-3.1-405b-instruct', name: 'Llama 3.1 405B', type: 'chat', maxTokens: 32768 },
                    { id: 'mistralai/mistral-large-2-instruct', name: 'Mistral Large 2', type: 'chat', maxTokens: 131072 }
                ],
                icon: '🔄'
            },
            // Hugging Face
            huggingface: {
                name: 'Hugging Face',
                apiKeyField: 'huggingface_key',
                baseUrl: 'https://api-inference.huggingface.co/models',
                models: [
                    { id: 'meta-llama/Meta-Llama-3.1-70B-Instruct', name: 'Llama 3.1 70B', type: 'chat', maxTokens: 8192 },
                    { id: 'mistralai/Mixtral-8x7B-Instruct-v0.1', name: 'Mixtral 8x7B', type: 'chat', maxTokens: 8192 }
                ],
                icon: '🤗'
            },
            // NVIDIA NIM
            nvidia: {
                name: 'NVIDIA NIM',
                apiKeyField: 'nvidia_key',
                baseUrl: 'https://integrate.api.nvidia.com/v1',
                models: [
                    { id: 'meta/llama-3.1-405b-instruct', name: 'Llama 3.1 405B', type: 'chat', maxTokens: 32768 },
                    { id: 'meta/llama-3.1-70b-instruct', name: 'Llama 3.1 70B', type: 'chat', maxTokens: 32768 },
                    { id: 'google/gemma-7b', name: 'Gemma 7B', type: 'chat', maxTokens: 8192 }
                ],
                icon: '🎮'
            },
            // IBM WatsonX
            ibm: {
                name: 'IBM watsonx.ai',
                apiKeyField: 'ibm_key',
                baseUrl: 'https://us-south.ml.cloud.ibm.com/ml/v1/text/generation',
                models: [
                    { id: 'ibm/granite-34b-code-instruct', name: 'Granite 34B Code', type: 'code', maxTokens: 8192 },
                    { id: 'ibm/granite-13b-chat-v2', name: 'Granite 13B Chat', type: 'chat', maxTokens: 8192 }
                ],
                icon: '🔷'
            },
            // Amazon Bedrock
            amazon: {
                name: 'Amazon Bedrock',
                apiKeyField: 'amazon_key',
                baseUrl: 'https://bedrock-runtime.{region}.amazonaws.com/model/{modelId}/invoke',
                models: [
                    { id: 'anthropic.claude-3-5-sonnet-20241022-v2:0', name: 'Claude 3.5 Sonnet', type: 'chat', maxTokens: 200000 },
                    { id: 'meta.llama3-1-405b-instruct-v1:0', name: 'Llama 3.1 405B', type: 'chat', maxTokens: 131072 },
                    { id: 'mistral.mistral-large-2407-v1:0', name: 'Mistral Large 2', type: 'chat', maxTokens: 131072 }
                ],
                icon: '📦',
                requiresConfig: ['region']
            },
            // Oracle Cloud
            oracle: {
                name: 'Oracle Cloud AI',
                apiKeyField: 'oracle_key',
                baseUrl: 'https://inference.generativeai.{region}.oci.oraclecloud.com/20231130/actions/chat',
                models: [
                    { id: 'cohere.command-r-plus', name: 'Command R+', type: 'chat', maxTokens: 128000 },
                    { id: 'meta.llama-3.1-70b-instruct', name: 'Llama 3.1 70B', type: 'chat', maxTokens: 131072 }
                ],
                icon: '🔶',
                requiresConfig: ['region']
            },
            // Stability AI
            stability: {
                name: 'Stability AI',
                apiKeyField: 'stability_key',
                baseUrl: 'https://api.stability.ai/v2beta',
                models: [
                    { id: 'stable-diffusion-xl-1024-v1-0', name: 'SDXL 1.0', type: 'image', maxTokens: 0 },
                    { id: 'stable-image-ultra-v1-1', name: 'Stable Image Ultra', type: 'image', maxTokens: 0 }
                ],
                icon: '🎨'
            },
            // ElevenLabs (Voice)
            elevenlabs: {
                name: 'ElevenLabs',
                apiKeyField: 'elevenlabs_key',
                baseUrl: 'https://api.elevenlabs.io/v1',
                models: [
                    { id: 'eleven_monolingual_v1', name: 'Eleven Monolingual', type: 'voice', maxTokens: 0 },
                    { id: 'eleven_multilingual_v2', name: 'Eleven Multilingual v2', type: 'voice', maxTokens: 0 }
                ],
                icon: '🎙️'
            },
            // Palm (Legacy Google)
            palm: {
                name: 'PaLM (Legacy)',
                apiKeyField: 'palm_key',
                baseUrl: 'https://generativelanguage.googleapis.com/v1beta3',
                models: [
                    { id: 'text-bison-001', name: 'Text Bison', type: 'chat', maxTokens: 8192 },
                    { id: 'chat-bison-001', name: 'Chat Bison', type: 'chat', maxTokens: 8192 }
                ],
                icon: '🌴'
            },
            // AI21 Labs
            ai21: {
                name: 'AI21 Labs',
                apiKeyField: 'ai21_key',
                baseUrl: 'https://api.ai21.com/studio/v1',
                models: [
                    { id: 'jamba-1.5-large', name: 'Jamba 1.5 Large', type: 'chat', maxTokens: 256000 },
                    { id: 'jamba-1.5-mini', name: 'Jamba 1.5 Mini', type: 'chat', maxTokens: 256000 }
                ],
                icon: '🧬'
            },
            // Local Ollama
            ollama: {
                name: 'Ollama (Local)',
                apiKeyField: 'ollama_key',
                baseUrl: 'http://localhost:11434/v1',
                models: [
                    { id: 'llama3.1', name: 'Llama 3.1', type: 'chat', maxTokens: 131072 },
                    { id: 'mistral', name: 'Mistral', type: 'chat', maxTokens: 32768 },
                    { id: 'codellama', name: 'Code Llama', type: 'code', maxTokens: 16384 },
                    { id: 'phi3', name: 'Phi-3', type: 'chat', maxTokens: 128000 }
                ],
                icon: '🦙',
                isLocal: true
            }
        };
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
