# Política de Segurança

## 🔒 Versões Suportadas

Mantemos suporte de segurança para as seguintes versões:

| Versão | Suporte          |
| ------ | ---------------- |
| 1.0.x  | ✅ Suportada     |
| < 1.0  | ❌ Não suportada |

## 🚨 Reportando Vulnerabilidades

Se você descobrir uma vulnerabilidade de segurança, por favor **NÃO** crie uma issue pública. Em vez disso:

### 📧 Contato Privado
Envie um email para: **eduardo.pereira@alest.com.br**

**Inclua as seguintes informações:**
- Descrição detalhada da vulnerabilidade
- Passos para reproduzir o problema
- Versão afetada da extensão
- Impacto potencial da vulnerabilidade
- Sugestões de correção (se houver)

### ⏱️ Tempo de Resposta
- **Primeira resposta**: 48 horas
- **Atualização de status**: 7 dias
- **Correção**: 30 dias (dependendo da complexidade)

### 🎯 Processo de Tratamento

1. **Recebimento**: Confirmamos o recebimento em 48h
2. **Avaliação**: Analisamos e classificamos a vulnerabilidade
3. **Desenvolvimento**: Criamos correção em branch privada
4. **Teste**: Validamos a correção
5. **Release**: Publicamos versão corrigida
6. **Divulgação**: Comunicamos a correção publicamente

## 🛡️ Práticas de Segurança

### 🔑 Gerenciamento de APIs
- **Nunca hardcode** API keys no código
- Use `chrome.storage` para armazenar credenciais
- Implemente rotação de tokens quando possível
- Valide todas as entradas de API

### 🌐 Comunicação Segura
- **HTTPS obrigatório** para todas as conexões
- Validação de certificados SSL
- Timeout adequado para conexões
- Rate limiting para evitar abuso

### 💾 Armazenamento de Dados
- Dados sensíveis criptografados
- Limpeza automática de dados temporários
- Não armazenar senhas em texto plano
- Respeitar políticas de retenção

### 🔍 Validação de Entrada
- Sanitização de todas as entradas do usuário
- Validação de URLs e domínios
- Prevenção de injection attacks
- Validação de tipos de dados

## 🚫 Vulnerabilidades Conhecidas

### ⚠️ Limitações Atuais
- **MCP WebSocket**: Conexões não autenticadas por padrão
- **CORS**: Permissões amplas para desenvolvimento
- **Storage**: Dados não criptografados localmente

### 🔧 Mitigações Implementadas
- Validação de origem para WebSocket
- Sanitização de mensagens recebidas
- Timeout para conexões
- Logging de atividades suspeitas

## 📋 Checklist de Segurança

### Para Usuários
- [ ] Use apenas servidores MCP confiáveis
- [ ] Não compartilhe API keys
- [ ] Mantenha a extensão atualizada
- [ ] Revise permissões da extensão
- [ ] Use HTTPS para APIs externas

### Para Desenvolvedores
- [ ] Nunca commite credenciais
- [ ] Valide todas as entradas
- [ ] Use HTTPS para comunicação
- [ ] Implemente rate limiting
- [ ] Teste com dados maliciosos
- [ ] Revise dependências regularmente

## 🔐 Configurações Recomendadas

### Chrome Extension
```json
{
  "content_security_policy": {
    "extension_pages": "script-src 'self'; object-src 'self'"
  },
  "permissions": [
    "storage",
    "activeTab"
  ]
}
```

### MCP Server
```javascript
// Validação de origem
const allowedOrigins = ['chrome-extension://your-extension-id'];

server.on('connection', (ws, req) => {
  const origin = req.headers.origin;
  if (!allowedOrigins.includes(origin)) {
    ws.close(1008, 'Origin not allowed');
    return;
  }
});
```

## 🏆 Reconhecimento de Segurança

Reconhecemos e valorizamos pesquisadores que reportam vulnerabilidades de forma responsável:

### 🎖️ Hall of Fame
_Lista será atualizada conforme recebermos relatórios válidos._

### 🎁 Programa de Recompensas
Atualmente não oferecemos recompensas monetárias, mas fornecemos:
- Reconhecimento público (com permissão)
- Listagem no hall of fame
- Notificação prioritária de atualizações

## 📚 Recursos de Segurança

### 🔗 Links Úteis
- [Chrome Extension Security](https://developer.chrome.com/docs/extensions/mv3/security/)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [WebSocket Security](https://owasp.org/www-community/attacks/WebSocket_Hijacking)
- [Content Security Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)

### 📖 Documentação
- [Manifest V3 Security](https://developer.chrome.com/docs/extensions/mv3/intro/mv3-overview/#security)
- [Storage API Security](https://developer.chrome.com/docs/extensions/reference/storage/)
- [Message Passing Security](https://developer.chrome.com/docs/extensions/mv3/messaging/#security-considerations)

## 📞 Contato de Emergência

Para vulnerabilidades críticas que podem estar sendo exploradas ativamente:

**Email**: eduardo.pereira@alest.com.br  
**Assunto**: [CRITICAL SECURITY] Chrome MCP Chat - [Descrição Breve]

---

**Agradecemos seu comprometimento em manter nossa extensão segura! 🛡️**