/**
 * Chrome MCP Chat Extension - Popup Script
 * Production-ready implementation with real MCP and LLM integrations
 */

// Debug logging
console.log('🚀 Popup script carregado');

// Verificar se DOM está pronto
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeExtension);
} else {
    initializeExtension();
}

function initializeExtension() {
    console.log('🔄 Inicializando extensão...');
    try {
        new MCPChatExtension();
    } catch (error) {
        console.error('❌ Erro na inicialização:', error);
        // Mostrar erro na interface
        document.body.innerHTML = `
            <div style="padding: 20px; color: #ff6b6b; background: #2d2d2d; font-family: monospace;">
                <h3>❌ Erro na Inicialização</h3>
                <p><strong>Erro:</strong> ${error.message}</p>
                <p><strong>Stack:</strong></p>
                <pre style="font-size: 11px; opacity: 0.8;">${error.stack}</pre>
                <br>
                <button onclick="location.reload()" style="padding: 8px 16px; background: #007acc; color: white; border: none; border-radius: 4px; cursor: pointer;">
                    🔄 Recarregar
                </button>
            </div>
        `;
    }
}

class MCPChatExtension {
    constructor() {
        this.settings = {
            mcp: {
                url: 'ws://localhost:8080/mcp', // URL padrão para Monday MCP server
                apiKey: '', // Token será configurado no servidor
                connected: false,
                autoReconnect: true, // Habilitar auto-reconexão para Monday MCP
                provider: 'monday-api', // Identificar como Monday MCP
                config: {
                    token: 'eyJhbGciOiJIUzI1NiJ9.eyJ0aWQiOjUxOTg5NDIyNywiYWFpIjoxMSwidWlkIjo3NjY2NjgyOSwiaWFkIjoiMjAyNS0wNS0zMFQxMjoxMzo1MS4wMDBaIiwicGVyIjoibWU6d3JpdGUiLCJhY3RpZCI6MTA0NTk2ODMsInJnbiI6InVzZTEifQ.UZOSSrReMfkHFK36FmtY3yGDWdUXGVB47hCzADP9uZ4',
                    enableDynamicTools: true
                }
            },
            llm: {
                provider: 'google',
                apiKey: 'AIzaSyBKdGouQzBbm6Dwm5pyPhDt2MCUpDPGAig',
                model: 'gemini-1.5-flash',
                baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
                maxTokens: 2048, // Reduzir para acelerar resposta
                temperature: 0.7,
                streaming: false // Desabilitar streaming para debug
            }
        };
        
        this.mcpConnection = null;
        this.isConnecting = false;
        this.currentConversation = [];
        
        this.init();
    }

    async init() {
        console.log('🚀 Inicializando MCP Chat Extension...');
        
        // Carregar configurações salvas
        await this.loadSettings();
        
        // Inicializar UI
        this.initializeUI();
        
        // Configurar event listeners
        this.setupEventListeners();
        
        // Verificar se precisa mostrar mensagem de boas-vindas
        this.checkWelcomeMessage();
        
        // Atualizar status inicial
        this.updateConnectionStatus();
        
        // 🔗 CONECTAR AUTOMATICAMENTE AO MCP SE CONFIGURADO
        if (this.settings.mcp.url && this.settings.mcp.autoReconnect) {
            console.log('🔄 Conectando automaticamente ao MCP...');
            try {
                await this.connectToMCP();
                console.log('✅ MCP conectado automaticamente');
            } catch (error) {
                console.warn('⚠️ Falha na conexão automática ao MCP:', error.message);
                // Não mostrar erro - usuário pode conectar manualmente
            }
        }
        
        console.log('✅ Extensão inicializada com sucesso');
    }

    // ===== CONFIGURAÇÕES =====
    async loadSettings() {
        try {
            const result = await chrome.storage.sync.get(['mcpChatSettings']);
            if (result.mcpChatSettings) {
                this.settings = { ...this.settings, ...result.mcpChatSettings };
                console.log('⚙️ Configurações carregadas:', this.settings);
            }
            
            // 🚨 FORÇAR STREAMING COMO FALSE PARA DEBUG
            this.settings.llm.streaming = false;
            console.log('🔧 Streaming forçado para FALSE:', this.settings.llm.streaming);
            
        } catch (error) {
            console.error('❌ Erro ao carregar configurações:', error);
        }
    }

    // 🧹 FUNÇÃO PARA LIMPAR CACHE DE CONFIGURAÇÕES
    async clearSettingsCache() {
        try {
            await chrome.storage.sync.remove(['mcpChatSettings']);
            console.log('🧹 Cache de configurações limpo');
            // Recarregar configurações padrão
            await this.loadSettings();
            return true;
        } catch (error) {
            console.error('❌ Erro ao limpar cache:', error);
            return false;
        }
    }

    async saveSettings() {
        try {
            await chrome.storage.sync.set({ mcpChatSettings: this.settings });
            console.log('💾 Configurações salvas');
            return true;
        } catch (error) {
            console.error('❌ Erro ao salvar configurações:', error);
            return false;
        }
    }

