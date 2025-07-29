/**
 * Chrome MCP Chat Extension - Popup Script
 * Production-ready implementation with real MCP and LLM integrations
 */

class MCPChatExtension {
    constructor() {
        this.settings = {
            mcp: {
                url: 'ws://localhost:8080/mcp',
                apiKey: '',
                connected: false
            },
            llm: {
                provider: 'openai',
                apiKey: '',
                model: 'gpt-4',
                baseUrl: '',
                maxTokens: 4000,
                temperature: 0.7,
                streaming: true
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
        
        // Atualizar status inicial
        this.updateConnectionStatus();
        
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
        } catch (error) {
            console.error('❌ Erro ao carregar configurações:', error);
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
        // Settings panel
        document.getElementById('settingsBtn').addEventListener('click', () => this.toggleSettings());
        document.getElementById('closeSettingsBtn').addEventListener('click', () => this.toggleSettings(false));
        
        // Settings form
        document.getElementById('saveSettings').addEventListener('click', () => this.handleSaveSettings());
        document.getElementById('resetSettings').addEventListener('click', () => this.handleResetSettings());
        
        // Connection testing
        document.getElementById('testMcpConnection').addEventListener('click', () => this.testMCPConnection());
        document.getElementById('testLlmConnection').addEventListener('click', () => this.testLLMConnection());
        
        // Temperature slider
        document.getElementById('temperature').addEventListener('input', (e) => {
            document.getElementById('temperatureValue').textContent = e.target.value;
        });
        
        // LLM provider change
        document.getElementById('llmProvider').addEventListener('change', (e) => {
            this.handleProviderChange(e.target.value);
        });
        
        // Chat functionality
        document.getElementById('sendBtn').addEventListener('click', () => this.sendMessage());
        document.getElementById('messageInput').addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                e.preventDefault();
                this.sendMessage();
            } else if (e.key === 'Enter' && !e.shiftKey) {
                // Allow shift+enter for new lines
                // Regular enter sends message only if not holding shift
                e.preventDefault();
                this.sendMessage();
            }
        });
        
        // Minimize button
        document.getElementById('minimizeBtn').addEventListener('click', () => {
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
        const settings = customSettings || this.settings.llm;
        
        const headers = {
            'Content-Type': 'application/json'
        };
        
        let url = '';
        let body = {};
        
        // Configure request based on provider
        switch (settings.provider) {
            case 'openai':
                url = 'https://api.openai.com/v1/chat/completions';
                headers['Authorization'] = `Bearer ${settings.apiKey}`;
                body = {
                    model: settings.model,
                    messages: [{ role: 'user', content: message }],
                    max_tokens: settings.maxTokens,
                    temperature: settings.temperature,
                    stream: settings.streaming
                };
                break;
                
            case 'anthropic':
                url = 'https://api.anthropic.com/v1/messages';
                headers['x-api-key'] = settings.apiKey;
                headers['anthropic-version'] = '2023-06-01';
                body = {
                    model: settings.model,
                    messages: [{ role: 'user', content: message }],
                    max_tokens: settings.maxTokens,
                    temperature: settings.temperature,
                    stream: settings.streaming
                };
                break;
                
            case 'local':
            case 'custom':
                url = `${settings.baseUrl}/chat/completions`;
                if (settings.apiKey) {
                    headers['Authorization'] = `Bearer ${settings.apiKey}`;
                }
                body = {
                    model: settings.model,
                    messages: [{ role: 'user', content: message }],
                    max_tokens: settings.maxTokens,
                    temperature: settings.temperature,
                    stream: settings.streaming
                };
                break;
                
            default:
                throw new Error(`Provedor não suportado: ${settings.provider}`);
        }
        
        console.log('🧠 Enviando para LLM:', { provider: settings.provider, model: settings.model, message: message.substring(0, 100) + '...' });
        
        const response = await fetch(url, {
            method: 'POST',
            headers,
            body: JSON.stringify(body)
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP ${response.status}: ${errorText}`);
        }
        
        if (settings.streaming) {
            return this.handleStreamingResponse(response);
        } else {
            const data = await response.json();
            return this.extractMessageFromResponse(data, settings.provider);
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
        
        try {
            let contextMessage = message;
            
            // If MCP is connected, check if we need to use tools
            if (this.settings.mcp.connected && this.mcpConnection) {
                contextMessage = await this.enhanceMessageWithMCP(message);
            }
            
            // Send to LLM
            const response = await this.callLLM(contextMessage);
            
            // Add AI response to chat
            this.addMessage(response, 'ai');
            
        } catch (error) {
            console.error('❌ Erro ao enviar mensagem:', error);
            this.addMessage(`❌ Erro: ${error.message}`, 'system');
        } finally {
            this.showTypingIndicator(false);
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
}

// Initialize extension when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.mcpChat = new MCPChatExtension();
});

// Handle unload
window.addEventListener('beforeunload', () => {
    if (window.mcpChat && window.mcpChat.mcpConnection) {
        window.mcpChat.mcpConnection.close();
    }
});