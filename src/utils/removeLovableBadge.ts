
// Utility to remove Lovable badge - VERSÃO SIMPLES E SEGURA
export const removeLovableBadge = () => {
  // Remove apenas elementos específicos do badge, sem afetar o React
  const badgeSelectors = [
    'div[data-lovable-badge]',
    'a[href*="lovable.dev"]',
    '.lovable-badge'
  ];

  badgeSelectors.forEach(selector => {
    try {
      const elements = document.querySelectorAll(selector);
      elements.forEach(element => {
        if (element && element.parentNode) {
          console.log(`🗑️ Removendo badge: ${selector}`);
          element.remove();
        }
      });
    } catch (error) {
      console.warn(`Erro ao remover seletor ${selector}:`, error);
    }
  });
};

// Versão segura que não interfere no React
export const startBadgeRemover = () => {
  console.log('🚀 Iniciando Badge Remover SEGURO...');
  
  // Remove uma vez ao carregar
  setTimeout(removeLovableBadge, 1000);
  
  // Observer mais conservador - só monitora adições simples
  const observer = new MutationObserver((mutations) => {
    mutations.forEach(mutation => {
      if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
        // Só remove se encontrar elementos específicos do badge
        setTimeout(removeLovableBadge, 500);
      }
    });
  });

  // Observa apenas o body para novos elementos
  observer.observe(document.body, {
    childList: true,
    subtree: false // Não observa muito profundo para evitar conflitos
  });

  console.log('✅ Badge Remover SEGURO ativo!');
};
