document.addEventListener('DOMContentLoaded', () => {
  const platformStatus = document.getElementById('platform-status');
  const analyzeBtn = document.getElementById('analyze-btn');
  const toggleOverlayBtn = document.getElementById('toggle-overlay-btn');
  const listingScore = document.getElementById('listing-score');
  const scoreStatus = document.getElementById('score-status');
  const detailsSection = document.getElementById('details-section');
  const titleFeedback = document.getElementById('title-feedback');
  const keywordsContainer = document.getElementById('keywords-container');

  // Detect active platform tab
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const url = tabs[0]?.url || '';
    if (url.includes('amazon')) {
      platformStatus.innerText = 'Amazon';
    } else if (url.includes('flipkart')) {
      platformStatus.innerText = 'Flipkart';
    } else if (url.includes('meesho')) {
      platformStatus.innerText = 'Meesho';
    } else {
      platformStatus.innerText = 'Generic Site';
      platformStatus.style.background = '#64748b';
    }
  });

  // Toggle Overlay Sidebar in Active Tab
  toggleOverlayBtn.addEventListener('click', () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.id) {
        chrome.tabs.sendMessage(tabs[0].id, { action: "TOGGLE_SIDEBAR" });
      }
    });
  });

  // Quick Audit Listing Click
  analyzeBtn.addEventListener('click', () => {
    listingScore.innerText = 'Scanning...';
    scoreStatus.innerText = 'Fetching listing fields from page...';

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (!tabs[0]?.id) return;

      chrome.tabs.sendMessage(tabs[0].id, { action: "SCRAPE_FORM_DATA" }, async (scrapedData) => {
        if (!scrapedData) {
          listingScore.innerText = 'Error';
          scoreStatus.innerText = 'Please refresh or open product listing page.';
          return;
        }

        try {
          // Call backend server or fallback locally
          const response = await fetch('http://localhost:3000/analyze-listing', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(scrapedData)
          });

          if (!response.ok) throw new Error('Backend failed');
          const data = await response.json();
          renderPopupResults(data);
        } catch (err) {
          console.warn('Backend server not responding, using offline scoring:', err);
          const offlineData = generateOfflineAudit(scrapedData);
          renderPopupResults(offlineData);
        }
      });
    });
  });

  function renderPopupResults(data) {
    listingScore.innerText = `${data.score} / 100`;
    scoreStatus.innerText = data.score >= 80 ? '🔥 Great Listing Quality!' : '⚠️ Optimization Recommended';
    scoreStatus.style.color = data.score >= 80 ? '#16a34a' : '#d97706';

    titleFeedback.innerText = data.titleAudit?.feedback || 'Title analyzed.';

    keywordsContainer.innerHTML = '';
    (data.keywords || []).forEach((kw) => {
      const span = document.createElement('span');
      span.className = 'kw-tag';
      span.innerText = kw;
      keywordsContainer.appendChild(span);
    });

    detailsSection.style.display = 'block';
  }

  function generateOfflineAudit(scraped) {
    let score = 55;
    if (scraped.title && scraped.title.length > 25) score += 20;
    if (scraped.description && scraped.description.length > 50) score += 15;
    if (scraped.imageUrls && scraped.imageUrls.length >= 2) score += 10;

    return {
      score: Math.min(score, 95),
      titleAudit: {
        feedback: scraped.title && scraped.title.length > 25
          ? 'Good title! Ensure main keywords are placed near the front.'
          : 'Title is too brief. Include brand, key benefits & specifications.'
      },
      keywords: ['High Quality', 'Top Choice', 'Trendy', 'Best Value']
    };
  }
});
