#!/usr/bin/env node

/**
 * Monday API MCP Server
 * Servidor WebSocket que integra com @mondaydotcomorg/monday-api-mcp
 * 
 * Uso: node monday-mcp-server.js
 */

const WebSocket = require('ws');
const { spawn } = require('child_process'); 
const path = require('path');
const fs = require('fs');

class MondayMCPServer {
    constructor() {
        this.port = 8080;
        this.mondayProcess = null;
        this.connections = new Set();
        this.mcpReady = false;
        
        // Configuração do Monday API MCP
        this.mondayConfig = {
            token: 'eyJhbGciOiJIUzI1NiJ9.eyJ0aWQiOjUxOTg5NDIyNywiYWFpIjoxMSwidWlkIjo3NjY2NjgyOSwiaWFkIjoiMjAyNS0wNS0zMFQxMjoxMzo1MS4wMDBaIiwicGVyIjoibWU6d3JpdGUiLCJhY3RpZCI6MTA0NTk2ODMsInJnbiI6InVzZTEifQ.UZOSSrReMfkHFK36FmtY3yGDWdUXGVB47hCzADP9uZ4',
            enableDynamicTools: true
        };

        this.tools = new Map();
        this.setupServer();
    }

    setupServer() {
        console.log('🚀 Iniciando Monday MCP Server...');
        
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
                    await this.handleMessage(ws, message);
                } catch (error) {
                    console.error('❌ Erro ao processar mensagem:', error);
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

            // Enviar informações de conexão
            this.sendMessage(ws, {
                type: 'connection',
                status: 'connected',
                server: 'Monday API MCP',
                tools: this.getAvailableTools()
            });
        });

        console.log(`📡 Servidor WebSocket rodando na porta ${this.port}`);
        console.log(`🔗 URL de conexão: ws://localhost:${this.port}/mcp`);
        
        // Inicializar ferramentas do Monday
        this.initializeMondayTools();
    }

    async initializeMondayTools() {
        console.log('🔧 Inicializando ferramentas Monday API...');
        
        // Ferramentas disponíveis no Monday API MCP
        this.tools.set('get_boards', {
            name: 'get_boards',
            description: 'Lista todos os boards disponíveis no Monday.com',
            parameters: {
                type: 'object',
                properties: {
                    limit: { type: 'number', description: 'Limite de boards a retornar' }
                }
            }
        });

        this.tools.set('get_board_items', {
            name: 'get_board_items',
            description: 'Obtém itens de um board específico',
            parameters: {
                type: 'object',
                properties: {
                    board_id: { type: 'string', description: 'ID do board', required: true },
                    limit: { type: 'number', description: 'Limite de itens a retornar' }
                },
                required: ['board_id']
            }
        });

        this.tools.set('create_item', {
            name: 'create_item',
            description: 'Cria um novo item em um board',
            parameters: {
                type: 'object',
                properties: {
                    board_id: { type: 'string', description: 'ID do board', required: true },
                    item_name: { type: 'string', description: 'Nome do item', required: true },
                    column_values: { type: 'object', description: 'Valores das colunas' }
                },
                required: ['board_id', 'item_name']
            }
        });

        this.tools.set('update_item', {
            name: 'update_item', 
            description: 'Atualiza um item existente',
            parameters: {
                type: 'object',
                properties: {
                    item_id: { type: 'string', description: 'ID do item', required: true },
                    column_values: { type: 'object', description: 'Novos valores das colunas', required: true }
                },
                required: ['item_id', 'column_values']
            }
        });

        this.tools.set('get_users', {
            name: 'get_users',
            description: 'Lista usuários da conta Monday.com',
            parameters: {
                type: 'object',
                properties: {
                    limit: { type: 'number', description: 'Limite de usuários a retornar' }
                }
            }
        });

        console.log(`✅ ${this.tools.size} ferramentas Monday API inicializadas`);
        this.mcpReady = true;
    }

    async handleMessage(ws, message) {
        console.log('📨 Mensagem recebida:', message.type);

        switch (message.type) {
            case 'ping':
                this.sendMessage(ws, { type: 'pong' });
                break;

            case 'list_tools':
                this.sendMessage(ws, {
                    type: 'tools_list',
                    tools: this.getAvailableTools()
                });
                break;

            case 'call_tool':
                await this.handleToolCall(ws, message);
                break;

            case 'get_status':
                this.sendMessage(ws, {
                    type: 'status',
                    connected: true,
                    mcp_ready: this.mcpReady,
                    tools_count: this.tools.size,
                    connections: this.connections.size
                });
                break;

            default:
                this.sendError(ws, 'Tipo de mensagem não suportado', message.type);
        }
    }

    async handleToolCall(ws, message) {
        const { tool_name, parameters = {} } = message;
        
        if (!this.tools.has(tool_name)) {
            this.sendError(ws, 'Ferramenta não encontrada', tool_name);
            return;
        }

        try {
            console.log(`🔧 Executando ferramenta: ${tool_name}`);
            
            // Simular chamada para Monday API (aqui você integraria com a API real)
            const result = await this.callMondayAPI(tool_name, parameters);
            
            this.sendMessage(ws, {
                type: 'tool_result',
                tool_name,
                result,
                success: true
            });

        } catch (error) {
            console.error(`❌ Erro ao executar ${tool_name}:`, error);
            this.sendError(ws, `Erro ao executar ${tool_name}`, error.message);
        }
    }

    async callMondayAPI(toolName, parameters) {
        // Aqui seria a integração real com o Monday API
        // Por enquanto, retornamos dados simulados baseados na ferramenta
        
        switch (toolName) {
            case 'get_boards':
                return {
                    boards: [
                        { id: '123456', name: 'Projeto Principal', description: 'Board principal do projeto' },
                        { id: '789012', name: 'Marketing', description: 'Campanhas e tarefas de marketing' },
                        { id: '345678', name: 'Desenvolvimento', description: 'Tarefas de desenvolvimento' }
                    ],
                    total: 3
                };

            case 'get_board_items':
                return {
                    items: [
                        { id: '001', name: 'Tarefa 1', status: 'Em Progresso', assignee: 'João' },
                        { id: '002', name: 'Tarefa 2', status: 'Concluído', assignee: 'Maria' },
                        { id: '003', name: 'Tarefa 3', status: 'Pendente', assignee: 'Pedro' }
                    ],
                    board_id: parameters.board_id,
                    total: 3
                };

            case 'create_item':
                return {
                    item: {
                        id: 'new_' + Date.now(),
                        name: parameters.item_name,
                        board_id: parameters.board_id,
                        created_at: new Date().toISOString()
                    },
                    success: true
                };

            case 'update_item':
                return {
                    item: {
                        id: parameters.item_id,
                        updated_at: new Date().toISOString(),
                        column_values: parameters.column_values
                    },
                    success: true
                };

            case 'get_users':
                return {
                    users: [
                        { id: 'user1', name: 'João Silva', email: 'joao@empresa.com' },
                        { id: 'user2', name: 'Maria Santos', email: 'maria@empresa.com' },
                        { id: 'user3', name: 'Pedro Costa', email: 'pedro@empresa.com' }
                    ],
                    total: 3
                };

            default:
                throw new Error(`Ferramenta ${toolName} não implementada`);
        }
    }

    getAvailableTools() {
        return Array.from(this.tools.values());
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
            timestamp: new Date().toISOString()
        });
    }

    broadcast(message) {
        this.connections.forEach(ws => {
            this.sendMessage(ws, message);
        });
    }

    shutdown() {
        console.log('🛑 Desligando servidor...');
        
        if (this.mondayProcess) {
            this.mondayProcess.kill();
        }

        this.connections.forEach(ws => {
            ws.close();
        });

        this.wss.close();
        console.log('✅ Servidor desligado');
    }
}

// Inicializar servidor
const server = new MondayMCPServer();

// Tratamento de sinais de saída
process.on('SIGINT', () => {
    console.log('\n🛑 Recebido SIGINT, desligando servidor...');
    server.shutdown();
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('\n🛑 Recebido SIGTERM, desligando servidor...');
    server.shutdown();
    process.exit(0);
});

console.log('✅ Monday MCP Server inicializado com sucesso!');
console.log('');
console.log('📋 Ferramentas disponíveis:');
console.log('   • get_boards: Lista boards do Monday.com');
console.log('   • get_board_items: Obtém itens de um board');
console.log('   • create_item: Cria novo item em um board');
console.log('   • update_item: Atualiza item existente');
console.log('   • get_users: Lista usuários da conta');
console.log('');
console.log('🎯 Pronto para conexões!');