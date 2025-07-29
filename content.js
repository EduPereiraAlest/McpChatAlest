/**
 * Chrome MCP Chat Extension - Content Script
 * Runs on web pages to provide contextual integration
 */

console.log('🌐 MCP Chat Content Script carregado');

// Content script state
let contentState = {
    chatWidget: null,
    isWidgetVisible: false,
    selectedText: '',
    pageContext: null
};

// ===== INITIALIZATION =====
function initializeContentScript() {
    console.log('🚀 Inicializando MCP Chat Content Script');
    
    // Collect page context
    collectPageContext();
    
    // Setup message listeners
    setupMessageListeners();
    
    // Create floating chat button (optional)
    // createFloatingChatButton();
    
    console.log('✅ Content Script inicializado');
}

// ===== PAGE CONTEXT COLLECTION =====
function collectPageContext() {
    contentState.pageContext = {
        url: window.location.href,
        title: document.title,
        domain: window.location.hostname,
        description: getPageDescription(),
        keywords: getPageKeywords(),
        mainContent: extractMainContent(),
        timestamp: new Date().toISOString()
    };
    
    console.log('📄 Contexto da página coletado:', contentState.pageContext);
}

function getPageDescription() {
    const metaDescription = document.querySelector('meta[name="description"]');
    return metaDescription ? metaDescription.content : '';
}

function getPageKeywords() {
    const metaKeywords = document.querySelector('meta[name="keywords"]');
    return metaKeywords ? metaKeywords.content.split(',').map(k => k.trim()) : [];
}

function extractMainContent() {
    // Try to find main content area
    const contentSelectors = [
        'main',
        '[role="main"]',
        'article',
        '.content',
        '#content',
        '.main-content',
        '#main-content'
    ];
    
    for (const selector of contentSelectors) {
        const element = document.querySelector(selector);
        if (element) {
            return element.innerText.substring(0, 1000); // Limit to 1000 chars
        }
    }
    
    // Fallback to body content (limited)
    return document.body.innerText.substring(0, 500);
}

// ===== MESSAGE HANDLING =====
function setupMessageListeners() {
    // Listen for messages from background script
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        console.log('📨 Mensagem recebida no content script:', request.type);
        
        switch (request.type) {
            case 'open_chat_with_text':
                handleOpenChatWithText(request);
                sendResponse({ success: true });
                break;
                
            case 'get_page_context':
                sendResponse(contentState.pageContext);
                break;
                
            case 'get_selected_text':
                sendResponse({ selectedText: getSelectedText() });
                break;
                
            case 'highlight_text':
                highlightText(request.text);
                sendResponse({ success: true });
                break;
                
            default:
                sendResponse({ error: 'Unknown message type' });
        }
    });
}

function handleOpenChatWithText(request) {
    const { action, text } = request;
    
    // Create contextual message
    let contextualMessage = '';
    
    if (action === 'analisar') {
        contextualMessage = `Por favor, analise o seguinte texto da página "${document.title}":\n\n"${text}"\n\nContexto da página: ${window.location.href}`;
    } else if (action === 'explicar') {
        contextualMessage = `Por favor, explique o seguinte texto da página "${document.title}":\n\n"${text}"\n\nContexto da página: ${window.location.href}`;
    }
    
    // Send message to background to open popup with pre-filled text
    chrome.runtime.sendMessage({
        type: 'open_popup_with_message',
        message: contextualMessage,
        context: contentState.pageContext
    });
}

// ===== TEXT SELECTION =====
function getSelectedText() {
    const selection = window.getSelection();
    return selection.toString().trim();
}

function highlightText(text) {
    // Simple text highlighting function
    if (!text) return;
    
    const walker = document.createTreeWalker(
        document.body,
        NodeFilter.SHOW_TEXT,
        null,
        false
    );
    
    const textNodes = [];
    let node;
    
    while (node = walker.nextNode()) {
        if (node.textContent.includes(text)) {
            textNodes.push(node);
        }
    }
    
    textNodes.forEach(textNode => {
        const parent = textNode.parentNode;
        const content = textNode.textContent;
        const highlightedContent = content.replace(
            new RegExp(text, 'gi'),
            `<mark style="background: #ffff00; color: #000;">${text}</mark>`
        );
        
        if (highlightedContent !== content) {
            const newElement = document.createElement('span');
            newElement.innerHTML = highlightedContent;
            parent.replaceChild(newElement, textNode);
        }
    });
}

