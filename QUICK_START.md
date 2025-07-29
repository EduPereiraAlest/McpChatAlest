# 🚀 Quick Start - Chrome MCP Chat

## ⚡ Instalação Rápida

### 1. **Carregar a Extensão**
1. Abra `chrome://extensions/`
2. Ative **"Modo do desenvolvedor"**
3. Clique **"Carregar extensão sem compactação"**
4. Selecione a pasta `chrome-mcp-chat`

### 2. **Primeira Configuração**

Ao abrir a extensão pela primeira vez, você verá uma **mensagem de boas-vindas** explicando os passos.

#### **🧠 Configurar LLM (OBRIGATÓRIO)**
1. Clique no botão ⚙️ **"Abrir Configurações"**
2. Na seção **"Modelo LLM"**, escolha seu provedor:

**OpenAI:**
- Provider: `OpenAI`
- API Key: `sk-sua-api-key-aqui`
- Modelo: `gpt-4` ou `gpt-3.5-turbo`

**Anthropic:**
- Provider: `Anthropic (Claude)`
- API Key: `sk-ant-sua-api-key-aqui`
- Modelo: `claude-3-sonnet-20240229`

**Local/Ollama:**
- Provider: `Local/Ollama`
- Base URL: `http://localhost:11434/v1`
- Modelo: `llama2`, `codellama`, etc.

#### **🔗 Configurar MCP (OPCIONAL)**

⚠️ **IMPORTANTE**: O servidor MCP é **opcional**. A extensão funciona perfeitamente apenas com LLM.

Se você quiser testar o MCP, siga estes passos:

1. **Instalar Node.js** (se não tiver)
2. **Executar o servidor de exemplo**:
   ```bash
   cd chrome-mcp-chat
   npm install
   npm run dev
   ```
3. **Configurar na extensão**:
   - URL do Servidor: `ws://localhost:8080/mcp`
   - API Key: deixe vazio (opcional)

### 3. **Salvar e Testar**
1. Clique **"Salvar Configurações"**
2. A mensagem de boas-vindas desaparece
3. Digite uma mensagem no chat
4. Sucesso! 🎉

---

## 🎯 Usando a Extensão

### **💬 Chat Principal**
- Clique no ícone da extensão
- Digite sua pergunta
- Pressione Enter ou clique "Enviar"

### **🖱️ Context Menu**
1. Selecione qualquer texto em uma página
2. Clique com botão direito
3. Escolha:
   - **"Analisar com MCP Chat"**
   - **"Explicar com MCP Chat"**

### **🔧 Ferramentas MCP (se configurado)**
- `calculator` - Calculadora
- `file_info` - Informações de arquivo
- `list_files` - Listar arquivos
- `generate_uuid` - Gerar UUID
- `server_status` - Status do servidor

---

## 🚨 Resolução de Problemas

### **❌ "LLM: Não configurado"**
- Verifique se adicionou uma API key válida
- Teste a conexão com "Testar LLM"

### **⚠️ "Servidor MCP offline"**
- **É normal!** MCP é opcional
- Se quiser usar: execute `npm run dev`
- Se não: ignore, a extensão funciona sem MCP

### **🔄 Recarregar Extensão**
1. Vá em `chrome://extensions/`
2. Clique no botão 🔄 da extensão
3. Reabra o popup

---

## 📋 Checklist Rápido

- [ ] ✅ Extensão carregada no Chrome
- [ ] 🧠 LLM configurado (OpenAI/Anthropic/Local)
- [ ] 💾 Configurações salvas
- [ ] 💬 Teste de chat funcionando
- [ ] 🖱️ Context menu funcionando
- [ ] 🔗 MCP configurado (opcional)

**Pronto! Sua extensão está funcionando! 🚀**

---

## 🆘 Ajuda

- **GitHub Issues**: https://github.com/EduPereiraAlest/McpChatAlest/issues
- **Email**: eduardo.pereira@alest.com.br
