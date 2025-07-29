# 🚀 Guia de Início Rápido - Chrome MCP Chat

Este guia vai te ajudar a instalar e testar a extensão em **menos de 5 minutos**!

## ⚡ **Instalação Rápida**

### **1. Instalar a Extensão Chrome**

```bash
# 1. Clone o repositório
git clone https://github.com/your-username/chrome-mcp-chat.git
cd chrome-mcp-chat

# 2. Abra o Chrome e vá para: chrome://extensions/

# 3. Ative "Modo do desenvolvedor" (canto superior direito)

# 4. Clique em "Carregar sem compactação" e selecione esta pasta

# 5. Pin a extensão na barra de ferramentas
```

### **2. Configurar um LLM (Escolha uma opção)**

#### **🔥 Opção A: OpenAI (Recomendado)**

1. Obtenha sua API key em: https://platform.openai.com/api-keys
2. Clique na extensão → ⚙️ Configurações
3. Configure:
   - **Provider:** OpenAI
   - **API Key:** sua-api-key-aqui
   - **Model:** gpt-4

#### **🧠 Opção B: Anthropic (Claude)**

1. Obtenha sua API key em: https://console.anthropic.com/
2. Configure:
   - **Provider:** Anthropic
   - **API Key:** sua-api-key-aqui
   - **Model:** claude-3-sonnet-20240229

#### **💻 Opção C: Local (Ollama)**

1. Instale Ollama: https://ollama.ai/
2. Execute: `ollama run llama2`
3. Configure:
   - **Provider:** Local
   - **Base URL:** http://localhost:11434/v1
   - **Model:** llama2

### **3. Teste Básico**

1. Clique na extensão 🤖
2. Digite: "Olá! Como você funciona?"
3. Pressione Enter e veja a resposta!

---

## 🛠️ **Testando com Servidor MCP (Opcional)**

Para testar as funcionalidades MCP completas:

### **1. Instalar Dependências**

```bash
npm install
```

### **2. Executar Servidor MCP**

```bash
npm start
```

Você verá:

```
🚀 Iniciando Servidor MCP...
📡 Servidor MCP rodando na porta 8080
✅ Servidor MCP inicializado com sucesso!

📋 Ferramentas disponíveis:
  • calculator: Executa cálculos matemáticos básicos
  • file_info: Obtém informações sobre arquivos no servidor
  • list_files: Lista arquivos no diretório atual
  • generate_uuid: Gera um UUID único
  • server_status: Obtém status e estatísticas do servidor MCP

🎯 Pronto para conexões!
```

### **3. Configurar MCP na Extensão**

1. Extensão → ⚙️ Configurações
2. **Servidor MCP:**
   - **URL:** `ws://localhost:8080`
   - **API Key:** `demo-key-123` (opcional)
3. Clique "Testar Conexão"
4. Salvar configurações

### **4. Testar Ferramentas MCP**

Agora você pode usar comandos como:

- 💻 "calcule 15 \* 23"
- 📁 "liste os arquivos aqui"
- 🆔 "gere um UUID"
- 📊 "qual o status do servidor?"

---

## 🎯 **Recursos Testáveis**

### **💬 Chat Básico**

- ✅ Conversas com IA
- ✅ Streaming de respostas
- ✅ Histórico de mensagens
- ✅ Markdown básico

### **🌐 Integração com Páginas**

- ✅ Selecione texto → Botão direito → "Analisar com MCP Chat"
- ✅ Atalhos: `Ctrl+Shift+M` (abrir chat)
- ✅ Context menus para texto selecionado

### **🛠️ Ferramentas MCP**

- ✅ Calculadora inteligente
- ✅ Sistema de arquivos
- ✅ Geração de UUIDs
- ✅ Status do servidor
- ✅ Enhancement de mensagens

### **⚙️ Configurações**

- ✅ Multi-provider LLM
- ✅ Configurações avançadas (temperatura, tokens)
- ✅ Persistência de settings
- ✅ Teste de conexões

---

## 🐛 **Problemas Comuns**

### **❌ "API Key inválida"**

```
Solução: Verifique se a API key está correta e tem créditos
```

### **❌ "Conexão MCP falhou"**

```
Solução:
1. Verifique se o servidor está rodando (npm start)
2. Confirme a URL: ws://localhost:8080
3. Teste a conexão nas configurações
```

### **❌ "Extensão não aparece"**

```
Solução:
1. Vá em chrome://extensions/
2. Verifique se está ativada
3. Pin na barra de ferramentas
```

### **❌ "Streaming não funciona"**

```
Solução: Desative e reative "Streaming" nas configurações avançadas
```

---

## 🔧 **Desenvolvimento**

### **Estrutura dos Arquivos**

```
chrome-mcp-chat/
├── manifest.json       # ⚙️ Configuração da extensão
├── popup.html          # 🎨 Interface principal
├── popup.js            # 🧠 Lógica do chat
├── background.js       # 🔧 Service worker
├── content.js          # 🌐 Integração com páginas
├── styles/popup.css    # 💅 Estilos modernos
├── icons/*.svg         # 🎯 Ícones da extensão
├── mcp-server-example.js # 🛠️ Servidor MCP de teste
└── convert-icons.html  # 🎨 Conversor SVG→PNG
```

### **Debugging**

```bash
# Console da extensão
chrome://extensions/ → Detalhes → Inspecionar visões → Service Worker

# Console do popup
Clique na extensão → F12

# Console do content script
F12 na página web → Console
```

---

## 🎉 **Próximos Passos**

1. **🔧 Personalize** as configurações para seu uso
2. **🛠️ Explore** as ferramentas MCP disponíveis
3. **🧪 Experimente** com diferentes LLMs
4. **📚 Leia** a documentação completa no README.md
5. **💡 Contribua** com melhorias no GitHub

---

## 💡 **Dicas Pro**

- 🎯 Use `Ctrl+Shift+M` para acesso rápido
- 📝 Selecione texto em qualquer site para análise contextual
- ⚡ Configure streaming para respostas mais rápidas
- 🔧 Experimente diferentes temperaturas para criatividade
- 💾 Suas configurações são salvas automaticamente

---

**🚀 Pronto! Sua extensão Chrome MCP Chat está funcionando!**

_Em caso de dúvidas, consulte o README.md completo ou abra uma issue no GitHub._
