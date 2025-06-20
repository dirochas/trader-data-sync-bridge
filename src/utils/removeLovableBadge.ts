
// Utility to remove Lovable badge from the DOM
export const removeLovableBadge = () => {
  // Remove badge by common selectors
  const selectors = [
    'div[data-lovable-badge]',
    'div[class*="lovable"]',
    'div[id*="lovable"]',
    'a[href*="lovable.dev"]',
    'iframe[src*="lovable"]',
    '.lovable-badge',
    '[data-testid*="lovable"]'
  ];

  selectors.forEach(selector => {
    const elements = document.querySelectorAll(selector);
    elements.forEach(element => {
      element.remove();
    });
  });

  // Remove by content (text-based search)
  const allDivs = document.querySelectorAll('div, a');
  allDivs.forEach(element => {
    const text = element.textContent?.toLowerCase() || '';
    if (text.includes('edit in lovable') || text.includes('lovable')) {
      // Check if it's likely the badge (small, fixed position, etc.)
      const style = window.getComputedStyle(element);
      if (style.position === 'fixed' || 
          style.position === 'absolute' ||
          element.getBoundingClientRect().width < 200) {
        element.remove();
      }
    }
  });
};

// Auto-run function to continuously remove badge
export const startBadgeRemover = () => {
  // Remove immediately
  removeLovableBadge();

  // Set up observer to catch dynamically added badges
  const observer = new MutationObserver(() => {
    removeLovableBadge();
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });

  // Also run periodically as backup
  setInterval(removeLovableBadge, 1000);
};
