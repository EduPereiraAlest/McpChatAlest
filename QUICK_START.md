# 🚀 Quick Start - Monday Chat Extension

## ⚡ Instalação Rápida

### 1. **Carregar a Extensão**
1. Abra `chrome://extensions/`
2. Ative **"Modo do desenvolvedor"**
3. Clique **"Carregar extensão sem compactação"**
4. Selecione a pasta `chrome-mcp-chat`

### 2. **Configuração Pré-definida**

A extensão já vem **pré-configurada** com:
- ✅ **Google Gemini 1.5 Flash** (LLM)
- ✅ **Monday.com MCP** (ferramentas de produtividade)
- ✅ **Pronto para usar!**

### 3. **Iniciar Servidor Monday MCP**

Para usar as ferramentas do Monday.com:

```bash
cd chrome-mcp-chat
npm install
npm start
```

Você verá:
```
🚀 Iniciando Monday MCP Server...
📡 Servidor WebSocket rodando na porta 8080
🔗 URL de conexão: ws://localhost:8080/mcp
✅ Monday MCP Server inicializado com sucesso!

📋 Ferramentas disponíveis:
   • get_boards: Lista boards do Monday.com
   • get_board_items: Obtém itens de um board
   • create_item: Cria novo item em um board
   • update_item: Atualiza item existente
   • get_users: Lista usuários da conta

🎯 Pronto para conexões!
```

---

## 🎯 Usando a Extensão

### **💬 Chat Direto**
- Clique no ícone **🤖 Monday Chat**
- Digite: *"Liste meus boards do Monday"*
- O Gemini + MCP irão trabalhar juntos!

### **🖱️ Context Menu**
1. Selecione texto em qualquer página
2. Clique com botão direito
3. **"Analisar com Monday Chat"** - Analisa e sugere ações
4. **"Criar tarefa Monday"** - Cria item automaticamente

### **🔧 Comandos Disponíveis**

**📋 Gerenciamento de Boards:**
- *"Liste todos os meus boards"*
- *"Mostre os itens do board Marketing"*
- *"Quantos boards eu tenho?"*

**✅ Criação de Tarefas:**
- *"Crie uma tarefa 'Revisar proposta' no board Vendas"*
- *"Adicione um item 'Call cliente X' com prioridade alta"*

**👥 Gestão de Equipe:**
- *"Quem são os usuários da nossa conta?"*
- *"Atribua a tarefa Y para João Silva"*

**📊 Análise e Relatórios:**
- *"Quantas tarefas estão pendentes no projeto Z?"*
- *"Resumo do status do board Desenvolvimento"*

---

## ⚙️ Personalização (Opcional)

Se quiser ajustar as configurações:

### **🧠 Google Gemini**
- **API Key**: Sua própria chave do Google AI
- **Modelo**: `gemini-1.5-flash` (rápido) ou `gemini-1.5-pro` (avançado)

### **📋 Monday.com**
- **Token**: Seu token de acesso Monday.com
- **URL**: `ws://localhost:8080/mcp` (padrão)

---

## 🚨 Resolução de Problemas

### **❌ "Monday MCP offline"**
**Solução:**
```bash
cd chrome-mcp-chat
npm start
```

### **❌ "Gemini não responde"**
**Causas possíveis:**
- API key inválida ou sem créditos
- Modelo incorreto
- Rate limit atingido

**Solução**: Verificar configurações LLM na extensão

### **❌ "Erro de permissão Monday"**
**Causa**: Token Monday.com inválido ou expirado  
**Solução**: Gerar novo token em Monday.com → Desenvolvedores

---

## 📋 Checklist Rápido

- [ ] ✅ Extensão carregada no Chrome
- [ ] 🚀 Servidor Monday MCP rodando (`npm start`)
- [ ] 💬 Chat funcionando (teste: "olá")
- [ ] 📋 Monday integrado (teste: "liste boards")
- [ ] 🖱️ Context menu funcionando
- [ ] 🎯 Pronto para produtividade!

**🎉 Sua extensão Monday Chat está funcionando! Agora você pode gerenciar Monday.com direto do navegador!**

---

## 🎪 Exemplos Práticos

### **Fluxo Completo: Da Ideia à Tarefa**
1. **Navegue** para um artigo interessante
2. **Selecione** texto relevante
3. **Clique direito** → "Analisar com Monday Chat"
4. **IA analisa** e sugere: *"Isso seria uma boa feature, devo criar uma tarefa?"*
5. **Confirme**: *"Sim, crie no board Desenvolvimento"*
6. **✅ Tarefa criada automaticamente!**

### **Gestão de Projetos Inteligente**
```
Você: "Como está o progresso do projeto Marketing?"

Monday Chat: 
📊 Board "Marketing" - Status:
• ✅ 12 tarefas concluídas
• 🟡 8 tarefas em progresso  
• 🔴 3 tarefas atrasadas
• 👥 5 pessoas envolvidas

🚨 Atenção: Campanha Q1 está atrasada (responsável: Maria)
💡 Sugestão: Reagendar reunião de revisão para esta semana

Devo criar uma tarefa de follow-up?
```

---

## 🆘 Ajuda

- **GitHub Issues**: https://github.com/EduPereiraAlest/McpChatAlest/issues
- **Email**: eduardo.pereira@alest.com.br
- **Monday.com API**: https://developer.monday.com/
- **Google AI**: https://ai.google.dev/
