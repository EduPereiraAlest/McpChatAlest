/**
 * Exemplo de Servidor MCP para Chrome MCP Chat Extension
 * 
 * Este é um servidor de exemplo que implementa algumas ferramentas básicas
 * para demonstrar a integração MCP com a extensão Chrome.
 * 
 * Para executar:
 * 1. npm install ws
 * 2. node mcp-server-example.js
 * 3. Configure a extensão para conectar em ws://localhost:8080
 */

const WebSocket = require('ws');
const fs = require('fs');
const path = require('path');

console.log('🚀 Iniciando Servidor MCP...');

// Configuração do servidor
const PORT = 8080;
const wss = new WebSocket.Server({ 
    port: PORT,
    perMessageDeflate: false 
});

console.log(`📡 Servidor MCP rodando na porta ${PORT}`);
console.log(`🔗 URL de conexão: ws://localhost:${PORT}`);

// Estado do servidor
const serverState = {
    connections: new Map(),
    tools: new Map(),
    sessions: new Map()
};

// ===== FERRAMENTAS MCP =====

// Ferramenta 1: Calculadora
serverState.tools.set('calculator', {
    name: 'calculator',
    description: 'Executa cálculos matemáticos básicos',
    parameters: {
        type: 'object',
        properties: {
            expression: {
                type: 'string',
                description: 'Expressão matemática para calcular (ex: 2 + 2 * 3)'
            }
        },
        required: ['expression']
    },
    handler: (params) => {
        try {
            // Sanitizar expressão (apenas números e operadores básicos)
            const sanitized = params.expression.replace(/[^0-9+\-*/.() ]/g, '');
            const result = eval(sanitized);
            
            return {
                success: true,
                result: `${params.expression} = ${result}`,
                value: result
            };
        } catch (error) {
            return {
                success: false,
                error: `Erro no cálculo: ${error.message}`
            };
        }
    }
});

// Ferramenta 2: Sistema de arquivos
serverState.tools.set('file_info', {
    name: 'file_info',
    description: 'Obtém informações sobre arquivos no servidor',
    parameters: {
        type: 'object',
        properties: {
            filename: {
                type: 'string',
                description: 'Nome do arquivo para verificar'
            }
        },
        required: ['filename']
    },
    handler: (params) => {
        try {
            const filePath = path.join(__dirname, params.filename);
            
            // Verificar se arquivo existe
            if (!fs.existsSync(filePath)) {
                return {
                    success: false,
                    error: `Arquivo '${params.filename}' não encontrado`
                };
            }
            
            const stats = fs.statSync(filePath);
            
            return {
                success: true,
                result: `Informações do arquivo '${params.filename}'`,
                data: {
                    name: params.filename,
                    size: stats.size,
                    created: stats.birthtime,
                    modified: stats.mtime,
                    isDirectory: stats.isDirectory(),
                    isFile: stats.isFile()
                }
            };
        } catch (error) {
            return {
                success: false,
                error: `Erro ao acessar arquivo: ${error.message}`
            };
        }
    }
});

// Ferramenta 3: Lista de arquivos
serverState.tools.set('list_files', {
    name: 'list_files',
    description: 'Lista arquivos no diretório atual',
    parameters: {
        type: 'object',
        properties: {
            directory: {
                type: 'string',
                description: 'Diretório para listar (padrão: atual)',
                default: '.'
            }
        },
        required: []
    },
    handler: (params) => {
        try {
            const directory = params.directory || '.';
            const dirPath = path.join(__dirname, directory);
            
            if (!fs.existsSync(dirPath)) {
                return {
                    success: false,
                    error: `Diretório '${directory}' não encontrado`
                };
            }
            
            const files = fs.readdirSync(dirPath);
            
            return {
                success: true,
                result: `Arquivos no diretório '${directory}'`,
                data: {
                    directory: directory,
                    files: files,
                    count: files.length
                }
            };
        } catch (error) {
            return {
                success: false,
                error: `Erro ao listar arquivos: ${error.message}`
            };
        }
    }
});

// Ferramenta 4: Gerador de UUID
serverState.tools.set('generate_uuid', {
    name: 'generate_uuid',
    description: 'Gera um UUID único',
    parameters: {
        type: 'object',
        properties: {
            version: {
                type: 'string',
                description: 'Versão do UUID (v4 padrão)',
                default: 'v4'
            }
        },
        required: []
    },
    handler: (params) => {
        // Gerador UUID v4 simples
        const uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            const r = Math.random() * 16 | 0;
            const v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
        
        return {
            success: true,
            result: `UUID gerado: ${uuid}`,
            uuid: uuid
        };
    }
});

