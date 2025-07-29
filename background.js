/**
 * Chrome MCP Chat Extension - Background Service Worker
 * Handles background tasks, message passing, and extension lifecycle
 */

console.log('🚀 MCP Chat Extension Background Script iniciado');

// Extension state management
let extensionState = {
    mcpConnections: new Map(),
    activeChats: new Map(),
    settings: null
};

// ===== INSTALLATION & LIFECYCLE =====
chrome.runtime.onInstalled.addListener((details) => {
    console.log('📦 Extensão instalada/atualizada:', details.reason);
    
    if (details.reason === 'install') {
        // First install - set default settings
        setDefaultSettings();
        console.log('🎉 Extensão instalada com sucesso!');
    } else if (details.reason === 'update') {
        // Extension updated - check for breaking changes
        handleExtensionUpdate(details.previousVersion);
    }
    
    // Setup context menus on install/update
    setupContextMenus();
});

chrome.runtime.onStartup.addListener(() => {
    console.log('🔄 Chrome iniciado - extensão MCP Chat ativa');
    // Remover conexão automática - só conectar quando usuário configurar
    // restoreMCPConnections(); <- REMOVIDO
    if (chrome.contextMenus) {
        setupContextMenus();
    }
});

// ===== SETTINGS MANAGEMENT =====
async function setDefaultSettings() {
    const defaultSettings = {
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
            provider: 'google', // Usar Google Gemini
            apiKey: 'AIzaSyBKdGouQzBbm6Dwm5pyPhDt2MCUpDPGAig',
            model: 'gemini-1.5-flash',
            baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
            maxTokens: 8192, // Gemini 1.5 Flash suporta mais tokens
            temperature: 0.7,
            streaming: true
        },
        ui: {
            theme: 'dark',
            notifications: true,
            soundEnabled: false
        },
        version: chrome.runtime.getManifest().version
    };
    
    try {
        await chrome.storage.sync.set({ mcpChatSettings: defaultSettings });
        console.log('⚙️ Configurações padrão definidas');
    } catch (error) {
        console.error('❌ Erro ao definir configurações padrão:', error);
    }
}

async function loadSettings() {
    try {
        const result = await chrome.storage.sync.get(['mcpChatSettings']);
        extensionState.settings = result.mcpChatSettings || {};
        return extensionState.settings;
    } catch (error) {
        console.error('❌ Erro ao carregar configurações:', error);
        return {};
    }
}

// ===== MCP CONNECTION MANAGEMENT =====
async function restoreMCPConnections() {
    try {
        const settings = await loadSettings();
        
        // Só tenta conectar se tiver URL configurada E autoReconnect ativo
        if (!settings.mcp?.url) {
            console.log('ℹ️ Nenhum servidor MCP configurado');
            return;
        }
        
        if (!settings.mcp?.autoReconnect) {
            console.log('ℹ️ Auto-reconexão MCP desabilitada');
            return;
        }
        
        console.log('🔗 Tentando reconectar ao MCP:', settings.mcp.url);
        await createMCPConnection(settings.mcp.url, settings.mcp.apiKey);
        console.log('✅ Conexão MCP restaurada com sucesso');
        
    } catch (error) {
        console.log('ℹ️ Não foi possível restaurar conexão MCP:', error.message);
        // Não mostrar como erro - é normal não conseguir conectar
    }
}

