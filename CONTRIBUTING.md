# Guia de Contribuição

Obrigado por seu interesse em contribuir com o **Chrome MCP Chat**! 🎉

## 📋 Índice

- [Como Contribuir](#como-contribuir)
- [Configuração do Ambiente](#configuração-do-ambiente)
- [Padrões de Código](#padrões-de-código)
- [Process de Pull Request](#processo-de-pull-request)
- [Reportando Bugs](#reportando-bugs)
- [Sugerindo Funcionalidades](#sugerindo-funcionalidades)

## 🤝 Como Contribuir

### 1. Fork do Repositório
```bash
# Clone seu fork
git clone https://github.com/SEU_USUARIO/McpChatAlest.git
cd McpChatAlest

# Adicione o repositório original como upstream
git remote add upstream https://github.com/EduPereiraAlest/McpChatAlest.git
```

### 2. Crie uma Branch
```bash
# Crie uma branch para sua funcionalidade/correção
git checkout -b feature/nome-da-funcionalidade
# ou
git checkout -b bugfix/nome-do-bug
```

## ⚙️ Configuração do Ambiente

### Pré-requisitos
- **Node.js** v18+ (para servidor MCP de exemplo)
- **Chrome** v88+ (Manifest V3)
- **Git** configurado

### Instalação
```bash
# Instalar dependências do servidor MCP
npm install

# Carregar extensão no Chrome
# 1. Abrir chrome://extensions/
# 2. Ativar "Modo do desenvolvedor"
# 3. Clicar "Carregar extensão sem compactação"
# 4. Selecionar a pasta do projeto
```

### Desenvolvimento
```bash
# Executar servidor MCP de exemplo
npm run dev

# Para testes, abrir em nova aba:
# chrome://extensions/
```

## 📝 Padrões de Código

### JavaScript/CSS
- **Indentação**: 2 espaços
- **Aspas**: Simples para strings
- **Semicolons**: Sempre usar
- **ES6+**: Usar sintaxe moderna

### Commits
Seguir [Conventional Commits](https://www.conventionalcommits.org/):

```
tipo(escopo): descrição

feat: adicionar suporte a novo LLM provider
fix: corrigir erro de conexão WebSocket
docs: atualizar README com exemplos
style: ajustar formatação do código
refactor: reestruturar sistema de configurações
test: adicionar testes para MCP client
chore: atualizar dependências
```

### Estrutura de Arquivos
```
chrome-mcp-chat/
├── 📄 manifest.json          # Configuração da extensão
├── 🎨 popup.html            # Interface principal
├── 📁 js/
│   └── popup.js             # Lógica da interface
├── 📁 styles/
│   └── popup.css            # Estilos da extensão
├── 🔧 background.js         # Service worker
├── 📄 content.js            # Script de conteúdo
├── 📁 icons/                # Ícones da extensão
├── 🟢 mcp-server-example.js # Servidor MCP exemplo
└── 📚 docs/                 # Documentação
```

## 🔄 Processo de Pull Request

### 1. Antes de Enviar
- [ ] Código testado manualmente
- [ ] Funciona em diferentes versões do Chrome
- [ ] Seguir padrões de código estabelecidos
- [ ] Documentação atualizada se necessário
- [ ] Commits com mensagens claras

### 2. Template de PR
```markdown
## 📄 Descrição
Breve descrição das mudanças realizadas.

## 🎯 Tipo de Mudança
- [ ] 🐛 Bug fix
- [ ] ✨ Nova funcionalidade
- [ ] 💥 Breaking change
- [ ] 📚 Documentação
- [ ] 🎨 Melhorias de UI/UX
- [ ] ⚡ Performance
- [ ] 🔧 Refatoração

## 🧪 Como Testar
1. Instalar a extensão
2. Configurar MCP server
3. Testar funcionalidade X
4. Verificar resultado Y

## 📱 Screenshots (se aplicável)
[Adicionar screenshots das mudanças visuais]

## ✅ Checklist
- [ ] Código testado
- [ ] Documentação atualizada
- [ ] Commits seguem padrão
- [ ] PR bem descrito
```

### 3. Review
- Pelo menos 1 review aprovado
- Checks automáticos passando
- Conflicts resolvidos

## 🐛 Reportando Bugs

### Template de Issue
```markdown
## 🐛 Bug Report

### 📄 Descrição
Descrição clara e concisa do bug.

### 🔄 Passos para Reproduzir
1. Vá para '...'
2. Clique em '...'
3. Veja o erro

### ✅ Comportamento Esperado
O que deveria acontecer.

### 🚫 Comportamento Atual
O que está acontecendo.

### 🖥️ Ambiente
- **OS**: [e.g. macOS 14.5]
- **Chrome**: [e.g. v126.0]
- **Versão da Extensão**: [e.g. 1.0.0]

### 📎 Screenshots/Logs
Se aplicável, adicione screenshots ou logs.
```

## 💡 Sugerindo Funcionalidades

### Template de Feature Request
```markdown
## 💡 Feature Request

### 📄 Descrição
Descrição clara da funcionalidade sugerida.

### 🎯 Problema que Resolve
Que problema esta funcionalidade resolveria?

### 🔧 Solução Proposta
Como você imagina que isso funcionaria?

### 🔀 Alternativas Consideradas
Outras abordagens que você considerou?

### 📋 Contexto Adicional
Qualquer informação adicional sobre a funcionalidade.
```

## 🏷️ Labels

- `bug` - Correção de bugs
- `enhancement` - Novas funcionalidades
- `documentation` - Melhorias na documentação
- `good first issue` - Bom para iniciantes
- `help wanted` - Precisa de ajuda da comunidade
- `question` - Dúvidas sobre o projeto

## 📞 Contato

- **GitHub Issues**: Para bugs e sugestões
- **Discussions**: Para perguntas gerais
- **Email**: eduardo.pereira@alest.com.br

---

**Obrigado por contribuir! 🚀**