// Ferramenta 5: Status do servidor
serverState.tools.set('server_status', {
    name: 'server_status',
    description: 'Obtém status e estatísticas do servidor MCP',
    parameters: {
        type: 'object',
        properties: {},
        required: []
    },
    handler: (params) => {
        const uptime = process.uptime();
        const memory = process.memoryUsage();
        
        return {
            success: true,
            result: 'Status do servidor MCP',
            data: {
                uptime: `${Math.floor(uptime)} segundos`,
                connections: serverState.connections.size,
                tools: Array.from(serverState.tools.keys()),
                memory: {
                    used: Math.round(memory.heapUsed / 1024 / 1024) + ' MB',
                    total: Math.round(memory.heapTotal / 1024 / 1024) + ' MB'
                },
                platform: process.platform,
                nodeVersion: process.version
            }
        };
    }
});

// ===== HANDLERS DE CONEXÃO =====

wss.on('connection', (ws, request) => {
    const connectionId = generateConnectionId();
    const clientIP = request.connection.remoteAddress;
    
    console.log(`🔗 Nova conexão: ${connectionId} (${clientIP})`);
    
    // Armazenar conexão
    serverState.connections.set(connectionId, {
        ws,
        id: connectionId,
        connected: new Date(),
        lastPing: new Date(),
        authenticated: false,
        clientIP
    });
    
    // Enviar mensagem de boas-vindas
    sendMessage(ws, {
        type: 'welcome',
        connectionId,
        message: 'Conectado ao servidor MCP',
        server: {
            name: 'MCP Chat Server Example',
            version: '1.0.0',
            tools: Array.from(serverState.tools.keys())
        }
    });
    
    // Handler de mensagens
    ws.on('message', (data) => {
        try {
            const message = JSON.parse(data.toString());
            console.log(`📨 Mensagem recebida de ${connectionId}:`, message.type);
            
            handleMessage(ws, connectionId, message);
        } catch (error) {
            console.error(`❌ Erro ao processar mensagem de ${connectionId}:`, error);
            sendError(ws, 'PARSE_ERROR', 'Erro ao processar mensagem JSON');
        }
    });
    
    // Handler de desconexão
    ws.on('close', () => {
        console.log(`🔌 Conexão fechada: ${connectionId}`);
        serverState.connections.delete(connectionId);
    });
    
    // Handler de erro
    ws.on('error', (error) => {
        console.error(`❌ Erro na conexão ${connectionId}:`, error);
    });
    
    // Configurar ping automático
    const pingInterval = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
            ws.ping();
            serverState.connections.get(connectionId).lastPing = new Date();
        } else {
            clearInterval(pingInterval);
        }
    }, 30000);
});

// ===== HANDLERS DE MENSAGEM =====

function handleMessage(ws, connectionId, message) {
    const { type, messageId } = message;
    
    switch (type) {
        case 'auth':
            handleAuth(ws, connectionId, message);
            break;
            
        case 'list_tools':
            handleListTools(ws, connectionId, message);
            break;
            
        case 'execute_tool':
            handleExecuteTool(ws, connectionId, message);
            break;
            
        case 'enhance_message':
            handleEnhanceMessage(ws, connectionId, message);
            break;
            
        case 'ping':
            sendMessage(ws, {
                type: 'pong',
                messageId,
                timestamp: new Date().toISOString()
            });
            break;
            
        default:
            sendError(ws, 'UNKNOWN_MESSAGE_TYPE', `Tipo de mensagem desconhecido: ${type}`, messageId);
    }
}

function handleAuth(ws, connectionId, message) {
    const { apiKey, messageId } = message;
    const connection = serverState.connections.get(connectionId);
    
    // Autenticação simples (em produção, use algo mais seguro)
    if (!apiKey || apiKey === 'demo-key-123') {
        connection.authenticated = true;
        
        sendMessage(ws, {
            type: 'auth_success',
            messageId,
            message: 'Autenticação bem-sucedida',
            permissions: ['read', 'execute']
        });
        
        console.log(`🔐 Cliente ${connectionId} autenticado`);
    } else {
        sendMessage(ws, {
            type: 'auth_failed',
            messageId,
            error: 'API key inválida'
        });
        
        console.log(`🔐 Falha na autenticação para ${connectionId}`);
    }
}

