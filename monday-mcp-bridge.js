#!/usr/bin/env node

/**
 * Monday MCP Bridge Server
 * Converte comunicação stdio do Monday API MCP para WebSocket para Chrome Extension
 */

const WebSocket = require('ws');
const { spawn } = require('child_process');
const path = require('path');

class MondayMCPBridge {
    constructor() {
        this.port = 8080;
        this.connections = new Set();
        this.mcpProcess = null;
        this.mcpReady = false;
        
        // Configuração do Monday API MCP
        this.mondayToken = 'eyJhbGciOiJIUzI1NiJ9.eyJ0aWQiOjUxOTg5NDIyNywiYWFpIjoxMSwidWlkIjo3NjY2NjgyOSwiaWFkIjoiMjAyNS0wNS0zMFQxMjoxMzo1MS4wMDBaIiwicGVyIjoibWU6d3JpdGUiLCJhY3RpZCI6MTA0NTk2ODMsInJnbiI6InVzZTEifQ.UZOSSrReMfkHFK36FmtY3yGDWdUXGVB47hCzADP9uZ4';
        
        this.setupMCPProcess();
        this.setupWebSocketServer();
    }

    setupMCPProcess() {
        console.log('🚀 Iniciando Monday MCP Process Bridge...');
        
        // Iniciar processo Monday MCP via stdio
        this.mcpProcess = spawn('npx', [
            '@mondaydotcomorg/monday-api-mcp',
            '-t', this.mondayToken,
            '--enable-dynamic-api-tools', 'true'
        ], {
            stdio: ['pipe', 'pipe', 'pipe']
        });

        // Handler para stdout do MCP (respostas)
        this.mcpProcess.stdout.on('data', (data) => {
            try {
                const response = data.toString().trim();
                console.log('📤 MCP Response:', response.substring(0, 200) + '...');
                
                // Broadcast resposta para todas as conexões WebSocket
                this.broadcast({
                    type: 'mcp_response',
                    data: response,
                    timestamp: Date.now()
                });
            } catch (error) {
                console.error('❌ Erro ao processar resposta MCP:', error);
            }
        });

        // Handler para stderr (logs/erros)
        this.mcpProcess.stderr.on('data', (data) => {
            const message = data.toString().trim();
            console.log('📋 MCP Log:', message);
            
            // Se mencionar que está pronto/inicializado
            if (message.includes('ready') || message.includes('initialized') || message.includes('listening')) {
                this.mcpReady = true;
                console.log('✅ Monday MCP está pronto!');
            }
        });

        // Handler para encerramento do processo
        this.mcpProcess.on('close', (code) => {
            console.log(`🔌 Processo Monday MCP encerrado com código: ${code}`);
            this.mcpReady = false;
            
            // Notificar conexões WebSocket
            this.broadcast({
                type: 'mcp_disconnected',
                code: code,
                timestamp: Date.now()
            });
        });

        this.mcpProcess.on('error', (error) => {
            console.error('❌ Erro no processo Monday MCP:', error);
            this.mcpReady = false;
        });

        // Aguardar um pouco para o processo inicializar
        setTimeout(() => {
            this.mcpReady = true;
            console.log('✅ Monday MCP Bridge pronto!');
        }, 3000);
    }

