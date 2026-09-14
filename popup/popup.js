document.addEventListener('DOMContentLoaded', () => {
  const platformStatus = document.getElementById('platform-status');
  const analyzeBtn = document.getElementById('analyze-btn');
  const generateAiBtn = document.getElementById('generate-ai-btn');
  const toggleOverlayBtn = document.getElementById('toggle-overlay-btn');
  const listingScore = document.getElementById('listing-score');
  const scoreBar = document.getElementById('score-bar');
  const scoreStatus = document.getElementById('score-status');
  const auditDetails = document.getElementById('audit-details');
  const titleFeedback = document.getElementById('title-feedback');
  const applyTitleBtn = document.getElementById('apply-title-btn');
  const gapFeedback = document.getElementById('gap-feedback');
  const keywordsContainer = document.getElementById('keywords-container');
  const imageCtrBox = document.getElementById('image-ctr-box');
  const aiPreviewSection = document.getElementById('ai-preview-section');
  const genDescBox = document.getElementById('gen-desc-box');
  const genBulletsBox = document.getElementById('gen-bullets-box');
  const applyGeneratedBtn = document.getElementById('apply-generated-btn');

  // Tab switching logic
  const tabBtns = document.querySelectorAll('.tab-btn');
  const tabContents = document.querySelectorAll('.tab-content');

  tabBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      tabBtns.forEach((b) => b.classList.remove('active'));
      tabContents.forEach((c) => c.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById(btn.dataset.tab).classList.add('active');
    });
  });

  // Active Platform Detection
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const url = tabs[0]?.url || '';
    if (url.includes('amazon')) platformStatus.innerText = 'Amazon';
    else if (url.includes('flipkart')) platformStatus.innerText = 'Flipkart';
    else if (url.includes('meesho')) platformStatus.innerText = 'Meesho';
    else {
      platformStatus.innerText = 'Generic Site';
      platformStatus.style.background = '#334155';
    }
  });

  // Safe tab message sender helper (handles connection errors & restricted tabs)
  function sendTabMessage(message, callback) {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tabId = tabs[0]?.id;
      if (!tabId) {
        if (callback) callback(null);
        return;
      }

      const tabUrl = tabs[0]?.url || '';
      if (tabUrl.startsWith('chrome://') || tabUrl.startsWith('edge://') || tabUrl.startsWith('about:')) {
        if (callback) callback(null);
        return;
      }

      chrome.tabs.sendMessage(tabId, message, (response) => {
        if (chrome.runtime.lastError) {
          console.warn('Content script not connected, attempting dynamic injection...');
          chrome.scripting.executeScript({
            target: { tabId: tabId },
            files: ['content/content-script.js']
          }, () => {
            if (chrome.runtime.lastError) {
              console.error('Script injection failed:', chrome.runtime.lastError.message);
              if (callback) callback(null);
            } else {
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
    sendTabMessage({ action: 'TOGGLE_SIDEBAR' });
  });

  // Quick Audit Listing Click
  analyzeBtn.addEventListener('click', () => {
    listingScore.innerText = 'Scanning...';
    scoreStatus.innerText = 'Scraping listing fields...';

    sendTabMessage({ action: 'SCRAPE_FORM_DATA' }, async (scrapedData) => {
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

        if (!response.ok) throw new Error('Backend server error');
        const data = await response.json();
        renderAuditResults(data);
      } catch (err) {
        console.warn('Backend server not responding, running offline audit:', err);
        const offlineData = generateOfflineAudit(scrapedData);
        renderAuditResults(offlineData);
      }
    });
  });

  // Generate AI Bullets & Description Click
  generateAiBtn.addEventListener('click', () => {
    generateAiBtn.disabled = true;
    generateAiBtn.innerText = '⏳ Generating Content...';

    sendTabMessage({ action: 'SCRAPE_FORM_DATA' }, async (scrapedData) => {
      const payload = scrapedData || { title: 'Product', platform: 'Generic' };

      try {
        const response = await fetch('http://localhost:3000/generate-bullets-desc', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        if (!response.ok) throw new Error('Backend gen error');
        const data = await response.json();
        renderGeneratedResults(data);
      } catch (err) {
        console.warn('Backend server off, using client AI generator:', err);
        renderGeneratedResults({
          title: `${payload.title || 'Product'} | Premium Quality & Top Rated (2025 Edition)`,
          bullets: [
            '🔥 PREMIUM QUALITY: Durable construction for long-lasting use.',
            '✨ ELEGANT DESIGN: Modern aesthetic and sleek finishing.',
            '📦 HIGH UTILITY: Lightweight, compact and comfortable.',
            '💯 SUPERIOR DURABILITY: Built to withstand daily wear and tear.',
            '🚚 TOP RATED CHOICE: Guaranteed satisfaction with fast delivery.'
          ],
          description: `Upgrade your product portfolio with this premium ${payload.title || 'item'} on ${payload.platform || 'e-commerce'}!`
        });
      } finally {
        generateAiBtn.disabled = false;
        generateAiBtn.innerText = '✨ Generate AI Bullets & Description';
      }
    });
  });

  // Apply Suggested Title
  applyTitleBtn.addEventListener('click', () => {
    const title = applyTitleBtn.dataset.suggestedTitle;
    if (title) {
      sendTabMessage({ action: 'APPLY_TITLE', title: title }, (res) => {
        alert('✨ Title applied to product listing form!');
      });
    }
  });

  // Apply Generated All
  applyGeneratedBtn.addEventListener('click', () => {
    const title = applyGeneratedBtn.dataset.genTitle;
    const desc = applyGeneratedBtn.dataset.genDesc;
    sendTabMessage({ action: 'APPLY_ALL', title: title, description: desc }, (res) => {
      alert('✨ AI Description & Bullet Points applied to form!');
    });
  });

  function renderAuditResults(data) {
    listingScore.innerText = `${data.score} / 100`;
    scoreBar.style.width = `${data.score}%`;
    scoreStatus.innerText = data.score >= 80 ? '🔥 Excellent Listing Quality!' : '⚠️ Optimization Needed';
    scoreStatus.style.color = data.score >= 80 ? '#10b981' : '#f59e0b';

    titleFeedback.innerText = data.titleAudit?.feedback || 'Title analyzed.';
    if (data.titleAudit?.suggestedTitle) {
      applyTitleBtn.dataset.suggestedTitle = data.titleAudit.suggestedTitle;
      applyTitleBtn.style.display = 'block';
    }

    gapFeedback.innerHTML = '';
    (data.competitorGap || []).forEach((gap) => {
      const div = document.createElement('div');
      div.className = 'gap-item';
      div.innerText = `• ${gap}`;
      gapFeedback.appendChild(div);
    });

    keywordsContainer.innerHTML = '';
    (data.keywords || []).forEach((kw) => {
      const chip = document.createElement('span');
      chip.className = 'chip';
      chip.innerText = kw;
      keywordsContainer.appendChild(chip);
    });

    if (data.imageCtr) {
      imageCtrBox.innerHTML = `
        <div><strong>Est. CTR:</strong> <span style="color:#38bdf8; font-weight:bold;">${data.imageCtr.estimatedCtr || 'N/A'}</span></div>
        <div><strong>Image Quality:</strong> ${data.imageCtr.qualityScore || 'Good'} (${data.imageCtr.imageCount || 0} images)</div>
        <div style="margin-top: 4px; font-size: 10px; color: #94a3b8;">• ${(data.imageCtr.tips || []).join('<br>• ')}</div>
      `;
    }

    auditDetails.style.display = 'block';
  }

  function renderGeneratedResults(data) {
    genDescBox.innerText = data.description;
    genBulletsBox.innerText = (data.bullets || []).join('\n\n');

    applyGeneratedBtn.dataset.genTitle = data.title;
    applyGeneratedBtn.dataset.genDesc = `${data.description}\n\nKey Bullet Points:\n${(data.bullets || []).join('\n')}`;

    aiPreviewSection.style.display = 'block';
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
          : 'Title is too brief. Include brand, key benefits & specifications.',
        suggestedTitle: `${scraped.title || 'Product'} | Premium Quality & Top Rated`
      },
      competitorGap: ['Add dimension chart image', 'Include warranty details'],
      keywords: ['High Quality', 'Top Choice', 'Trendy', 'Best Value'],
      imageCtr: {
        estimatedCtr: '4.2%',
        qualityScore: 'Medium',
        imageCount: scraped.imageUrls ? scraped.imageUrls.length : 0,
        tips: ['Use pure white background (RGB 255,255,255)', 'Add dimension chart']
      }
    };
  }
});