function handleListTools(ws, connectionId, message) {
    const tools = Array.from(serverState.tools.entries()).map(([name, tool]) => ({
        name: tool.name,
        description: tool.description,
        parameters: tool.parameters
    }));
    
    sendMessage(ws, {
        type: 'tools_list',
        messageId: message.messageId,
        tools,
        count: tools.length
    });
}

function handleExecuteTool(ws, connectionId, message) {
    const { toolName, parameters, messageId } = message;
    
    console.log(`🛠️ Executando ferramenta '${toolName}' para ${connectionId}`);
    
    if (!serverState.tools.has(toolName)) {
        sendError(ws, 'TOOL_NOT_FOUND', `Ferramenta '${toolName}' não encontrada`, messageId);
        return;
    }
    
    try {
        const tool = serverState.tools.get(toolName);
        const result = tool.handler(parameters || {});
        
        sendMessage(ws, {
            type: 'tool_response',
            messageId,
            toolName,
            parameters,
            result
        });
        
        console.log(`✅ Ferramenta '${toolName}' executada com sucesso`);
    } catch (error) {
        console.error(`❌ Erro ao executar ferramenta '${toolName}':`, error);
        sendError(ws, 'TOOL_EXECUTION_ERROR', error.message, messageId);
    }
}

function handleEnhanceMessage(ws, connectionId, message) {
    const { message: userMessage, messageId } = message;
    
    // Exemplo de enhancement: adicionar contexto ou sugerir ferramentas
    let enhancedMessage = userMessage;
    const suggestions = [];
    
    // Detectar se mensagem parece ser um cálculo
    if (/[\d+\-*\/\(\).\s]+/.test(userMessage) && /[+\-*\/]/.test(userMessage)) {
        suggestions.push({
            tool: 'calculator',
            reason: 'Detectada expressão matemática'
        });
    }
    
    // Detectar se mensagem menciona arquivos
    if (/arquivo|file|pasta|directory/i.test(userMessage)) {
        suggestions.push({
            tool: 'list_files',
            reason: 'Mensagem relacionada a arquivos'
        });
    }
    
    // Adicionar contexto se houver sugestões
    if (suggestions.length > 0) {
        enhancedMessage += '\n\n[Contexto MCP: Ferramentas disponíveis: ' + 
                          suggestions.map(s => s.tool).join(', ') + ']';
    }
    
    sendMessage(ws, {
        type: 'message_enhanced',
        messageId,
        originalMessage: userMessage,
        enhancedMessage,
        suggestions
    });
}

// ===== UTILIDADES =====

function sendMessage(ws, message) {
    if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(message));
    }
}

function sendError(ws, code, message, messageId = null) {
    sendMessage(ws, {
        type: 'error',
        messageId,
        error: {
            code,
            message
        }
    });
}

function generateConnectionId() {
    return 'conn_' + Math.random().toString(36).substr(2, 9);
}

// ===== HEALTH CHECK E CLEANUP =====

// Limpeza periódica de conexões mortas
setInterval(() => {
    const now = new Date();
    
    for (const [connectionId, connection] of serverState.connections) {
        const timeSinceLastPing = now - connection.lastPing;
        
        if (timeSinceLastPing > 60000) { // 1 minuto sem ping
            console.log(`🧹 Limpando conexão inativa: ${connectionId}`);
            connection.ws.terminate();
            serverState.connections.delete(connectionId);
        }
    }
}, 30000);

// Log periódico de status
setInterval(() => {
    console.log(`📊 Status: ${serverState.connections.size} conexões ativas`);
}, 60000);

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n🛑 Parando servidor MCP...');
    
    // Fechar todas as conexões
    for (const [connectionId, connection] of serverState.connections) {
        sendMessage(connection.ws, {
            type: 'server_shutdown',
            message: 'Servidor sendo desligado'
        });
        connection.ws.close();
    }
    
    wss.close(() => {
        console.log('✅ Servidor MCP parado');
        process.exit(0);
    });
});

console.log('✅ Servidor MCP inicializado com sucesso!');
console.log('\n📋 Ferramentas disponíveis:');
for (const [name, tool] of serverState.tools) {
    console.log(`  • ${name}: ${tool.description}`);
}
console.log('\n🔧 Para testar na extensão Chrome:');
console.log('  1. Configure a URL: ws://localhost:8080');
console.log('  2. API Key (opcional): demo-key-123');
console.log('  3. Digite mensagens como: "calcule 2 + 2" ou "liste arquivos"');
console.log('\n🎯 Pronto para conexões!');

module.exports = { wss, serverState };