document.addEventListener('DOMContentLoaded', () => {
  const platformStatus = document.getElementById('platform-status');
  const analyzeBtn = document.getElementById('analyze-btn');
  const genAiBtn = document.getElementById('gen-ai-btn');
  const toggleOverlayBtn = document.getElementById('toggle-overlay-btn');
  const listingScore = document.getElementById('listing-score');
  const scoreStatus = document.getElementById('score-status');
  const detailsSection = document.getElementById('details-section');
  const titleFeedback = document.getElementById('title-feedback');
  const gapFeedback = document.getElementById('gap-feedback');
  const keywordsContainer = document.getElementById('keywords-container');

  // Detect active platform tab
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const activeTab = tabs[0];
    const url = activeTab?.url || '';
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

  // Safe tab message sender helper (handles "Could not establish connection" runtime error cleanly)
  function sendTabMessage(message, callback) {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tabId = tabs[0]?.id;
      if (!tabId) {
        if (callback) callback(null);
        return;
      }

      // First check if active tab URL is a restricted chrome:// URL
      const tabUrl = tabs[0]?.url || '';
      if (tabUrl.startsWith('chrome://') || tabUrl.startsWith('edge://') || tabUrl.startsWith('about:')) {
        if (callback) callback(null);
        return;
      }

      chrome.tabs.sendMessage(tabId, message, (response) => {
        if (chrome.runtime.lastError) {
          // If content script was not yet injected into this tab, dynamically inject it
          console.warn("Content script connection failed, attempting dynamic injection:", chrome.runtime.lastError.message);
          chrome.scripting.executeScript({
            target: { tabId: tabId },
            files: ["content/content-script.js"]
          }, () => {
            if (chrome.runtime.lastError) {
              console.error("Script injection failed:", chrome.runtime.lastError.message);
              if (callback) callback(null);
            } else {
              // Retry sending message after injection
              chrome.tabs.sendMessage(tabId, message, (res) => {
                const dummy = chrome.runtime.lastError; // clear error
                if (callback) callback(res);
              });
            }
          });
        } else {
          if (callback) callback(response);
        }
      });
    });
  }

  // Toggle Overlay Sidebar in Active Tab
  toggleOverlayBtn.addEventListener('click', () => {
    sendTabMessage({ action: "TOGGLE_SIDEBAR" });
  });

  // AI Content Generator Click
  if (genAiBtn) {
    genAiBtn.addEventListener('click', () => {
      sendTabMessage({ action: "TOGGLE_SIDEBAR" });
    });
  }

  // Quick Audit Listing Click
  analyzeBtn.addEventListener('click', () => {
    listingScore.innerText = 'Scanning...';
    scoreStatus.innerText = 'Fetching listing fields from page...';

    sendTabMessage({ action: "SCRAPE_FORM_DATA" }, async (scrapedData) => {
      if (!scrapedData) {
        listingScore.innerText = '⚠️ Alert';
        scoreStatus.innerText = 'Please open a product listing page & refresh.';
        return;
      }

      try {
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

  function renderPopupResults(data) {
    listingScore.innerText = `${data.score} / 100`;
    scoreStatus.innerText = data.score >= 80 ? '🔥 Great Listing Quality!' : '⚠️ Optimization Recommended';
    scoreStatus.style.color = data.score >= 80 ? '#16a34a' : '#d97706';

    titleFeedback.innerText = data.titleAudit?.feedback || 'Title analyzed.';
    gapFeedback.innerText = (data.competitorGap || []).join(' • ') || 'No major gaps found.';

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
      competitorGap: ['Add dimension chart image', 'Include warranty details'],
      keywords: ['High Quality', 'Top Choice', 'Trendy', 'Best Value']
    };
  }
});