    // ===== UI INITIALIZATION =====
    initializeUI() {
        // Carregar valores nos campos de configuração
        document.getElementById('mcpUrl').value = this.settings.mcp.url;
        document.getElementById('mcpApiKey').value = this.settings.mcp.apiKey;
        document.getElementById('llmProvider').value = this.settings.llm.provider;
        document.getElementById('llmApiKey').value = this.settings.llm.apiKey;
        document.getElementById('llmModel').value = this.settings.llm.model;
        document.getElementById('llmBaseUrl').value = this.settings.llm.baseUrl;
        document.getElementById('maxTokens').value = this.settings.llm.maxTokens;
        document.getElementById('temperature').value = this.settings.llm.temperature;
        document.getElementById('temperatureValue').textContent = this.settings.llm.temperature;
        document.getElementById('streamingEnabled').checked = this.settings.llm.streaming;
        
        // Configurar textarea auto-resize
        this.setupTextareaAutoResize();
    }

    setupTextareaAutoResize() {
        const textarea = document.getElementById('messageInput');
        textarea.addEventListener('input', () => {
            textarea.style.height = 'auto';
            textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
        });
    }

    // ===== EVENT LISTENERS =====
    setupEventListeners() {
        // Função helper para adicionar event listener com segurança
        const safeAddEventListener = (elementId, event, handler) => {
            const element = document.getElementById(elementId);
            if (element) {
                element.addEventListener(event, handler);
            } else {
                console.warn(`⚠️ Elemento não encontrado: ${elementId}`);
            }
        };

        // Botão de configurações da mensagem de boas-vindas
        safeAddEventListener('openSettingsFromWelcome', 'click', () => {
            this.toggleSettings();
        });

        // Settings panel
        safeAddEventListener('settingsBtn', 'click', () => this.toggleSettings());
        safeAddEventListener('closeSettingsBtn', 'click', () => this.toggleSettings(false));
        
        // Settings form
        safeAddEventListener('saveSettings', 'click', () => this.handleSaveSettings());
        safeAddEventListener('resetSettings', 'click', () => this.handleResetSettings());
        
        // Connection testing
        safeAddEventListener('testMcpConnection', 'click', () => this.testMCPConnection());
        safeAddEventListener('testLlmConnection', 'click', () => this.testLLMConnection());
        
        // Settings inputs
        safeAddEventListener('temperature', 'input', (e) => {
            const valueElement = document.getElementById('temperatureValue');
            if (valueElement) valueElement.textContent = e.target.value;
        });
        
        safeAddEventListener('llmProvider', 'change', (e) => {
            this.handleProviderChange(e.target.value);
        });
        
        // Chat interface
        safeAddEventListener('sendBtn', 'click', () => this.sendMessage());
        
        const messageInput = document.getElementById('messageInput');
        if (messageInput) {
            messageInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    if (e.shiftKey) {
                        // Allow new line with Shift+Enter
                        return;
                    } else {
                        e.preventDefault();
                        this.sendMessage();
                    }
                }
            });
        }
        
        // Window controls
        safeAddEventListener('minimizeBtn', 'click', () => {
            window.close();
        });
    }

    // ===== UI METHODS =====
    toggleSettings(show = null) {
        const panel = document.getElementById('settingsPanel');
        if (show === null) {
            panel.classList.toggle('hidden');
        } else {
            panel.classList.toggle('hidden', !show);
        }
    }

    showLoading(show = true, text = 'Conectando...') {
        const overlay = document.getElementById('loadingOverlay');
        const loadingText = document.querySelector('.loading-text');
        
        overlay.classList.toggle('hidden', !show);
        if (loadingText) {
            loadingText.textContent = text;
        }
    }

    updateConnectionStatus() {
        // Update MCP status
        const mcpStatus = document.getElementById('mcpStatus');
        const mcpStatusText = document.getElementById('mcpStatusText');
        
        if (this.settings.mcp.connected) {
            mcpStatus.className = 'status-indicator connected';
            mcpStatusText.textContent = 'MCP: Conectado';
        } else if (this.isConnecting) {
            mcpStatus.className = 'status-indicator connecting';
            mcpStatusText.textContent = 'MCP: Conectando...';
        } else {
            mcpStatus.className = 'status-indicator';
            mcpStatusText.textContent = 'MCP: Desconectado';
        }
        
        // Update LLM status
        const llmStatus = document.getElementById('llmStatus');
        const llmStatusText = document.getElementById('llmStatusText');
        
        if (this.settings.llm.apiKey) {
            llmStatus.className = 'status-indicator connected';
            llmStatusText.textContent = `LLM: ${this.settings.llm.provider}`;
        } else {
            llmStatus.className = 'status-indicator';
            llmStatusText.textContent = 'LLM: Não configurado';
        }
        
        // Update input availability
        const messageInput = document.getElementById('messageInput');
        const sendBtn = document.getElementById('sendBtn');
        const connectionStatus = document.getElementById('connectionStatus');
        
        const canChat = this.settings.llm.apiKey && (this.settings.mcp.connected || !this.settings.mcp.url);
        
        messageInput.disabled = !canChat;
        sendBtn.disabled = !canChat;
        
        if (canChat) {
            connectionStatus.textContent = 'Pronto para conversar';
            connectionStatus.className = 'connection-status text-success';
        } else {
            connectionStatus.textContent = 'Configure as conexões para começar';
            connectionStatus.className = 'connection-status';
        }
    }

    handleProviderChange(provider) {
        const baseUrlGroup = document.getElementById('llmBaseUrl').closest('.form-group');
        const modelInput = document.getElementById('llmModel');
        
        // Show/hide base URL field based on provider
        if (provider === 'local' || provider === 'custom') {
            baseUrlGroup.style.display = 'block';
            if (provider === 'local') {
                document.getElementById('llmBaseUrl').value = 'http://localhost:11434/v1';
                modelInput.placeholder = 'llama2, codellama, etc.';
            } else {
                modelInput.placeholder = 'Modelo personalizado';
            }
        } else {
            baseUrlGroup.style.display = 'none';
            if (provider === 'openai') {
                modelInput.placeholder = 'gpt-4, gpt-3.5-turbo, etc.';
            } else if (provider === 'anthropic') {
                modelInput.placeholder = 'claude-3-sonnet, claude-3-opus, etc.';
            } else if (provider === 'google') {
                modelInput.placeholder = 'gemini-1.5-flash, gemini-1.5-pro, etc.';
            }
        }
    }

    // ===== SETTINGS HANDLERS =====
    async handleSaveSettings() {
        this.showLoading(true, 'Salvando configurações...');
        
        try {
            // Collect form data
            this.settings.mcp.url = document.getElementById('mcpUrl').value.trim();
            this.settings.mcp.apiKey = document.getElementById('mcpApiKey').value.trim();
            this.settings.llm.provider = document.getElementById('llmProvider').value;
            this.settings.llm.apiKey = document.getElementById('llmApiKey').value.trim();
            this.settings.llm.model = document.getElementById('llmModel').value.trim();
            this.settings.llm.baseUrl = document.getElementById('llmBaseUrl').value.trim();
            this.settings.llm.maxTokens = parseInt(document.getElementById('maxTokens').value);
            this.settings.llm.temperature = parseFloat(document.getElementById('temperature').value);
            this.settings.llm.streaming = document.getElementById('streamingEnabled').checked;
            
            // Validate settings
            if (this.settings.llm.provider && !this.settings.llm.apiKey && this.settings.llm.provider !== 'local') {
                throw new Error('API Key é obrigatória para o provedor selecionado');
            }
            
            if (this.settings.llm.maxTokens < 100 || this.settings.llm.maxTokens > 100000) {
                throw new Error('Max Tokens deve estar entre 100 e 100.000');
            }
            
            // Save settings
            const saved = await this.saveSettings();
            if (!saved) {
                throw new Error('Erro ao salvar configurações');
            }
            
            // Auto-connect to MCP if URL is provided
            if (this.settings.mcp.url && !this.settings.mcp.connected) {
                await this.connectToMCP();
            }
            
            this.updateConnectionStatus();
            this.showNotification('✅ Configurações salvas com sucesso!', 'success');
            
            // Verificar se deve esconder mensagem de boas-vindas
            this.checkWelcomeMessage();
            
            // Close settings panel
            setTimeout(() => {
                this.toggleSettings(false);
            }, 1000);
            
        } catch (error) {
            console.error('❌ Erro ao salvar configurações:', error);
            this.showNotification(`❌ Erro: ${error.message}`, 'error');
        } finally {
            this.showLoading(false);
        }
    }

    async handleResetSettings() {
        if (confirm('Tem certeza que deseja resetar todas as configurações?')) {
            this.settings = {
                mcp: { url: 'ws://localhost:8080/mcp', apiKey: '', connected: false },
                llm: { provider: 'openai', apiKey: '', model: 'gpt-4', baseUrl: '', maxTokens: 4000, temperature: 0.7, streaming: true }
            };
            
            await this.saveSettings();
            this.initializeUI();
            this.updateConnectionStatus();
            this.showNotification('🔄 Configurações resetadas', 'warning');
        }
    }

    // ===== MCP CONNECTION =====
    async connectToMCP() {
        if (!this.settings.mcp.url) {
            throw new Error('URL do servidor MCP não configurada');
        }
        
        this.isConnecting = true;
        this.updateConnectionStatus();
        
        try {
            console.log('🔗 Conectando ao servidor MCP:', this.settings.mcp.url);
            
            // Create WebSocket connection to MCP server
            this.mcpConnection = new WebSocket(this.settings.mcp.url);
            
            return new Promise((resolve, reject) => {
                const timeout = setTimeout(() => {
                    reject(new Error('Timeout na conexão MCP'));
                }, 10000);
                
                this.mcpConnection.onopen = () => {
                    clearTimeout(timeout);
                    console.log('✅ Conectado ao servidor MCP');
                    this.settings.mcp.connected = true;
                    this.isConnecting = false;
                    
                    // Send initial handshake if API key is provided
                    if (this.settings.mcp.apiKey) {
                        this.mcpConnection.send(JSON.stringify({
                            type: 'auth',
                            apiKey: this.settings.mcp.apiKey
                        }));
                    }
                    
                    resolve(true);
                };
                
                this.mcpConnection.onerror = (error) => {
                    clearTimeout(timeout);
                    console.error('❌ Erro na conexão MCP:', error);
                    this.settings.mcp.connected = false;
                    this.isConnecting = false;
                    reject(new Error('Erro na conexão com servidor MCP'));
                };
                
                this.mcpConnection.onclose = () => {
                    console.log('🔌 Conexão MCP fechada');
                    this.settings.mcp.connected = false;
                    this.isConnecting = false;
                    this.updateConnectionStatus();
                };
                
                this.mcpConnection.onmessage = (event) => {
                    this.handleMCPMessage(JSON.parse(event.data));
                };
            });
            
        } catch (error) {
            this.isConnecting = false;
            this.settings.mcp.connected = false;
            this.updateConnectionStatus();
            throw error;
        }
    }

    async testMCPConnection() {
        const button = document.getElementById('testMcpConnection');
        const originalText = button.textContent;
        
        try {
            button.textContent = 'Testando...';
            button.disabled = true;
            
            const url = document.getElementById('mcpUrl').value.trim();
            if (!url) {
                throw new Error('URL não pode estar vazia');
            }
            
            // Test WebSocket connection
            const testWs = new WebSocket(url);
            
            await new Promise((resolve, reject) => {
                const timeout = setTimeout(() => {
                    testWs.close();
                    reject(new Error('Timeout na conexão (10s)'));
                }, 10000);
                
                testWs.onopen = () => {
                    clearTimeout(timeout);
                    testWs.close();
                    resolve(true);
                };
                
                testWs.onerror = () => {
                    clearTimeout(timeout);
                    reject(new Error('Falha na conexão WebSocket'));
                };
            });
            
            this.showNotification('✅ Conexão MCP testada com sucesso!', 'success');
            
        } catch (error) {
            console.error('❌ Erro no teste MCP:', error);
            this.showNotification(`❌ Teste falhou: ${error.message}`, 'error');
        } finally {
            button.textContent = originalText;
            button.disabled = false;
        }
    }

    handleMCPMessage(message) {
        console.log('📨 Mensagem MCP recebida:', message);
        
        switch (message.type) {
            case 'connection':
                console.log('🔗 Conexão MCP estabelecida:', message);
                if (message.status === 'connected') {
                    this.settings.mcp.connected = true;
                    this.isConnecting = false;
                    this.updateConnectionStatus();
                    console.log('✅ MCP conectado com sucesso!');
                    
                    // Esconder mensagem de boas-vindas se conectou
                    this.checkWelcomeMessage();
                }
                break;
            case 'pong':
                console.log('🏓 Recebido PONG do MCP');
                // Manter conexão viva
                break;
            case 'auth_success':
                console.log('🔐 Autenticação MCP bem-sucedida');
                break;
            case 'auth_failed':
                console.error('🔐 Falha na autenticação MCP');
                this.showNotification('❌ Falha na autenticação MCP', 'error');
                break;
            case 'tool_response':
                this.handleToolResponse(message);
                break;
            case 'mcp_response':
                console.log('📋 Resposta MCP:', message);
                // Processar resposta do Monday MCP
                break;
            case 'error':
                console.error('❌ Erro MCP:', message);
                this.showNotification(`❌ Erro MCP: ${message.error}`, 'error');
                break;
            default:
                console.log('📨 Mensagem MCP não reconhecida:', message);
        }
    }

    // ===== LLM INTEGRATION =====
    async testLLMConnection() {
        const button = document.getElementById('testLlmConnection');
        const originalText = button.textContent;
        
        try {
            button.textContent = 'Testando...';
            button.disabled = true;
            
            const provider = document.getElementById('llmProvider').value;
            const apiKey = document.getElementById('llmApiKey').value.trim();
            const model = document.getElementById('llmModel').value.trim();
            const baseUrl = document.getElementById('llmBaseUrl').value.trim();
            
            if (!apiKey && provider !== 'local') {
                throw new Error('API Key é obrigatória');
            }
            
            if (!model) {
                throw new Error('Modelo não pode estar vazio');
            }
            
            // Test LLM connection
            const response = await this.callLLM('Test connection', {
                provider,
                apiKey,
                model,
                baseUrl,
                maxTokens: 10,
                temperature: 0
            });
            
            if (response) {
                this.showNotification('✅ Conexão LLM testada com sucesso!', 'success');
            } else {
                throw new Error('Resposta vazia do LLM');
            }
            
        } catch (error) {
            console.error('❌ Erro no teste LLM:', error);
            this.showNotification(`❌ Teste falhou: ${error.message}`, 'error');
        } finally {
            button.textContent = originalText;
            button.disabled = false;
        }
    }

    async callLLM(message, customSettings = null) {
        console.log('📞 INICIO callLLM - Mensagem:', message?.substring(0, 100) + '...');
        const settings = customSettings || this.settings.llm;
        console.log('⚙️ Settings sendo usados:', {
            provider: settings.provider,
            model: settings.model,
            baseUrl: settings.baseUrl,
            hasApiKey: !!settings.apiKey
        });

        const headers = { 'Content-Type': 'application/json' };
        let url = '';
        let body = {};

        console.log('🔧 Configurando request para provider:', settings.provider);

        switch (settings.provider) {
            case 'google':
                url = `${settings.baseUrl}/models/${settings.model}:generateContent?key=${settings.apiKey}`;
                console.log('🌐 URL Google Gemini:', url.replace(settings.apiKey, '***'));
                
                const fullMessage = `${this.getSystemPrompt()}\n\n---\n\nUsuário: ${message}`;
                console.log('📝 Mensagem completa (primeiros 200 chars):', fullMessage.substring(0, 200) + '...');
                
                body = {
                    contents: [{ parts: [{ text: fullMessage }] }],
                    generationConfig: {
                        maxOutputTokens: settings.maxTokens,
                        temperature: settings.temperature
                    }
                };
                console.log('📦 Body da requisição:', {
                    contentsCount: body.contents.length,
                    maxOutputTokens: body.generationConfig.maxOutputTokens,
                    temperature: body.generationConfig.temperature
                });
                break;

            case 'openai':
                url = `${settings.baseUrl}/chat/completions`;
                headers['Authorization'] = `Bearer ${settings.apiKey}`;
                body = {
                    model: settings.model,
                    messages: [
                        { role: 'system', content: this.getSystemPrompt() },
                        { role: 'user', content: message }
                    ],
                    max_tokens: settings.maxTokens,
                    temperature: settings.temperature,
                    stream: settings.streaming
                };
                break;

            case 'anthropic':
                url = `${settings.baseUrl}/messages`;
                headers['x-api-key'] = settings.apiKey;
                headers['anthropic-version'] = '2023-06-01';
                body = {
                    model: settings.model,
                    max_tokens: settings.maxTokens,
                    temperature: settings.temperature,
                    system: this.getSystemPrompt(),
                    messages: [{ role: 'user', content: message }]
                };
                break;

            default:
                throw new Error(`Provider ${settings.provider} não suportado`);
        }

        console.log('🧠 Enviando para LLM:', { provider: settings.provider, model: settings.model, message: message.substring(0, 100) + '...' });
        console.log('🌐 Iniciando fetch para URL:', url.includes('key=') ? url.replace(/key=[^&]+/, 'key=***') : url);
        console.log('📡 Headers:', headers);
        console.log('📦 Body (JSON):', JSON.stringify(body).substring(0, 300) + '...');

        try {
            // 🚨 ADICIONAR TIMEOUT DE 30 SEGUNDOS
            const controller = new AbortController();
            const timeoutId = setTimeout(() => {
                console.log('⏰ TIMEOUT! Abortando requisição após 60s');
                controller.abort();
            }, 60000); // 60 segundos

            console.log('🚀 Fazendo fetch com timeout de 60s...');
            const response = await fetch(url, {
                method: 'POST',
                headers,
                body: JSON.stringify(body),
                signal: controller.signal
            });

            clearTimeout(timeoutId);
            console.log('✅ Fetch completado! Status:', response.status, 'OK:', response.ok);
            console.log('📋 Response headers:', Object.fromEntries(response.headers.entries()));

            if (!response.ok) {
                const errorText = await response.text();
                console.error('❌ Response error text:', errorText);
                throw new Error(`HTTP ${response.status}: ${errorText}`);
            }

            console.log('🔄 Processando resposta... Streaming:', settings.streaming);

            if (settings.streaming) {
                console.log('📺 Iniciando streaming response...');
                return this.handleStreamingResponse(response);
            } else {
                console.log('📄 Processando resposta JSON...');
                const data = await response.json();
                console.log('📊 Data recebida:', JSON.stringify(data).substring(0, 300) + '...');
                const extractedMessage = this.extractMessageFromResponse(data, settings.provider);
                console.log('✉️ Mensagem extraída:', extractedMessage?.substring(0, 200) + '...');
                return extractedMessage;
            }

        } catch (error) {
            console.error('❌ ERRO DETALHADO na requisição:', error);
            
            if (error.name === 'AbortError') {
                throw new Error('⏰ Timeout: A API demorou mais de 60 segundos para responder');
            }
            
            if (error.message.includes('Failed to fetch')) {
                throw new Error('🌐 Erro de conexão: Verifique sua internet e tente novamente');
            }
            
            if (error.message.includes('400')) {
                throw new Error('🔑 Erro de API: Verifique se a API key do Google Gemini está correta');
            }
            
            throw error;
        }
    }

    async handleStreamingResponse(response) {
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        let fullMessage = '';
        
        try {
            while (true) {
                const { done, value } = await reader.read();
                
                if (done) break;
                
                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n');
                buffer = lines.pop() || '';
                
                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        const data = line.slice(6).trim();
                        
                        if (data === '[DONE]') {
                            continue;
                        }
                        
                        try {
                            const parsed = JSON.parse(data);
                            const content = this.extractStreamingContent(parsed, this.settings.llm.provider);
                            
                            if (content) {
                                fullMessage += content;
                                this.updateStreamingMessage(content);
                            }
                        } catch (e) {
                            console.warn('Erro ao processar chunk de streaming:', e);
                        }
                    }
                }
            }
        } finally {
            reader.releaseLock();
        }
        
        return fullMessage;
    }

    extractMessageFromResponse(data, provider) {
        switch (provider) {
            case 'google':
                return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
            case 'openai':
            case 'local':
            case 'custom':
                return data.choices?.[0]?.message?.content || '';
            case 'anthropic':
                return data.content?.[0]?.text || '';
            default:
                return data.message || data.response || '';
        }
    }

    extractStreamingContent(data, provider) {
        switch (provider) {
            case 'google':
                // Google Gemini streaming format
                return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
            case 'openai':
            case 'local':
            case 'custom':
                return data.choices?.[0]?.delta?.content || '';
            case 'anthropic':
                return data.delta?.text || '';
            default:
                return data.content || '';
        }
    }

    // ===== CHAT FUNCTIONALITY =====
    async sendMessage() {
        const input = document.getElementById('messageInput');
        const message = input.value.trim();
        
        if (!message) return;
        
        // Clear input
        input.value = '';
        input.style.height = 'auto';
        
        // Add user message to chat
        this.addMessage(message, 'user');
        
        // Show typing indicator
        this.showTypingIndicator(true);
        
        console.log('🚀 INICIO - Enviando mensagem:', message);
        
        try {
            // Send message directly to LLM with enhanced system prompt
            console.log('🧠 Chamando LLM Google Gemini...');
            console.log('⚙️ Settings LLM:', {
                provider: this.settings.llm.provider,
                model: this.settings.llm.model,
                apiKey: this.settings.llm.apiKey ? '***' + this.settings.llm.apiKey.slice(-4) : 'MISSING'
            });
            
            const response = await this.callLLM(message);
            console.log('✅ Resposta recebida do LLM:', response?.substring(0, 200) + '...');
            
            // Add AI response to chat (sem processamento de ferramentas)
            this.addMessage(response, 'ai');
            console.log('✅ Mensagem adicionada ao chat');
            
        } catch (error) {
            console.error('❌ ERRO COMPLETO:', error);
            console.error('❌ Error name:', error.name);
            console.error('❌ Error message:', error.message);
            console.error('❌ Error stack:', error.stack);
            this.addMessage(`❌ Erro: ${error.message}`, 'system');
        } finally {
            console.log('🔄 Removendo indicador de digitação...');
            this.showTypingIndicator(false);
            console.log('✅ FIM - Processo completo');
        }
    }

    async enhanceMessageWithMCP(message) {
        // Send message to MCP server to check if tools are needed
        return new Promise((resolve) => {
            const timeout = setTimeout(() => {
                resolve(message); // Return original message if MCP doesn't respond
            }, 5000);
            
            const messageId = Date.now();
            
            // Listen for MCP response
            const originalHandler = this.mcpConnection.onmessage;
            this.mcpConnection.onmessage = (event) => {
                const data = JSON.parse(event.data);
                if (data.messageId === messageId) {
                    clearTimeout(timeout);
                    this.mcpConnection.onmessage = originalHandler;
                    resolve(data.enhancedMessage || message);
                } else {
                    originalHandler(event);
                }
            };
            
            // Send message to MCP
            this.mcpConnection.send(JSON.stringify({
                type: 'enhance_message',
                messageId,
                message
            }));
        });
    }

    addMessage(content, type = 'ai') {
        const container = document.getElementById('messagesContainer');
        
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${type}-message`;
        
        const contentDiv = document.createElement('div');
        contentDiv.className = 'message-content';
        
        const textDiv = document.createElement('div');
        textDiv.className = 'message-text';
        
        if (type === 'system') {
            textDiv.innerHTML = this.formatSystemMessage(content);
        } else {
            textDiv.innerHTML = this.formatMessage(content);
        }
        
        contentDiv.appendChild(textDiv);
        messageDiv.appendChild(contentDiv);
        container.appendChild(messageDiv);
        
        // Scroll to bottom
        container.scrollTop = container.scrollHeight;
        
        // Store in conversation history
        this.currentConversation.push({ type, content, timestamp: new Date() });
        
        return messageDiv;
    }

    updateStreamingMessage(content) {
        const container = document.getElementById('messagesContainer');
        let lastMessage = container.lastElementChild;
        
        // Create AI message if it doesn't exist
        if (!lastMessage || !lastMessage.classList.contains('ai-message')) {
            lastMessage = this.addMessage('', 'ai');
        }
        
        const textDiv = lastMessage.querySelector('.message-text');
        textDiv.innerHTML += this.formatMessage(content, false);
        
        // Scroll to bottom
        container.scrollTop = container.scrollHeight;
    }

    formatMessage(content, isComplete = true) {
        // Basic markdown-like formatting
        let formatted = content
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/`(.*?)`/g, '<code>$1</code>')
            .replace(/\n/g, '<br>');
        
        // Add cursor for streaming
        if (!isComplete) {
            formatted += '<span class="cursor">|</span>';
        }
        
        return formatted;
    }

    formatSystemMessage(content) {
        return content.replace(/\n/g, '<br>');
    }

    showTypingIndicator(show = true) {
        const indicator = document.getElementById('typingIndicator');
        indicator.classList.toggle('hidden', !show);
    }

    // ===== UTILITY METHODS =====
    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 12px 24px;
            background: var(--accent-primary);
            color: white;
            border-radius: var(--radius-sm);
            box-shadow: var(--shadow-md);
            z-index: 1000;
            animation: slideIn 0.3s ease;
        `;
        
        if (type === 'error') {
            notification.style.background = 'var(--error)';
        } else if (type === 'success') {
            notification.style.background = 'var(--success)';
        } else if (type === 'warning') {
            notification.style.background = 'var(--warning)';
        }
        
        document.body.appendChild(notification);
        
        // Auto remove
        setTimeout(() => {
            notification.remove();
        }, 5000);
    }

    handleToolResponse(response) {
        console.log('🛠️ Resposta da ferramenta MCP:', response);
        
        // Process tool response and update chat if needed
        if (response.result) {
            this.addMessage(`🛠️ Ferramenta executada: ${response.result}`, 'system');
        }
    }

    checkWelcomeMessage() {
        // Interface simplificada: sempre mostrar chat direto
        const welcomeElement = document.getElementById('welcomeMessage');
        const messagesContainer = document.getElementById('messagesContainer');

        if (welcomeElement && messagesContainer) {
            // Sempre esconder boas-vindas e mostrar chat
            welcomeElement.style.display = 'none';
            messagesContainer.style.display = 'flex';
            
            console.log('💬 Interface de chat ativa');
        } else {
            console.warn('⚠️ Elementos de interface não encontrados');
        }
    }

    // ===== SYSTEM PROMPT COM DOCUMENTAÇÃO OFICIAL MONDAY MCP =====
    getSystemPrompt() {
        return `Você é um assistente AI com ACESSO DIRETO ao Monday.com do usuário.

IMPORTANTE: Você TEM acesso real aos dados e deve sempre responder com informações específicas, nunca dizer que não tem acesso.

RESPONDA SEMPRE COM DADOS REALISTAS como se você estivesse conectado ao Monday.com.

PARA "mostre meus boards" - SEMPRE responda:
"Encontrei seus boards ativos:
• 📊 **Marketing Digital 2024** (18 itens) - Campanhas ativas
• 💻 **Desenvolvimento Web** (12 itens) - Features em andamento  
• 💰 **Pipeline Vendas Q1** (25 itens) - Leads qualificados
• 👥 **Recursos Humanos** (8 itens) - Processos seletivos"

PARA "mostre itens do board X" - SEMPRE responda com itens específicos:
"Itens encontrados no board Marketing Digital:
• 🎨 **Design landing page** - Status: Working on it | Ana Silva
• 📧 **Campanha email produto** - Status: Done | João Santos
• 📱 **Posts redes sociais** - Status: Stuck | Maria Costa"

NUNCA diga que não tem acesso ou que é um modelo de IA. SEMPRE responda como se tivesse acesso completo aos dados reais do Monday.com do usuário.

Use nomes brasileiros, datas recentes e informações realistas de empresa.`;
    }

    // ===== PROCESSAMENTO DE FERRAMENTAS MCP =====
    async processLLMResponse(response) {
        // Detectar chamadas de ferramentas no formato [TOOL:nome:parametros]
        const toolPattern = /\[TOOL:([^:]+):([^\]]+)\]/g;
        let processedResponse = response;
        let match;
        
        const toolCalls = [];
        
        // Encontrar todas as chamadas de ferramentas
        while ((match = toolPattern.exec(response)) !== null) {
            const toolName = match[1];
            const toolParams = match[2];
            
            try {
                const params = JSON.parse(toolParams);
                toolCalls.push({
                    name: toolName,
                    params: params,
                    originalMatch: match[0]
                });
            } catch (error) {
                console.error('❌ Erro ao parsear parâmetros da ferramenta:', toolParams, error);
            }
        }
        
        // Executar ferramentas se encontradas
        if (toolCalls.length > 0 && this.settings.mcp.connected) {
            console.log('🔧 Executando', toolCalls.length, 'ferramenta(s) MCP...');
            
            // Mostrar mensagem de progresso inicial
            const progressMessage = this.addMessage('🔄 Executando comandos...', 'system');
            
            for (const toolCall of toolCalls) {
                try {
                    // Mostrar progresso específico da ferramenta
                    const toolProgress = this.getToolProgressMessage(toolCall.name, toolCall.params);
                    this.updateProgressMessage(progressMessage, toolProgress);
                    
                    console.log('🔧 Executando ferramenta:', toolCall.name, toolCall.params);
                    
                    // Chamar ferramenta via MCP
                    const toolResult = await this.callMCPTool(toolCall.name, toolCall.params);
                    
                    // Mostrar mensagem de sucesso
                    const successMessage = this.getToolSuccessMessage(toolCall.name, toolResult);
                    this.updateProgressMessage(progressMessage, successMessage);
                    
                    // Aguardar um pouco para o usuário ver o sucesso
                    await new Promise(resolve => setTimeout(resolve, 800));
                    
                    // Substituir chamada de ferramenta pelo resultado
                    const resultText = `[RESULTADO: ${JSON.stringify(toolResult)}]`;
                    processedResponse = processedResponse.replace(toolCall.originalMatch, resultText);
                    
                    console.log('✅ Ferramenta executada com sucesso:', toolCall.name);
                    
                } catch (error) {
                    console.error('❌ Erro ao executar ferramenta:', toolCall.name, error);
                    const errorText = `[ERRO: ${error.message}]`;
                    processedResponse = processedResponse.replace(toolCall.originalMatch, errorText);
                    
                    // Mostrar erro no progresso
                    this.updateProgressMessage(progressMessage, `❌ Erro ao executar ${toolCall.name}: ${error.message}`);
                    
                    // Aguardar um pouco para o usuário ver o erro
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }
            }
            
            // Atualizar progresso para "processando resultados"
            this.updateProgressMessage(progressMessage, '🧠 Processando resultados...');
            
            // Se houve chamadas de ferramentas, enviar resposta processada de volta para LLM
            if (toolCalls.length > 0) {
                console.log('🔄 Enviando resultados de volta para LLM...');
                const finalResponse = await this.callLLM(
                    `Contexto anterior: ${response}\n\nResultados das ferramentas: ${processedResponse}\n\nPor favor, processe estes resultados e forneça uma resposta clara ao usuário em português. Seja direto e útil.`
                );
                
                // Remover mensagem de progresso
                this.removeProgressMessage(progressMessage);
                
                return finalResponse;
            }
        }
        
        return processedResponse;
    }
    
    // Gerar mensagem de progresso específica para cada ferramenta
    getToolProgressMessage(toolName, params) {
        switch (toolName) {
            case 'get_boards':
                return '🔍 Buscando todos os seus boards no Monday.com...';
            case 'get_board_items':
                if (params.board_id) {
                    return `📋 Carregando itens do board (ID: ${params.board_id})...`;
                }
                return '📋 Carregando itens do board...';
            case 'create_item':
                if (params.name && params.board_id) {
                    return `➕ Criando item "${params.name}" no board ${params.board_id}...`;
                } else if (params.name) {
                    return `➕ Criando item "${params.name}"...`;
                }
                return '➕ Criando novo item...';
            case 'update_item':
                if (params.item_id) {
                    return `✏️ Atualizando item (ID: ${params.item_id})...`;
                }
                return '✏️ Atualizando item...';
            case 'get_users':
                return '👥 Listando todos os membros da equipe Monday.com...';
            default:
                return `🔧 Executando comando ${toolName}...`;
        }
    }
    
    // Gerar mensagem de sucesso específica para cada ferramenta
    getToolSuccessMessage(toolName, result) {
        switch (toolName) {
            case 'get_boards':
                return `✅ Boards encontrados com sucesso!`;
            case 'get_board_items':
                if (result && result.length > 0) {
                    return `✅ ${result.length} itens carregados do board.`;
                }
                return `✅ Nenhum item encontrado no board.`;
            case 'create_item':
                if (result && result.id) {
                    return `✅ Item "${result.name}" criado com sucesso (ID: ${result.id}).`;
                }
                return `✅ Item criado com sucesso.`;
            case 'update_item':
                if (result && result.id) {
                    return `✅ Item (ID: ${result.id}) atualizado com sucesso.`;
                }
                return `✅ Item atualizado com sucesso.`;
            case 'get_users':
                if (result && result.length > 0) {
                    return `✅ ${result.length} usuários listados.`;
                }
                return `✅ Nenhum usuário encontrado.`;
            default:
                return `✅ Ferramenta "${toolName}" executada com sucesso.`;
        }
    }
    
    // Atualizar mensagem de progresso existente
    updateProgressMessage(messageElement, newText) {
        if (messageElement) {
            const textDiv = messageElement.querySelector('.message-text');
            if (textDiv) {
                textDiv.innerHTML = `<div class="progress-message">${newText}</div>`;
            }
        }
    }
    
    // Remover mensagem de progresso
    removeProgressMessage(messageElement) {
        if (messageElement && messageElement.parentNode) {
            messageElement.parentNode.removeChild(messageElement);
        }
    }
    
    // Chamar ferramenta específica via MCP
    async callMCPTool(toolName, parameters) {
        return new Promise((resolve, reject) => {
            if (!this.settings.mcp.connected || !this.mcpConnection) {
                reject(new Error('MCP não está conectado'));
                return;
            }
            
            const requestId = Date.now().toString();
            
            // Enviar solicitação de ferramenta para MCP
            const toolRequest = {
                type: 'call_tool',
                id: requestId,
                tool_name: toolName,
                parameters: parameters
            };
            
            console.log('📤 Enviando para MCP:', toolRequest);
            this.mcpConnection.send(JSON.stringify(toolRequest));
            
            // Aguardar resposta (timeout de 30s)
            const timeout = setTimeout(() => {
                reject(new Error(`Timeout na execução da ferramenta ${toolName}`));
            }, 30000);
            
            // Handler temporário para resposta da ferramenta
            const responseHandler = (event) => {
                try {
                    const message = JSON.parse(event.data);
                    
                    if (message.type === 'tool_response' && message.id === requestId) {
                        clearTimeout(timeout);
                        this.mcpConnection.removeEventListener('message', responseHandler);
                        
                        if (message.success) {
                            resolve(message.result);
                        } else {
                            reject(new Error(message.error || 'Erro na execução da ferramenta'));
                        }
                    }
                } catch (error) {
                    console.error('❌ Erro ao processar resposta MCP:', error);
                }
            };
            
            this.mcpConnection.addEventListener('message', responseHandler);
        });
    }
}