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
    console.log('🔄 Chrome iniciado - restaurando conexões MCP');
    restoreMCPConnections();
});

// ===== SETTINGS MANAGEMENT =====
async function setDefaultSettings() {
    const defaultSettings = {
        mcp: {
            url: 'ws://localhost:8080/mcp',
            apiKey: '',
            connected: false,
            autoReconnect: true
        },
        llm: {
            provider: 'openai',
            apiKey: '',
            model: 'gpt-4',
            baseUrl: '',
            maxTokens: 4000,
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
    const settings = await loadSettings();
    
    if (settings.mcp?.url && settings.mcp?.autoReconnect) {
        try {
            await createMCPConnection(settings.mcp.url, settings.mcp.apiKey);
            console.log('🔗 Conexão MCP restaurada');
        } catch (error) {
            console.error('❌ Erro ao restaurar conexão MCP:', error);
        }
    }
}

async function createMCPConnection(url, apiKey = '') {
    return new Promise((resolve, reject) => {
        const ws = new WebSocket(url);
        const connectionId = Date.now().toString();
        
        ws.onopen = () => {
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
            console.error('❌ Erro na conexão MCP:', error);
            reject(error);
        };
        
        ws.onclose = () => {
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
        
        // Reconnect MCP if settings changed
        if (changes.mcpChatSettings.newValue?.mcp?.url !== changes.mcpChatSettings.oldValue?.mcp?.url) {
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