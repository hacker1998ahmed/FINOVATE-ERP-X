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

    /**
     * Initialize API Keys from localStorage
     */
    loadAPIKeys() {
        const keys = localStorage.getItem('finovate_ai_keys');
        return keys ? JSON.parse(keys) : {};
    }

    /**
     * Save API Key for a provider
     */
    saveAPIKey(providerId, key) {
        this.apiKeys[providerId] = key;
        localStorage.setItem('finovate_ai_keys', JSON.stringify(this.apiKeys));
        return true;
    }

    /**
     * Remove API Key
     */
    removeAPIKey(providerId) {
        delete this.apiKeys[providerId];
        localStorage.setItem('finovate_ai_keys', JSON.stringify(this.apiKeys));
        return true;
    }

    /**
     * Get API Key URL for provider
     */
    getKeyUrl(providerId) {
        const urls = {
            openai: 'https://platform.openai.com/api-keys',
            anthropic: 'https://console.anthropic.com/settings/keys',
            google: 'https://aistudio.google.com/app/apikey',
            azure: 'https://portal.azure.com/#view/Microsoft_Azure_Project_Oxford/CognitiveServicesHub',
            groq: 'https://console.groq.com/keys',
            meta: 'https://llama.meta.com/llama-api/',
            mistral: 'https://console.mistral.ai/api-keys/',
            cohere: 'https://dashboard.cohere.com/api-keys',
            perplexity: 'https://www.perplexity.ai/settings/api',
            deepseek: 'https://platform.deepseek.com/api_keys',
            qwen: 'https://dashscope.console.aliyun.com/apiKey',
            yi: 'https://platform.lingyiwanwu.com/apikeys',
            moonshot: 'https://platform.moonshot.cn/console/api-keys',
            baichuan: 'https://www.baichuan-ai.com/console/apikey',
            stepfun: 'https://platform.stepfun.com/interface-key',
            minimax: 'https://api.minimax.chat/usercenter/basic-information/interface-key',
            sensetime: 'https://console.sensenova.cn/iam/apikey/manage',
            zhipu: 'https://open.bigmodel.cn/usercenter/apikeys',
            together: 'https://api.together.xyz/settings/api-keys',
            fireworks: 'https://fireworks.ai/account/api-keys',
            replicate: 'https://replicate.com/account/api-tokens',
            huggingface: 'https://huggingface.co/settings/tokens',
            nvidia: 'https://build.nvidia.com/explore/discover',
            ibm: 'https://cloud.ibm.com/apidocs/watsonx-ai',
            amazon: 'https://console.aws.amazon.com/bedrock/home',
            oracle: 'https://cloud.oracle.com/generative-ai',
            stability: 'https://platform.stability.ai/account/keys',
            elevenlabs: 'https://elevenlabs.io/speech-synthesis',
            palm: 'https://makersuite.google.com/app/apikey',
            ai21: 'https://studio.ai21.com/account/api-key',
            ollama: 'http://localhost:11434'
        };
        return urls[providerId] || '#';
    }

    /**
     * Test API Key connectivity
     */
    async testAPIKey(providerId) {
        const key = this.apiKeys[providerId];
        if (!key) {
            return { success: false, message: 'No API key found' };
        }

        try {
            const provider = this.providers[providerId];
            let response;

            // Simple test based on provider type
            switch (providerId) {
                case 'openai':
                    response = await fetch(`${provider.baseUrl}/models`, {
                        headers: { 'Authorization': `Bearer ${key}` }
                    });
                    break;
                case 'anthropic':
                    response = await fetch(`${provider.baseUrl}/models`, {
                        headers: { 
                            'X-API-Key': key,
                            'anthropic-version': '2023-06-01'
                        }
                    });
                    break;
                case 'google':
                    response = await fetch(`${provider.baseUrl}/models?key=${key}`);
                    break;
                case 'groq':
                    response = await fetch(`${provider.baseUrl}/models`, {
                        headers: { 'Authorization': `Bearer ${key}` }
                    });
                    break;
                case 'mistral':
                    response = await fetch(`${provider.baseUrl}/models`, {
                        headers: { 'Authorization': `Bearer ${key}` }
                    });
                    break;
                case 'ollama':
                    response = await fetch(`${provider.baseUrl}/tags`);
                    break;
                default:
                    // Generic test - just check if key exists
                    return { 
                        success: true, 
                        message: `API key configured for ${provider.name}. Manual testing required.` 
                    };
            }

            if (response && response.ok) {
                return { success: true, message: 'Connection successful!' };
            } else {
                const error = await response?.text() || 'Unknown error';
                return { success: false, message: `Connection failed: ${error}` };
            }
        } catch (error) {
            return { success: false, message: `Error: ${error.message}` };
        }
    }

    /**
     * Initialize AI Agents System
     */
    initializeAgents() {
        return {
            financial_analyst: {
                id: 'financial_analyst',
                name: 'المحلل المالي',
                nameEn: 'Financial Analyst',
                icon: '📊',
                description: 'متخصص في تحليل البيانات المالية والأداء الاقتصادي',
                descriptionEn: 'Specialized in financial data analysis and economic performance',
                expertise: ['financial_analysis', 'profit_loss', 'cash_flow', 'budgeting'],
                enabled: true,
                color: '#10b981'
            },
            inventory_manager: {
                id: 'inventory_manager',
                name: 'مدير المخزون',
                nameEn: 'Inventory Manager',
                icon: '📦',
                description: 'خبير في إدارة المخزون والتنبؤ بالطلب',
                descriptionEn: 'Expert in inventory management and demand forecasting',
                expertise: ['inventory_optimization', 'stock_prediction', 'warehouse_management'],
                enabled: true,
                color: '#f59e0b'
            },
            accounting_assistant: {
                id: 'accounting_assistant',
                name: 'المساعد المحاسبي',
                nameEn: 'Accounting Assistant',
                icon: '📒',
                description: 'مساعد محاسبي لإدخال القيود والتحليلات',
                descriptionEn: 'Accounting assistant for journal entries and analysis',
                expertise: ['journal_entries', 'account_reconciliation', 'tax_compliance'],
                enabled: true,
                color: '#3b82f6'
            },
            hr_specialist: {
                id: 'hr_specialist',
                name: 'أخصائي الموارد البشرية',
                nameEn: 'HR Specialist',
                icon: '👥',
                description: 'متخصص في شؤون الموظفين والرواتب',
                descriptionEn: 'Specialist in employee affairs and payroll',
                expertise: ['payroll', 'attendance', 'recruitment', 'performance'],
                enabled: true,
                color: '#ec4899'
            },
            sales_optimizer: {
                id: 'sales_optimizer',
                name: 'محسن المبيعات',
                nameEn: 'Sales Optimizer',
                icon: '📈',
                description: 'خبير في تحسين المبيعات والتسويق',
                descriptionEn: 'Expert in sales optimization and marketing',
                expertise: ['sales_analysis', 'customer_segmentation', 'pricing_strategy'],
                enabled: true,
                color: '#8b5cf6'
            },
            procurement_advisor: {
                id: 'procurement_advisor',
                name: 'مستشار المشتريات',
                nameEn: 'Procurement Advisor',
                icon: '🛒',
                description: 'مستشار للمشتريات وإدارة الموردين',
                descriptionEn: 'Advisor for procurement and supplier management',
                expertise: ['supplier_evaluation', 'purchase_optimization', 'cost_reduction'],
                enabled: true,
                color: '#06b6d4'
            },
            crm_specialist: {
                id: 'crm_specialist',
                name: 'أخصائي CRM',
                nameEn: 'CRM Specialist',
                icon: '🤝',
                description: 'متخصص في إدارة علاقات العملاء',
                descriptionEn: 'Specialist in customer relationship management',
                expertise: ['customer_analysis', 'retention_strategy', 'satisfaction'],
                enabled: true,
                color: '#f97316'
            },
            project_manager: {
                id: 'project_manager',
                name: 'مدير المشاريع',
                nameEn: 'Project Manager',
                icon: '📋',
                description: 'خبير في إدارة المشاريع والموارد',
                descriptionEn: 'Expert in project and resource management',
                expertise: ['project_planning', 'resource_allocation', 'timeline_optimization'],
                enabled: true,
                color: '#6366f1'
            },
            compliance_officer: {
                id: 'compliance_officer',
                name: 'مسؤول الامتثال',
                nameEn: 'Compliance Officer',
                icon: '⚖️',
                description: 'مراقب للامتثال واللوائح الضريبية',
                descriptionEn: 'Monitor for compliance and tax regulations',
                expertise: ['tax_compliance', 'audit_preparation', 'regulatory_reporting'],
                enabled: true,
                color: '#14b8a6'
            },
            bi_analyst: {
                id: 'bi_analyst',
                name: 'محلل BI',
                nameEn: 'BI Analyst',
                icon: '📊',
                description: 'محلل ذكاء الأعمال والتقارير',
                descriptionEn: 'Business intelligence and reports analyst',
                expertise: ['dashboard_creation', 'kpi_tracking', 'trend_analysis'],
                enabled: true,
                color: '#0ea5e9'
            }
        };
    }

    /**
     * Load user preferences
     */
    loadPreferences() {
        const prefs = localStorage.getItem('finovate_ai_prefs');
        if (prefs) {
            const parsed = JSON.parse(prefs);
            this.activeProvider = parsed.activeProvider || 'openai';
            this.activeModel = parsed.activeModel || 'gpt-4o';
            this.agentMode = parsed.agentMode || false;
            this.activeAgents = parsed.activeAgents || [];
        }
    }

    /**
     * Save user preferences
     */
    savePreferences() {
        const prefs = {
            activeProvider: this.activeProvider,
            activeModel: this.activeModel,
            agentMode: this.agentMode,
            activeAgents: this.activeAgents
        };
        localStorage.setItem('finovate_ai_prefs', JSON.stringify(prefs));
    }

    /**
     * Render Settings UI
     */
    renderSettingsUI(container) {
        if (!container) return;

        const isRTL = document.documentElement.dir === 'rtl';
        const t = {
            title: isRTL ? 'إعدادات الذكاء الاصطناعي' : 'AI Settings',
            provider: isRTL ? 'مزود الخدمة' : 'Provider',
            model: isRTL ? 'النموذج' : 'Model',
            apiKey: isRTL ? 'مفتاح API' : 'API Key',
            save: isRTL ? 'حفظ' : 'Save',
            test: isRTL ? 'اختبار' : 'Test',
            getUrl: isRTL ? 'احصل على المفتاح' : 'Get Key',
            agents: isRTL ? 'الوكلاء الأذكياء' : 'AI Agents',
            enableAgentMode: isRTL ? 'تفعيل وضع الوكلاء' : 'Enable Agent Mode',
            selectAgents: isRTL ? 'اختر الوكلاء' : 'Select Agents',
            status: isRTL ? 'الحالة' : 'Status',
            configured: isRTL ? 'مكوّن' : 'Configured',
            notConfigured: isRTL ? 'غير مكوّن' : 'Not Configured',
            testing: isRTL ? 'جاري الاختبار...' : 'Testing...',
            success: isRTL ? 'ناجح' : 'Success',
            failed: isRTL ? 'فشل' : 'Failed'
        };

        let html = `
            <div class="ai-settings-header">
                <h2>🤖 ${t.title}</h2>
            </div>

            <div class="ai-settings-section">
                <h3>${t.provider} & ${t.model}</h3>
                <div class="ai-setting-row">
                    <label>${t.provider}</label>
                    <select id="ai-provider-select" onchange="FinovateAIInstance.onProviderChange(this.value)">
        `;

        // Provider options
        Object.entries(this.providers).forEach(([key, provider]) => {
            const selected = key === this.activeProvider ? 'selected' : '';
            const hasKey = this.apiKeys[key] ? '✅' : '⚪';
            html += `<option value="${key}" ${selected}>${provider.icon} ${provider.name} ${hasKey}</option>`;
        });

        html += `
                    </select>
                </div>

                <div class="ai-setting-row">
                    <label>${t.model}</label>
                    <select id="ai-model-select">
        `;

        // Model options for current provider
        const currentProvider = this.providers[this.activeProvider];
        if (currentProvider && currentProvider.models) {
            currentProvider.models.forEach(model => {
                const selected = model.id === this.activeModel ? 'selected' : '';
                html += `<option value="${model.id}" ${selected}>${model.name} (${(model.maxTokens / 1000).toFixed(0)}K)</option>`;
            });
        }

        html += `
                    </select>
                </div>
            </div>

            <div class="ai-settings-section">
                <h3>🔑 ${t.apiKey}</h3>
        `;

        // API Key management for each provider
        Object.entries(this.providers).forEach(([key, provider]) => {
            const hasKey = !!this.apiKeys[key];
            const statusClass = hasKey ? 'status-configured' : 'status-not-configured';
            const statusText = hasKey ? t.configured : t.notConfigured;

            html += `
                <div class="ai-api-key-card" id="api-key-card-${key}">
                    <div class="api-key-header">
                        <span class="provider-icon">${provider.icon}</span>
                        <span class="provider-name">${provider.name}</span>
                        <span class="api-key-status ${statusClass}">${statusText}</span>
                    </div>
                    <div class="api-key-inputs">
                        <input type="password" 
                               id="api-key-input-${key}" 
                               placeholder="${t.apiKey}..." 
                               value="${this.apiKeys[key] || ''}"
                               class="api-key-field">
                        <div class="api-key-actions">
                            <button onclick="FinovateAIInstance.saveAPIKeyFromUI('${key}')" 
                                    class="btn-save" 
                                    title="${t.save}">💾</button>
                            <button onclick="FinovateAIInstance.testAPIKeyFromUI('${key}')" 
                                    class="btn-test" 
                                    title="${t.test}">🧪</button>
                            <a href="${this.getKeyUrl(key)}" 
                               target="_blank" 
                               class="btn-get-key" 
                               title="${t.getUrl}">🔗</a>
                            ${hasKey ? `<button onclick="FinovateAIInstance.removeAPIKeyFromUI('${key}')" class="btn-delete" title="Delete">🗑️</button>` : ''}
                        </div>
                    </div>
                    <div id="api-key-result-${key}" class="api-key-result"></div>
                </div>
            `;
        });

        html += `
            </div>

            <div class="ai-settings-section">
                <h3>🤖 ${t.agents}</h3>
                <div class="ai-setting-row">
                    <label>${t.enableAgentMode}</label>
                    <input type="checkbox" 
                           id="agent-mode-toggle" 
                           ${this.agentMode ? 'checked' : ''}
                           onchange="FinovateAIInstance.toggleAgentMode(this.checked)">
                </div>
                <div class="agents-grid">
        `;

        // Agents grid
        Object.values(this.agents).forEach(agent => {
            const isActive = this.activeAgents.includes(agent.id);
            html += `
                <div class="agent-card ${isActive ? 'active' : ''}" 
                     onclick="FinovateAIInstance.toggleAgent('${agent.id}')">
                    <div class="agent-icon" style="background-color: ${agent.color}">${agent.icon}</div>
                    <div class="agent-info">
                        <div class="agent-name">${isRTL ? agent.name : agent.nameEn}</div>
                        <div class="agent-desc">${isRTL ? agent.description : agent.descriptionEn}</div>
                    </div>
                    <div class="agent-toggle ${isActive ? 'active' : ''}">✓</div>
                </div>
            `;
        });

        html += `
                </div>
            </div>

            <div class="ai-settings-footer">
                <button onclick="FinovateAIInstance.savePreferences()" class="btn-primary">${t.save}</button>
                <a href="index.html" class="btn-secondary">${isRTL ? 'العودة للرئيسية' : 'Back to Home'}</a>
            </div>
        `;

        container.innerHTML = html;
    }

    /**
     * Handle provider change
     */
    onProviderChange(providerId) {
        this.activeProvider = providerId;
        const modelSelect = document.getElementById('ai-model-select');
        if (modelSelect) {
            const provider = this.providers[providerId];
            modelSelect.innerHTML = '';
            if (provider && provider.models) {
                provider.models.forEach(model => {
                    const option = document.createElement('option');
                    option.value = model.id;
                    option.textContent = `${model.name} (${(model.maxTokens / 1000).toFixed(0)}K)`;
                    if (model.id === this.activeModel) option.selected = true;
                    modelSelect.appendChild(option);
                });
            }
        }
    }

    /**
     * Save API Key from UI
     */
    saveAPIKeyFromUI(providerId) {
        const input = document.getElementById(`api-key-input-${providerId}`);
        const key = input.value.trim();
        
        if (key) {
            this.saveAPIKey(providerId, key);
            this.updateAPIKeyStatus(providerId, true);
            alert(`API Key saved for ${this.providers[providerId].name}`);
        }
    }

    /**
     * Test API Key from UI
     */
    async testAPIKeyFromUI(providerId) {
        const resultDiv = document.getElementById(`api-key-result-${providerId}`);
        const isRTL = document.documentElement.dir === 'rtl';
        
        resultDiv.innerHTML = `<span class="testing">${isRTL ? 'جاري الاختبار...' : 'Testing...'}</span>`;
        
        const result = await this.testAPIKey(providerId);
        
        if (result.success) {
            resultDiv.innerHTML = `<span class="success">✅ ${result.message}</span>`;
        } else {
            resultDiv.innerHTML = `<span class="failed">❌ ${result.message}</span>`;
        }
    }

    /**
     * Remove API Key from UI
     */
    removeAPIKeyFromUI(providerId) {
        if (confirm('Are you sure you want to remove this API key?')) {
            this.removeAPIKey(providerId);
            const input = document.getElementById(`api-key-input-${providerId}`);
            if (input) input.value = '';
            this.updateAPIKeyStatus(providerId, false);
        }
    }

    /**
     * Update API Key status indicator
     */
    updateAPIKeyStatus(providerId, hasKey) {
        const card = document.getElementById(`api-key-card-${providerId}`);
        if (!card) return;

        const statusEl = card.querySelector('.api-key-status');
        const isRTL = document.documentElement.dir === 'rtl';
        
        if (hasKey) {
            statusEl.className = 'api-key-status status-configured';
            statusEl.textContent = isRTL ? 'مكوّن' : 'Configured';
            
            // Add delete button if not exists
            const actionsDiv = card.querySelector('.api-key-actions');
            if (!actionsDiv.querySelector('.btn-delete')) {
                const deleteBtn = document.createElement('button');
                deleteBtn.className = 'btn-delete';
                deleteBtn.innerHTML = '🗑️';
                deleteBtn.onclick = () => this.removeAPIKeyFromUI(providerId);
                actionsDiv.appendChild(deleteBtn);
            }
        } else {
            statusEl.className = 'api-key-status status-not-configured';
            statusEl.textContent = isRTL ? 'غير مكوّن' : 'Not Configured';
            
            // Remove delete button
            const deleteBtn = card.querySelector('.btn-delete');
            if (deleteBtn) deleteBtn.remove();
        }
    }

    /**
     * Toggle Agent Mode
     */
    toggleAgentMode(enabled) {
        this.agentMode = enabled;
        this.savePreferences();
    }

    /**
     * Toggle individual agent
     */
    toggleAgent(agentId) {
        const index = this.activeAgents.indexOf(agentId);
        if (index > -1) {
            this.activeAgents.splice(index, 1);
        } else {
            this.activeAgents.push(agentId);
        }
        
        // Update UI
        const agentCard = document.querySelector(`.agent-card[onclick*="${agentId}"]`);
        if (agentCard) {
            agentCard.classList.toggle('active');
            const toggle = agentCard.querySelector('.agent-toggle');
            if (toggle) toggle.classList.toggle('active');
        }
        
        this.savePreferences();
    }

    init() {
        console.log('Finovate AI Assistant initialized');
        this.loadContext();
        this.loadPreferences();
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
    
    /**
     * فتح واجهة المحادثة
     */
    openChat() {
        this.renderChatInterface();
    }
}

// إنشاء مثيل عام من FinovateAI عند تحميل الصفحة
window.FinovateAIInstance = new FinovateAI();

// دالة عامة لإرسال الاستعلامات
async function sendAIQuery() {
    if (!FinovateAIInstance) return;
    
    const input = document.getElementById('ai-input');
    const message = input.value.trim();
    if (!message) return;

    FinovateAIInstance.addAIMessage('user', message);
    input.value = '';

    try {
        const response = await FinovateAIInstance.chat(message);
        FinovateAIInstance.addAIMessage('assistant', response);
    } catch (error) {
        FinovateAIInstance.addAIMessage('assistant', '❌ خطأ: ' + error.message);
    }
}

// تصدير الفئة
if (typeof module !== 'undefined' && module.exports) {
    module.exports = FinovateAI;
}