async function createMCPConnection(url, apiKey = '') {
    return new Promise((resolve, reject) => {
        if (!url) {
            reject(new Error('URL do servidor MCP não configurada'));
            return;
        }
        
        const ws = new WebSocket(url);
        const connectionId = Date.now().toString();
        
        // Timeout para conexão
        const connectionTimeout = setTimeout(() => {
            ws.close();
            reject(new Error(`Timeout na conexão com ${url}`));
        }, 5000);
        
        ws.onopen = () => {
            clearTimeout(connectionTimeout);
            console.log('🔗 Conexão MCP estabelecida:', url);
            
            extensionState.mcpConnections.set(connectionId, {
                ws,
                url,
                connected: true,
                lastPing: Date.now()
            });
            
            // Send authentication if API key is provided
            if (apiKey) {
                ws.send(JSON.stringify({
                    type: 'auth',
                    apiKey: apiKey
                }));
            }
            
            resolve(connectionId);
        };
        
        ws.onerror = (error) => {
            clearTimeout(connectionTimeout);
            console.log('⚠️ Erro na conexão MCP:', url);
            reject(new Error(`Falha na conexão com ${url}`));
        };
        
        ws.onclose = () => {
            clearTimeout(connectionTimeout);
            console.log('🔌 Conexão MCP fechada:', url);
            extensionState.mcpConnections.delete(connectionId);
            
            // Auto-reconnect if enabled
            const settings = extensionState.settings;
            if (settings?.mcp?.autoReconnect) {
                setTimeout(() => {
                    createMCPConnection(url, apiKey);
                }, 5000);
            }
        };
        
        ws.onmessage = (event) => {
            handleMCPMessage(connectionId, JSON.parse(event.data));
        };
    });
}

function handleMCPMessage(connectionId, message) {
    console.log('📨 Mensagem MCP recebida:', message);
    
    // Forward message to all active popup instances
    chrome.runtime.sendMessage({
        type: 'mcp_message',
        connectionId,
        message
    }).catch(error => {
        // No active popup to receive message - that's ok
        console.log('📬 Nenhum popup ativo para receber mensagem MCP');
    });
}

// ===== MESSAGE PASSING =====
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('📨 Mensagem recebida:', request.type);
    
    switch (request.type) {
        case 'connect_mcp':
            handleConnectMCP(request, sendResponse);
            return true; // Keep message channel open for async response
            
        case 'send_mcp_message':
            handleSendMCPMessage(request, sendResponse);
            return true;
            
        case 'get_mcp_status':
            sendResponse(getMCPStatus());
            break;
            
        case 'ping':
            sendResponse({ status: 'ok', timestamp: Date.now() });
            break;
            
        default:
            console.warn('⚠️ Tipo de mensagem não reconhecido:', request.type);
            sendResponse({ error: 'Unknown message type' });
    }
});

async function handleConnectMCP(request, sendResponse) {
    try {
        const connectionId = await createMCPConnection(request.url, request.apiKey);
        sendResponse({ success: true, connectionId });
    } catch (error) {
        sendResponse({ success: false, error: error.message });
    }
}

function handleSendMCPMessage(request, sendResponse) {
    const connection = extensionState.mcpConnections.get(request.connectionId);
    
    if (!connection || !connection.connected) {
        sendResponse({ success: false, error: 'MCP connection not found or disconnected' });
        return;
    }
    
    try {
        connection.ws.send(JSON.stringify(request.message));
        sendResponse({ success: true });
    } catch (error) {
        sendResponse({ success: false, error: error.message });
    }
}

function getMCPStatus() {
    const connections = Array.from(extensionState.mcpConnections.entries()).map(([id, conn]) => ({
        id,
        url: conn.url,
        connected: conn.connected,
        lastPing: conn.lastPing
    }));
    
    return {
        connections,
        totalConnections: connections.length,
        activeConnections: connections.filter(c => c.connected).length
    };
}

// ===== CONTEXT MENU =====
function setupContextMenus() {
    try {
        // Remove existing context menus first
        chrome.contextMenus.removeAll(() => {
            // Add context menu for selected text
            chrome.contextMenus.create({
                id: 'mcp-chat-analyze',
                title: 'Analisar com MCP Chat',
                contexts: ['selection']
            });
            
            chrome.contextMenus.create({
                id: 'mcp-chat-explain',
                title: 'Explicar com MCP Chat',
                contexts: ['selection']
            });
        });
    } catch (error) {
        console.error('❌ Erro ao criar context menus:', error);
    }
}