    setupWebSocketServer() {
        // Criar servidor WebSocket
        this.wss = new WebSocket.Server({ 
            port: this.port,
            path: '/mcp'
        });

        this.wss.on('connection', (ws, req) => {
            console.log('🔗 Nova conexão WebSocket estabelecida');
            this.connections.add(ws);

            ws.on('message', async (data) => {
                try {
                    const message = JSON.parse(data.toString());
                    await this.handleWebSocketMessage(ws, message);
                } catch (error) {
                    console.error('❌ Erro ao processar mensagem WebSocket:', error);
                    this.sendError(ws, 'Erro ao processar mensagem', error.message);
                }
            });

            ws.on('close', () => {
                console.log('🔌 Conexão WebSocket fechada');
                this.connections.delete(ws);
            });

            ws.on('error', (error) => {
                console.error('❌ Erro WebSocket:', error);
                this.connections.delete(ws);
            });

            // Enviar status de conexão
            this.sendMessage(ws, {
                type: 'connection',
                status: 'connected',
                server: 'Monday API MCP Bridge',
                mcp_ready: this.mcpReady,
                timestamp: Date.now()
            });
        });

        console.log(`📡 Servidor WebSocket Bridge rodando na porta ${this.port}`);
        console.log(`🔗 URL de conexão: ws://localhost:${this.port}/mcp`);
    }

    async handleWebSocketMessage(ws, message) {
        console.log('📨 Mensagem WebSocket recebida:', message.type);

        switch (message.type) {
            case 'ping':
                this.sendMessage(ws, { type: 'pong', timestamp: Date.now() });
                break;

            case 'list_tools':
                // Solicitar lista de ferramentas ao MCP via stdio
                this.sendToMCP({
                    jsonrpc: '2.0',
                    id: Date.now(),
                    method: 'tools/list',
                    params: {}
                });
                break;

            case 'call_tool':
                // Executar ferramenta via MCP
                this.sendToMCP({
                    jsonrpc: '2.0',
                    id: Date.now(),
                    method: 'tools/call',
                    params: {
                        name: message.tool_name,
                        arguments: message.parameters || {}
                    }
                });
                break;

            case 'get_status':
                this.sendMessage(ws, {
                    type: 'status',
                    connected: this.mcpReady,
                    mcp_ready: this.mcpReady,
                    connections: this.connections.size,
                    timestamp: Date.now()
                });
                break;

            default:
                this.sendError(ws, 'Tipo de mensagem não suportado', message.type);
        }
    }

    sendToMCP(message) {
        if (this.mcpProcess && this.mcpProcess.stdin && !this.mcpProcess.stdin.destroyed) {
            const jsonMessage = JSON.stringify(message) + '\n';
            console.log('📤 Enviando para MCP:', jsonMessage.substring(0, 200) + '...');
            this.mcpProcess.stdin.write(jsonMessage);
        } else {
            console.error('❌ Processo MCP não disponível para envio');
        }
    }

    sendMessage(ws, message) {
        if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify(message));
        }
    }

    sendError(ws, error, details = null) {
        this.sendMessage(ws, {
            type: 'error',
            error,
            details,
            timestamp: Date.now()
        });
    }

    broadcast(message) {
        this.connections.forEach(ws => {
            this.sendMessage(ws, message);
        });
    }

    shutdown() {
        console.log('🛑 Desligando bridge...');
        
        // Fechar processo MCP
        if (this.mcpProcess) {
            this.mcpProcess.kill('SIGTERM');
        }

        // Fechar conexões WebSocket
        this.connections.forEach(ws => {
            ws.close();
        });

        // Fechar servidor WebSocket
        if (this.wss) {
            this.wss.close();
        }

        console.log('✅ Bridge desligado');
    }
}

// Inicializar bridge
const bridge = new MondayMCPBridge();

// Tratamento de sinais de saída
process.on('SIGINT', () => {
    console.log('\n🛑 Recebido SIGINT, desligando bridge...');
    bridge.shutdown();
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('\n🛑 Recebido SIGTERM, desligando bridge...');
    bridge.shutdown();
    process.exit(0);
});

console.log('✅ Monday MCP Bridge inicializado com sucesso!');
console.log('');
console.log('🌉 Bridge funcionando:');
console.log('   📱 Chrome Extension ←→ WebSocket (porta 8080)');
console.log('   🔌 WebSocket ←→ Monday MCP (stdio)');
console.log('   📋 Monday API com ferramentas dinâmicas');
console.log('');
console.log('🎯 Pronto para conexões da extensão Chrome!');