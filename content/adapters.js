// ListingBoom AI Copilot - Modular Platform Adapters Engine

const PlatformAdapters = {
  detect: function() {
    const host = window.location.hostname;
    if (host.includes('amazon')) return 'Amazon';
    if (host.includes('flipkart')) return 'Flipkart';
    if (host.includes('meesho')) return 'Meesho';
    return 'Generic';
  },

  scrape: function() {
    const platform = this.detect();
    let title = "";
    let description = "";
    let bullets = [];
    let imageUrls = [];
    let price = "";

    // Title Scraper
    const titleSelectors = [
      'input[name*="title" i]', 'input[id*="title" i]',
      'input[name*="productName" i]', 'input[id*="productName" i]',
      'input[placeholder*="title" i]', 'input[placeholder*="product name" i]'
    ];
    for (const sel of titleSelectors) {
      const el = document.querySelector(sel);
      if (el && (el.value || el.innerText)) {
        title = (el.value || el.innerText).trim();
        break;
      }
    }
    if (!title) {
      const firstInput = document.querySelector('input[type="text"]:not([type="hidden"])');
      title = firstInput && firstInput.value ? firstInput.value.trim() : document.title;
    }

    // Description & Bullets Scraper
    const editors = Array.from(document.querySelectorAll('textarea, [contenteditable="true"]'));
    editors.forEach((el) => {
      const val = (el.value || el.innerText || '').trim();
      const textId = (el.name + ' ' + el.id + ' ' + el.getAttribute('placeholder')).toLowerCase();
      if (textId.includes('desc')) description = val;
      else if (textId.includes('bullet') || textId.includes('feature') || textId.includes('key')) {
        if (val) bullets.push(val);
      }
    });

    if (!description && editors.length > 0) {
      description = editors.map(e => (e.value || e.innerText || '').trim()).filter(Boolean).join('\n');
    }

    // Images Scraper
    const images = Array.from(document.querySelectorAll('img'));
    imageUrls = images
      .map(i => i.src)
      .filter(src => src && src.startsWith('http') && !src.includes('icon') && !src.includes('logo') && !src.includes('svg'))
      .slice(0, 6);

    return {
      platform,
      title,
      description,
      bullets,
      price,
      imageUrls,
      url: window.location.href
    };
  },

  applyTitle: function(newTitle) {
    const titleSelectors = [
      'input[name*="title" i]', 'input[id*="title" i]',
      'input[name*="productName" i]', 'input[id*="productName" i]',
      'input[placeholder*="title" i]', 'input[type="text"]:not([type="hidden"])'
    ];
    for (const sel of titleSelectors) {
      const el = document.querySelector(sel);
      if (el) {
        if ('value' in el) el.value = newTitle;
        else el.innerText = newTitle;
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
        return true;
      }
    }
    navigator.clipboard.writeText(newTitle);
    return false;
  },

  applyAll: function(newTitle, newDesc) {
    const titleOk = this.applyTitle(newTitle);
    const descEl = document.querySelector('textarea[name*="desc" i], textarea[id*="desc" i], textarea, [contenteditable="true"]');
    if (descEl && newDesc) {
      if ('value' in descEl) descEl.value = newDesc;
      else descEl.innerText = newDesc;
      descEl.dispatchEvent(new Event('input', { bubbles: true }));
      descEl.dispatchEvent(new Event('change', { bubbles: true }));
    }
    return titleOk;
  }
};

window.PlatformAdapters = PlatformAdapters;