// ===== FLOATING CHAT BUTTON (OPTIONAL) =====
function createFloatingChatButton() {
    // Create floating button for quick access to chat
    const button = document.createElement('div');
    button.id = 'mcp-chat-floating-btn';
    button.innerHTML = '🤖';
    button.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        width: 50px;
        height: 50px;
        background: #007acc;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 20px;
        cursor: pointer;
        z-index: 10000;
        box-shadow: 0 4px 12px rgba(0, 122, 204, 0.3);
        transition: all 0.3s ease;
        user-select: none;
    `;
    
    button.addEventListener('mouseenter', () => {
        button.style.transform = 'scale(1.1)';
        button.style.boxShadow = '0 6px 16px rgba(0, 122, 204, 0.4)';
    });
    
    button.addEventListener('mouseleave', () => {
        button.style.transform = 'scale(1)';
        button.style.boxShadow = '0 4px 12px rgba(0, 122, 204, 0.3)';
    });
    
    button.addEventListener('click', () => {
        openChatPopup();
    });
    
    document.body.appendChild(button);
    
    // Hide button on some sites where it might interfere
    const restrictedDomains = ['youtube.com', 'netflix.com', 'twitch.tv'];
    if (restrictedDomains.some(domain => window.location.hostname.includes(domain))) {
        button.style.display = 'none';
    }
}

function openChatPopup() {
    // Get currently selected text
    const selectedText = getSelectedText();
    
    let message = '';
    if (selectedText) {
        message = `Contexto da página: ${document.title}\nURL: ${window.location.href}\n\nTexto selecionado: "${selectedText}"\n\nPor favor, ajude-me com isso.`;
    } else {
        message = `Estou na página: ${document.title}\nURL: ${window.location.href}\n\nComo posso ajudar?`;
    }
    
    // Send message to background to open popup
    chrome.runtime.sendMessage({
        type: 'open_popup_with_message',
        message: message,
        context: contentState.pageContext
    });
}

// ===== TEXT SELECTION ENHANCEMENT =====
document.addEventListener('mouseup', () => {
    const selectedText = getSelectedText();
    if (selectedText.length > 0) {
        contentState.selectedText = selectedText;
        
        // Could show a small tooltip or button near selection
        // showSelectionTooltip(selectedText);
    }
});

function showSelectionTooltip(text) {
    // Remove existing tooltip
    const existingTooltip = document.getElementById('mcp-chat-selection-tooltip');
    if (existingTooltip) {
        existingTooltip.remove();
    }
    
    // Create tooltip
    const tooltip = document.createElement('div');
    tooltip.id = 'mcp-chat-selection-tooltip';
    tooltip.innerHTML = `
        <button onclick="askMCPAboutSelection('${text.replace(/'/g, "\\'")}')">
            🤖 Perguntar ao MCP
        </button>
    `;
    tooltip.style.cssText = `
        position: absolute;
        background: #2d2d2d;
        color: white;
        padding: 8px;
        border-radius: 4px;
        font-size: 12px;
        z-index: 10000;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        border: 1px solid #404040;
    `;
    
    // Position tooltip near selection
    const selection = window.getSelection();
    if (selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        
        tooltip.style.left = `${rect.left + window.scrollX}px`;
        tooltip.style.top = `${rect.bottom + window.scrollY + 5}px`;
    }
    
    document.body.appendChild(tooltip);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        if (tooltip.parentNode) {
            tooltip.remove();
        }
    }, 5000);
}

// Global function for tooltip button
window.askMCPAboutSelection = function(text) {
    const message = `Página: ${document.title}\nURL: ${window.location.href}\n\nTexto selecionado: "${text}"\n\nPor favor, explique ou analise este texto.`;
    
    chrome.runtime.sendMessage({
        type: 'open_popup_with_message',
        message: message,
        context: contentState.pageContext
    });
    
    // Remove tooltip
    const tooltip = document.getElementById('mcp-chat-selection-tooltip');
    if (tooltip) {
        tooltip.remove();
    }
};

// ===== PAGE CHANGE DETECTION =====
let lastUrl = location.href;
new MutationObserver(() => {
    const url = location.href;
    if (url !== lastUrl) {
        lastUrl = url;
        console.log('🔄 URL mudou para:', url);
        
        // Update page context when URL changes (SPA navigation)
        setTimeout(() => {
            collectPageContext();
        }, 1000);
    }
}).observe(document, { subtree: true, childList: true });

// ===== KEYBOARD SHORTCUTS =====
document.addEventListener('keydown', (e) => {
    // Ctrl/Cmd + Shift + M to open MCP Chat
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'M') {
        e.preventDefault();
        openChatPopup();
    }
    
    // Ctrl/Cmd + Shift + A to analyze selected text
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'A') {
        const selectedText = getSelectedText();
        if (selectedText) {
            e.preventDefault();
            handleOpenChatWithText({
                action: 'analisar',
                text: selectedText
            });
        }
    }
});

// ===== ERROR HANDLING =====
window.addEventListener('error', (e) => {
    console.error('❌ Erro no Content Script:', e.error);
});

// ===== CLEANUP =====
window.addEventListener('beforeunload', () => {
    // Clean up any created elements
    const floatingBtn = document.getElementById('mcp-chat-floating-btn');
    const tooltip = document.getElementById('mcp-chat-selection-tooltip');
    
    if (floatingBtn) floatingBtn.remove();
    if (tooltip) tooltip.remove();
});

// ===== INITIALIZATION =====
// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeContentScript);
} else {
    initializeContentScript();
}

console.log('✅ MCP Chat Content Script carregado com sucesso');