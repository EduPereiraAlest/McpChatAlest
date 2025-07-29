# Changelog

Todas as mudanças notáveis deste projeto serão documentadas neste arquivo.

O formato é baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/),
e este projeto adere ao [Semantic Versioning](https://semver.org/lang/pt-BR/).

## [1.0.0] - 2024-07-29

### Adicionado
- **Extensão Chrome MCP Chat** com interface de chat completa
- **Integração com LLMs** (OpenAI, Anthropic, Local/Ollama, Custom APIs)
- **Protocolo MCP** para comunicação com servidores AI via WebSocket
- **Interface de configurações** para APIs e conexões MCP
- **Context menus** do Chrome para analisar/explicar texto selecionado
- **Content script** para interação contextual com páginas web
- **Background service worker** para conexões persistentes
- **Sistema de notificações** e alertas
- **Ícones SVG personalizados** com conversor para PNG
- **Servidor MCP de exemplo** em Node.js com ferramentas básicas
- **Documentação completa** (README.md, QUICK_START.md)
- **Configuração Git** com usuário EduPereiraAlest

### Corrigido
- **Service worker registration** (Status code: 15)
- **TypeError: Cannot read properties of undefined (reading 'onClicked')**
- **Context menus API** com verificações de disponibilidade
- **Message passing** entre componentes da extensão

### Técnico
- Manifest V3 compatível
- Permissões: storage, activeTab, scripting, contextMenus, notifications, alarms
- Host permissions para localhost e HTTPS
- Arquitetura modular e escalável
- Error handling robusto
- Production-ready desde o início

---

## [Não Lançado]

### Planejado
- Suporte a mais providers de LLM
- Interface de chat aprimorada
- Funcionalidades MCP expandidas
- Testes automatizados
- Pipeline CI/CD