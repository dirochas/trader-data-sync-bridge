
// Utility to remove Lovable badge from the DOM - VERSÃO TURBINADA
export const removeLovableBadge = () => {
  // Lista completa de seletores para encontrar o badge
  const selectors = [
    // Seletores específicos do Lovable
    'div[data-lovable-badge]',
    'div[class*="lovable"]',
    'div[id*="lovable"]',
    'a[href*="lovable.dev"]',
    'a[href*="lovable"]',
    'iframe[src*="lovable"]',
    '.lovable-badge',
    '[data-testid*="lovable"]',
    
    // Seletores por ID que vi no inspector
    '#lovable-badge',
    'div[id*="edit-with"]',
    'div[class*="edit-with"]',
    
    // Seletores por posição (badges geralmente ficam fixed bottom-right)
    'div[style*="position: fixed"][style*="bottom"][style*="right"]',
    'div[style*="position: absolute"][style*="bottom"][style*="right"]',
    
    // Seletores por z-index alto (badges ficam por cima)
    'div[style*="z-index: 999"]',
    'div[style*="z-index: 9999"]',
    'div[style*="z-index: 99999"]',
    
    // Seletores mais genéricos
    'a[target="_blank"][href*="edit"]',
    'div[role="button"][style*="position: fixed"]'
  ];

  // Remove elementos encontrados pelos seletores
  selectors.forEach(selector => {
    try {
      const elements = document.querySelectorAll(selector);
      elements.forEach(element => {
        console.log(`🗑️ Removendo elemento: ${selector}`, element);
        element.remove();
      });
    } catch (error) {
      console.warn(`Erro ao remover seletor ${selector}:`, error);
    }
  });

  // Busca por texto - mais agressiva
  const textSearchElements = document.querySelectorAll('div, a, span, button');
  textSearchElements.forEach(element => {
    const text = element.textContent?.toLowerCase() || '';
    const innerHTML = element.innerHTML?.toLowerCase() || '';
    
    // Lista de textos suspeitos
    const suspiciousTexts = [
      'edit with lovable',
      'edit in lovable', 
      'lovable',
      'edit with',
      'edit in',
      'powered by lovable'
    ];

    const hasSuspiciousText = suspiciousTexts.some(suspiciousText => 
      text.includes(suspiciousText) || innerHTML.includes(suspiciousText)
    );

    if (hasSuspiciousText) {
      const style = window.getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      
      // Características típicas de um badge
      const isLikelyBadge = (
        style.position === 'fixed' || 
        style.position === 'absolute' ||
        rect.width < 300 ||
        rect.height < 100 ||
        parseInt(style.zIndex || '0') > 100
      );

      if (isLikelyBadge) {
        console.log(`🎯 Removendo badge suspeito por texto: "${text}"`, element);
        element.remove();
      }
    }
  });

  // Remove qualquer iframe do Lovable
  const iframes = document.querySelectorAll('iframe');
  iframes.forEach(iframe => {
    const src = iframe.src?.toLowerCase() || '';
    if (src.includes('lovable') || src.includes('edit')) {
      console.log(`📱 Removendo iframe suspeito:`, iframe);
      iframe.remove();
    }
  });
};

// Função para esconder via CSS também
export const hideLovableBadgeWithCSS = () => {
  const style = document.createElement('style');
  style.id = 'lovable-badge-killer';
  style.textContent = `
    /* Hide Lovable badge - VERSÃO TURBINADA */
    div[data-lovable-badge],
    div[class*="lovable"],
    div[id*="lovable"], 
    a[href*="lovable"],
    iframe[src*="lovable"],
    .lovable-badge,
    [data-testid*="lovable"],
    #lovable-badge,
    div[id*="edit-with"],
    div[class*="edit-with"] {
      display: none !important;
      visibility: hidden !important;
      opacity: 0 !important;
      pointer-events: none !important;
      width: 0 !important;
      height: 0 !important;
      overflow: hidden !important;
    }

    /* Hide suspicious fixed elements in bottom-right */
    div[style*="position: fixed"][style*="bottom"][style*="right"] {
      display: none !important;
    }

    /* Hide high z-index elements (likely overlays/badges) */
    div[style*="z-index: 999"],
    div[style*="z-index: 9999"],
    div[style*="z-index: 99999"] {
      display: none !important;
    }
  `;
  
  // Remove estilo anterior se existir
  const existingStyle = document.getElementById('lovable-badge-killer');
  if (existingStyle) {
    existingStyle.remove();
  }
  
  document.head.appendChild(style);
};

// Auto-run function - VERSÃO SUPER AGRESSIVA
export const startBadgeRemover = () => {
  console.log('🚀 Iniciando Badge Killer TURBINADO...');
  
  // Remove imediatamente
  removeLovableBadge();
  hideLovableBadgeWithCSS();

  // Observer mais agressivo
  const observer = new MutationObserver((mutations) => {
    let shouldRemove = false;
    
    mutations.forEach(mutation => {
      // Verifica se foram adicionados novos nós
      if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
        mutation.addedNodes.forEach(node => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            const element = node as Element;
            const text = element.textContent?.toLowerCase() || '';
            const className = element.className?.toLowerCase() || '';
            const id = element.id?.toLowerCase() || '';
            
            // Se contém "lovable" ou "edit", marca para remoção
            if (text.includes('lovable') || 
                text.includes('edit with') || 
                className.includes('lovable') || 
                id.includes('lovable')) {
              shouldRemove = true;
            }
          }
        });
      }
    });
    
    if (shouldRemove) {
      setTimeout(() => {
        removeLovableBadge();
        hideLovableBadgeWithCSS();
      }, 100);
    }
  });

  // Observa mudanças em todo o documento
  observer.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['class', 'id', 'style']
  });

  // Executa periodicamente como backup
  const interval = setInterval(() => {
    removeLovableBadge();
    hideLovableBadgeWithCSS();
  }, 2000);

  // Para quando a página for fechada
  window.addEventListener('beforeunload', () => {
    clearInterval(interval);
    observer.disconnect();
  });

  console.log('✅ Badge Killer TURBINADO ativo!');
};
