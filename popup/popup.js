document.addEventListener('DOMContentLoaded', () => {
  const platformStatus = document.getElementById('platform-status');
  const analyzeBtn = document.getElementById('analyze-btn');
  const generateAiBtn = document.getElementById('generate-ai-btn');
  const toggleOverlayBtn = document.getElementById('toggle-overlay-btn');
  const listingScore = document.getElementById('listing-score');
  const scoreBar = document.getElementById('score-bar');
  const scoreStatus = document.getElementById('score-status');
  const auditDetails = document.getElementById('audit-details');
  const topActionsContainer = document.getElementById('top-actions-container');
  const titleFeedback = document.getElementById('title-feedback');
  const applyTitleBtn = document.getElementById('apply-title-btn');
  const keywordsContainer = document.getElementById('keywords-container');
  const imageReadinessBox = document.getElementById('image-readiness-box');
  const aiPreviewSection = document.getElementById('ai-preview-section');
  const genDescBox = document.getElementById('gen-desc-box');
  const genBulletsBox = document.getElementById('gen-bullets-box');
  const applyGeneratedBtn = document.getElementById('apply-generated-btn');

  // Tab switching
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

  // Safe Tab Messaging
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
          console.warn('Content script connection retry...');
          chrome.scripting.executeScript({
            target: { tabId: tabId },
            files: ['content/adapters.js', 'content/content-script.js']
          }, () => {
            if (chrome.runtime.lastError) {
              if (callback) callback(null);
            } else {
              chrome.tabs.sendMessage(tabId, message, (res) => {
                const dummy = chrome.runtime.lastError;
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

  // Toggle Overlay Sidebar
  toggleOverlayBtn.addEventListener('click', () => {
    sendTabMessage({ action: 'TOGGLE_SIDEBAR' });
  });

  // Analyze Active Listing
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
        console.warn('Backend server offline, using fallback client audit:', err);
        const offlineData = generateOfflineAudit(scrapedData);
        renderAuditResults(offlineData);
      }
    });
  });

  // Generate Fact-Based AI Content
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
        console.warn('Backend offline, using fallback generator:', err);
        renderGeneratedResults({
          title: `${payload.title || 'Product'} - High Quality & Durable Design`,
          bullets: [
            'MATERIAL & BUILD: Crafted with quality durable materials.',
            'DESIGN & FIT: Modern aesthetic engineered for everyday utility.',
            'EASY MAINTENANCE: Designed for hassle-free care.',
            'PERFORMANCE: Tested for durability and wear resistance.',
            'PACKAGING: Securely packed for safe delivery.'
          ],
          description: `Upgrade your listing with ${payload.title || 'this product'}. Carefully engineered for performance and comfort.`
        });
      } finally {
        generateAiBtn.disabled = false;
        generateAiBtn.innerText = '✨ Generate Fact-Based Content';
      }
    });
  });

  // Apply Title
  applyTitleBtn.addEventListener('click', () => {
    const title = applyTitleBtn.dataset.suggestedTitle;
    if (title) {
      sendTabMessage({ action: 'APPLY_TITLE', title: title }, (res) => {
        alert('✨ Title applied to form!');
      });
    }
  });

  // Apply Generated Content
  applyGeneratedBtn.addEventListener('click', () => {
    const title = applyGeneratedBtn.dataset.genTitle;
    const desc = applyGeneratedBtn.dataset.genDesc;
    sendTabMessage({ action: 'APPLY_ALL', title: title, description: desc }, (res) => {
      alert('✨ Generated content applied to form!');
    });
  });

  function renderAuditResults(data) {
    const score = data.listingReadinessScore || data.score || 50;
    listingScore.innerText = `${score} / 100`;
    scoreBar.style.width = `${score}%`;
    scoreStatus.innerText = score >= 80 ? '🔥 High Listing Readiness!' : '⚠️ Optimization Opportunities Found';
    scoreStatus.style.color = score >= 80 ? '#10b981' : '#f59e0b';

    topActionsContainer.innerHTML = '';
    const actions = data.topActions || ['Expand title with key specifications.', 'Add at least 5 bullet points.'];
    actions.forEach((act) => {
      const div = document.createElement('div');
      div.className = 'top-action';
      div.innerText = `• ${act}`;
      topActionsContainer.appendChild(div);
    });

    titleFeedback.innerText = data.titleAnalysis?.score >= 80 ? 'Title is clear and good length.' : 'Title needs optimization.';
    if (data.titleAnalysis?.suggestedTitle) {
      applyTitleBtn.dataset.suggestedTitle = data.titleAnalysis.suggestedTitle;
      applyTitleBtn.style.display = 'block';
    }

    keywordsContainer.innerHTML = '';
    (data.observedKeywords || data.keywords || []).forEach((kw) => {
      const chip = document.createElement('span');
      chip.className = 'chip';
      chip.innerText = kw;
      keywordsContainer.appendChild(chip);
    });

    if (data.imageAnalysis) {
      imageReadinessBox.innerHTML = `
        <div><strong>Image Optimization Readiness:</strong> <span style="color:#38bdf8; font-weight:bold;">${data.imageAnalysis.readinessScore || 60}/100</span></div>
        <div><strong>Image Count:</strong> ${data.imageAnalysis.imageCount || 0} images</div>
        <div style="margin-top: 4px; font-size: 10px; color: #94a3b8;">• ${(data.imageAnalysis.recommendations || []).join('<br>• ')}</div>
      `;
    }

    auditDetails.style.display = 'block';
  }

  function renderGeneratedResults(data) {
    genDescBox.innerText = data.description;
    genBulletsBox.innerText = (data.bullets || []).join('\n\n');

    applyGeneratedBtn.dataset.genTitle = data.title;
    applyGeneratedBtn.dataset.genDesc = `${data.description}\n\nKey Highlights:\n${(data.bullets || []).join('\n')}`;

    aiPreviewSection.style.display = 'block';
  }

  function generateOfflineAudit(scraped) {
    let score = 55;
    if (scraped.title && scraped.title.length > 25) score += 20;
    if (scraped.description && scraped.description.length > 50) score += 15;
    if (scraped.imageUrls && scraped.imageUrls.length >= 2) score += 10;

    return {
      listingReadinessScore: Math.min(score, 95),
      topActions: [
        'Expand title with brand, size, or material details.',
        'Upload secondary product gallery images (3+ recommended).'
      ],
      titleAnalysis: {
        score: scraped.title && scraped.title.length > 25 ? 85 : 55,
        suggestedTitle: `${scraped.title || 'Product'} - Quality Assured & Durable Design`
      },
      imageAnalysis: {
        readinessScore: scraped.imageUrls && scraped.imageUrls.length >= 3 ? 85 : 50,
        imageCount: scraped.imageUrls ? scraped.imageUrls.length : 0,
        recommendations: ['Main image should have a clean white background.', 'Add size infographic or lifestyle image.']
      },
      observedKeywords: ['High Quality', 'Durable', 'Best Value']
    };
  }
});