// Context menu click handler
if (chrome.contextMenus && chrome.contextMenus.onClicked) {
    chrome.contextMenus.onClicked.addListener((info, tab) => {
        try {
            if (info.menuItemId === 'mcp-chat-analyze' || info.menuItemId === 'mcp-chat-explain') {
                const action = info.menuItemId === 'mcp-chat-analyze' ? 'analisar' : 'explicar';
                const selectedText = info.selectionText;
                
                // Send message to content script to open chat with pre-filled message
                chrome.tabs.sendMessage(tab.id, {
                    type: 'open_chat_with_text',
                    action,
                    text: selectedText
                }).catch(error => {
                    console.log('Content script not available:', error);
                });
            }
        } catch (error) {
            console.error('❌ Erro no context menu click:', error);
        }
    });
}

// ===== NOTIFICATIONS =====
function showNotification(title, message, type = 'basic') {
    const settings = extensionState.settings;
    
    if (!settings?.ui?.notifications) {
        return; // Notifications disabled
    }
    
    chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icons/icon-48.png',
        title: title,
        message: message
    });
}

// ===== HEALTH CHECK =====
setInterval(async () => {
    // Check MCP connections health
    for (const [connectionId, connection] of extensionState.mcpConnections) {
        if (connection.connected && connection.ws.readyState === WebSocket.OPEN) {
            try {
                connection.ws.send(JSON.stringify({ type: 'ping' }));
                connection.lastPing = Date.now();
            } catch (error) {
                console.error('❌ Erro no ping MCP:', error);
                connection.connected = false;
            }
        }
    }
    
    // Clean up disconnected connections
    for (const [connectionId, connection] of extensionState.mcpConnections) {
        if (!connection.connected || connection.ws.readyState !== WebSocket.OPEN) {
            extensionState.mcpConnections.delete(connectionId);
        }
    }
}, 30000); // Check every 30 seconds

// ===== ERROR HANDLING =====
chrome.runtime.onSuspend.addListener(() => {
    console.log('💤 Extension sendo suspensa - fechando conexões MCP');
    
    // Close all MCP connections gracefully
    for (const [connectionId, connection] of extensionState.mcpConnections) {
        if (connection.ws && connection.ws.readyState === WebSocket.OPEN) {
            connection.ws.close(1000, 'Extension suspending');
        }
    }
    
    extensionState.mcpConnections.clear();
});

// ===== EXTENSION UPDATE HANDLING =====
function handleExtensionUpdate(previousVersion) {
    console.log(`🔄 Extensão atualizada de ${previousVersion} para ${chrome.runtime.getManifest().version}`);
    
    // Handle breaking changes between versions
    // This is where you'd put migration logic
    
    showNotification(
        'MCP Chat Atualizado',
        `Extensão atualizada para versão ${chrome.runtime.getManifest().version}`
    );
}

// ===== STORAGE CHANGE LISTENER =====
chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace === 'sync' && changes.mcpChatSettings) {
        extensionState.settings = changes.mcpChatSettings.newValue;
        console.log('⚙️ Configurações atualizadas:', extensionState.settings);
        
        // Reconnect MCP if settings changed and URL is valid
        const oldUrl = changes.mcpChatSettings.oldValue?.mcp?.url;
        const newUrl = changes.mcpChatSettings.newValue?.mcp?.url;
        
        if (newUrl && oldUrl !== newUrl) {
            console.log('🔄 URL MCP alterada, tentando reconectar...');
            restoreMCPConnections();
        }
    }
});

// ===== TABS MANAGEMENT =====
chrome.tabs.onActivated.addListener((activeInfo) => {
    // Could be used to inject content script or show extension state
    console.log('📱 Tab ativada:', activeInfo.tabId);
});

// ===== ALARMS (for periodic tasks) =====
chrome.alarms.create('health-check', { delayInMinutes: 1, periodInMinutes: 5 });

chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === 'health-check') {
        console.log('🏥 Health check executado');
        
        // Could perform periodic maintenance tasks
        // Like cleaning up old chat history, checking for updates, etc.
    }
});

// ===== STARTUP COMPLETE =====
console.log('✅ Background script inicializado com sucesso');

// Initialize context menus on startup if not already done
if (chrome.contextMenus) {
    setupContextMenus();
}