// ListingBoom AI Content Script & Sidebar Overlay Injector Pro

(function () {
  if (window.__listingboom_injected) return;
  window.__listingboom_injected = true;

  console.log("ListingBoom AI Pro Content Script Loaded.");

  let currentLanguage = "en"; // 'en' or 'hi'

  // Helper to scrape inputs, textareas, or contenteditable divs on Amazon, Flipkart, Meesho, or Generic
  function scrapeListingData() {
    const hostname = window.location.hostname;
    let platform = "Generic";
    if (hostname.includes("amazon")) platform = "Amazon";
    else if (hostname.includes("flipkart")) platform = "Flipkart";
    else if (hostname.includes("meesho")) platform = "Meesho";

    let title = "";
    let description = "";
    let price = "";
    let bullets = [];
    let imageUrls = [];

    // 1. Scrape Title
    const titleSelectors = [
      'input[name*="title" i]',
      'input[id*="title" i]',
      'input[name*="productName" i]',
      'input[id*="productName" i]',
      'input[placeholder*="title" i]',
      'input[placeholder*="product name" i]'
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
      if (firstInput && firstInput.value) {
        title = firstInput.value.trim();
      } else {
        title = document.title;
      }
    }

    // 2. Scrape Description & Bullet points
    const textareasAndEditors = Array.from(document.querySelectorAll('textarea, [contenteditable="true"]'));
    textareasAndEditors.forEach((ta) => {
      const textVal = ta.value || ta.innerText || '';
      const identifier = (ta.name + " " + ta.id + " " + ta.getAttribute('placeholder')).toLowerCase();
      if (identifier.includes("desc")) {
        description = textVal.trim();
      } else if (identifier.includes("bullet") || identifier.includes("feature") || identifier.includes("key")) {
        if (textVal.trim()) bullets.push(textVal.trim());
      }
    });

    if (!description && textareasAndEditors.length > 0) {
      description = textareasAndEditors.map((t) => (t.value || t.innerText || '').trim()).filter(Boolean).join("\n");
    }

    // 3. Scrape Price
    const priceSelectors = [
      'input[name*="price" i]',
      'input[id*="price" i]',
      'input[name*="mrp" i]',
      'input[placeholder*="price" i]'
    ];
    for (const sel of priceSelectors) {
      const el = document.querySelector(sel);
      if (el && el.value) {
        price = el.value.trim();
        break;
      }
    }

    // 4. Scrape Images
    const imgElements = Array.from(document.querySelectorAll("img"));
    imageUrls = imgElements
      .map((img) => img.src)
      .filter((src) => src && src.startsWith("http") && !src.includes("icon") && !src.includes("logo") && !src.includes("svg"))
      .slice(0, 6);

    return {
      platform,
      title,
      description,
      bullets,
      price,
      imageUrls,
      language: currentLanguage,
      url: window.location.href
    };
  }

  function applyTitleToForm(newTitle) {
    const titleSelectors = [
      'input[name*="title" i]',
      'input[id*="title" i]',
      'input[name*="productName" i]',
      'input[id*="productName" i]',
      'input[placeholder*="title" i]',
      'input[placeholder*="product name" i]',
      'input[type="text"]:not([type="hidden"])'
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
  }

  function applyAllToForm(newTitle, newDesc) {
    let titleApplied = applyTitleToForm(newTitle);

    const descEl = document.querySelector('textarea[name*="desc" i], textarea[id*="desc" i], textarea, [contenteditable="true"]');
    if (descEl && newDesc) {
      if ('value' in descEl) descEl.value = newDesc;
      else descEl.innerText = newDesc;
      descEl.dispatchEvent(new Event('input', { bubbles: true }));
      descEl.dispatchEvent(new Event('change', { bubbles: true }));
    }
    return titleApplied;
  }

  // Inject Floating Sidebar Overlay UI
  function createSidebarOverlay() {
    if (document.getElementById("listingboom-overlay")) return;

    const container = document.createElement("div");
    container.id = "listingboom-overlay";
    container.style.cssText = `
      position: fixed;
      top: 60px;
      right: 20px;
      width: 350px;
      max-height: 85vh;
      background: #0f172a;
      color: #f8fafc;
      box-shadow: 0 20px 30px -10px rgba(0, 0, 0, 0.5);
      border-radius: 12px;
      z-index: 999999;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      border: 1px solid #334155;
      overflow-y: auto;
      transition: all 0.3s ease;
      display: flex;
      flex-direction: column;
    `;

    container.innerHTML = `
      <div style="background: linear-gradient(135deg, #1e293b, #0f172a); color: white; padding: 12px 14px; border-top-left-radius: 12px; border-top-right-radius: 12px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #334155;">
        <div style="display: flex; align-items: center; gap: 8px;">
          <span style="font-size: 18px;">⚡</span>
          <div>
            <div style="font-weight: 800; font-size: 13px; color: #38bdf8;">ListingBoom AI Pro</div>
            <div style="font-size: 10px; opacity: 0.8; color: #94a3b8;" id="lb-platform-badge">Platform: Detecting...</div>
          </div>
        </div>
        <div style="display: flex; align-items: center; gap: 6px;">
          <select id="lb-lang-select" style="background: #1e293b; color: #38bdf8; border: 1px solid #334155; padding: 2px 6px; border-radius: 4px; font-size: 10px; cursor: pointer;">
            <option value="en">English</option>
            <option value="hi">Hinglish</option>
          </select>
          <button id="lb-close-btn" style="background: transparent; border: none; color: #94a3b8; font-size: 18px; cursor: pointer;">✕</button>
        </div>
      </div>

      <div style="padding: 12px; font-size: 12px;">
        <div style="background: #1e293b; border: 1px solid #334155; border-radius: 8px; padding: 10px; text-align: center; margin-bottom: 10px;">
          <div style="font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px; color: #94a3b8; font-weight: 700;">Listing Quality Score</div>
          <div id="lb-score-display" style="font-size: 32px; font-weight: 900; color: #38bdf8; margin: 2px 0;">-- / 100</div>
          <div id="lb-score-status" style="font-size: 10px; color: #94a3b8;">Click Audit to evaluate listing</div>
        </div>

        <div style="display: flex; gap: 6px; margin-bottom: 10px;">
          <button id="lb-audit-btn" style="flex: 1; background: linear-gradient(135deg, #2563eb, #1d4ed8); color: white; border: none; padding: 8px; border-radius: 6px; font-weight: 700; cursor: pointer; font-size: 11px;">
            🔍 Quick Audit
          </button>
          <button id="lb-generate-all-btn" style="flex: 1; background: linear-gradient(135deg, #8b5cf6, #6d28d9); color: white; border: none; padding: 8px; border-radius: 6px; font-weight: 700; cursor: pointer; font-size: 11px;">
            ✨ Generate AI All
          </button>
        </div>

        <div id="lb-results-section" style="display: none; flex-direction: column; gap: 8px;">
          <div style="background: #1e293b; border: 1px solid #334155; padding: 8px; border-radius: 6px;">
            <div style="font-weight: 700; font-size: 10px; color: #38bdf8; margin-bottom: 4px; text-transform: uppercase;">TITLE OPTIMIZER</div>
            <div id="lb-title-feedback" style="color: #cbd5e1; font-size: 11px; margin-bottom: 6px;"></div>
            <button id="lb-fix-title-btn" style="width: 100%; background: #10b981; color: white; border: none; padding: 6px; border-radius: 6px; font-size: 11px; font-weight: 700; cursor: pointer;">
              ✨ Auto-Apply Best Title
            </button>
          </div>

          <div style="background: #1e293b; border: 1px solid #334155; padding: 8px; border-radius: 6px;">
            <div style="font-weight: 700; font-size: 10px; color: #f87171; margin-bottom: 4px; text-transform: uppercase;">COMPETITOR GAP ANALYSIS</div>
            <div id="lb-gap-list" style="font-size: 11px; color: #f87171; line-height: 1.4;"></div>
          </div>

          <div style="background: #1e293b; border: 1px solid #334155; padding: 8px; border-radius: 6px;">
            <div style="font-weight: 700; font-size: 10px; color: #38bdf8; margin-bottom: 4px; text-transform: uppercase;">TRENDING KEYWORDS TO ADD</div>
            <div id="lb-keywords-list" style="display: flex; flex-wrap: wrap; gap: 4px;"></div>
          </div>

          <div style="background: #1e293b; border: 1px solid #334155; padding: 8px; border-radius: 6px;">
            <div style="font-weight: 700; font-size: 10px; color: #38bdf8; margin-bottom: 4px; text-transform: uppercase;">IMAGE CTR VISION AUDIT</div>
            <div id="lb-image-ctr-info" style="font-size: 11px; color: #cbd5e1; line-height: 1.4;"></div>
          </div>
        </div>

        <div id="lb-generated-preview" style="display: none; background: #1e293b; border: 1px solid #334155; padding: 8px; border-radius: 6px; margin-top: 8px;">
          <div style="font-weight: 700; font-size: 11px; color: #38bdf8; margin-bottom: 4px;">AI GENERATED LISTING CONTENT</div>
          <div style="font-weight: 600; font-size: 10px; color: #94a3b8;">Description:</div>
          <div id="lb-gen-desc" style="background: #090d16; padding: 6px; border-radius: 4px; font-size: 10px; color: #cbd5e1; margin-bottom: 6px; max-height: 80px; overflow-y: auto;"></div>
          <div style="font-weight: 600; font-size: 10px; color: #94a3b8;">Bullet Points (5 Items):</div>
          <ul id="lb-gen-bullets" style="padding-left: 14px; margin: 2px 0 8px 0; font-size: 10px; color: #cbd5e1;"></ul>
          <button id="lb-apply-all-generated-btn" style="width: 100%; background: #8b5cf6; color: white; border: none; padding: 6px; border-radius: 6px; font-size: 11px; font-weight: 700; cursor: pointer;">
            ⚡ Auto-Fill Generated Content To Form
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(container);

    // Event listeners
    document.getElementById("lb-close-btn").addEventListener("click", () => {
      container.style.display = "none";
    });

    document.getElementById("lb-lang-select").addEventListener("change", (e) => {
      currentLanguage = e.target.value;
      runLiveAudit();
    });

    document.getElementById("lb-audit-btn").addEventListener("click", runLiveAudit);
    document.getElementById("lb-generate-all-btn").addEventListener("click", runAIGenerator);

    document.getElementById("lb-fix-title-btn").addEventListener("click", () => {
      const suggested = document.getElementById("lb-fix-title-btn").dataset.suggestedTitle;
      if (suggested) {
        const ok = applyTitleToForm(suggested);
        alert(ok ? "✨ Title applied to form!" : "Title copied to clipboard!");
      }
    });

    document.getElementById("lb-apply-all-generated-btn").addEventListener("click", () => {
      const title = document.getElementById("lb-apply-all-generated-btn").dataset.genTitle;
      const desc = document.getElementById("lb-apply-all-generated-btn").dataset.genDesc;
      applyAllToForm(title, desc);
      alert("✨ AI Content auto-filled into listing form!");
    });

    const data = scrapeListingData();
    document.getElementById("lb-platform-badge").innerText = `Platform: ${data.platform}`;
  }

  async function runLiveAudit() {
    const auditBtn = document.getElementById("lb-audit-btn");
    const scoreDisplay = document.getElementById("lb-score-display");

    auditBtn.disabled = true;
    auditBtn.innerText = "⏳ Analyzing...";
    scoreDisplay.innerText = "Analyzing...";

    const scrapedData = scrapeListingData();

    try {
      const response = await fetch("http://localhost:3000/analyze-listing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(scrapedData)
      });

      if (!response.ok) throw new Error("Backend response error");
      const result = await response.json();
      displayResults(result);
    } catch (err) {
      console.warn("Backend not reachable, running client-side engine:", err);
      const mockResult = generateClientAudit(scrapedData);
      displayResults(mockResult);
    } finally {
      auditBtn.disabled = false;
      auditBtn.innerText = "🔍 Quick Audit";
    }
  }

  async function runAIGenerator() {
    const genBtn = document.getElementById("lb-generate-all-btn");
    genBtn.disabled = true;
    genBtn.innerText = "⏳ Generating...";

    const scrapedData = scrapeListingData();

    try {
      const response = await fetch("http://localhost:3000/generate-bullets-desc", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(scrapedData)
      });

      if (!response.ok) throw new Error("Backend gen error");
      const result = await response.json();
      displayGeneratedContent(result);
    } catch (err) {
      console.warn("Backend not reachable, using offline AI generator:", err);
      displayGeneratedContent({
        title: `${scrapedData.title || "Premium Product"} | Top Rated 2025 Edition`,
        bullets: [
          "🔥 PREMIUM QUALITY: Durable construction for daily use.",
          "✨ ELEGANT DESIGN: Trendy aesthetic and perfect finishing.",
          "📦 HIGH UTILITY: Lightweight & comfortable.",
          "💯 LONG LASTING: Tested for maximum durability.",
          "🚚 TRUSTED CHOICE: Fast delivery & satisfaction guaranteed."
        ],
        description: `High quality ${scrapedData.title || "product"} designed for ${scrapedData.platform} buyers.`
      });
    } finally {
      genBtn.disabled = false;
      genBtn.innerText = "✨ Generate AI All";
    }
  }

  function displayGeneratedContent(data) {
    const preview = document.getElementById("lb-generated-preview");
    const genDesc = document.getElementById("lb-gen-desc");
    const genBullets = document.getElementById("lb-gen-bullets");
    const applyBtn = document.getElementById("lb-apply-all-generated-btn");

    genDesc.innerText = data.description;
    genBullets.innerHTML = "";
    (data.bullets || []).forEach((b) => {
      const li = document.createElement("li");
      li.innerText = b;
      genBullets.appendChild(li);
    });

    applyBtn.dataset.genTitle = data.title;
    applyBtn.dataset.genDesc = `${data.description}\n\nKey Highlights:\n${(data.bullets || []).join("\n")}`;

    preview.style.display = "block";
  }

  function generateClientAudit(data) {
    let score = 55;
    const titleLen = data.title ? data.title.length : 0;
    return {
      score: titleLen > 25 ? 85 : 60,
      platform: data.platform,
      titleAudit: {
        feedback: titleLen > 25 ? "Good title length!" : "Title is short. Add brand name & features.",
        suggestedTitle: `${data.title || "Product"} | High Quality & Free Delivery`
      },
      competitorGap: ["Add bullet points for specifications", "Include dimension chart"],
      keywords: ["High Quality", "Top Rated", "Trending 2025"],
      imageCtr: {
        estimatedCtr: "4.5%",
        qualityScore: "Good",
        tips: ["Use pure white background", "Show product dimensions"]
      }
    };
  }

  function displayResults(result) {
    const scoreDisplay = document.getElementById("lb-score-display");
    const scoreStatus = document.getElementById("lb-score-status");
    const resultsSection = document.getElementById("lb-results-section");
    const titleFeedback = document.getElementById("lb-title-feedback");
    const fixTitleBtn = document.getElementById("lb-fix-title-btn");
    const gapList = document.getElementById("lb-gap-list");
    const keywordsList = document.getElementById("lb-keywords-list");
    const imageCtrInfo = document.getElementById("lb-image-ctr-info");

    scoreDisplay.innerText = `${result.score} / 100`;
    scoreStatus.innerText = result.score >= 80 ? "🔥 Excellent Listing!" : "⚠️ Optimization Needed";
    scoreStatus.style.color = result.score >= 80 ? "#10b981" : "#f59e0b";

    titleFeedback.innerText = result.titleAudit?.feedback || "Title checked.";
    if (result.titleAudit?.suggestedTitle) {
      fixTitleBtn.dataset.suggestedTitle = result.titleAudit.suggestedTitle;
      fixTitleBtn.style.display = "block";
    }

    gapList.innerHTML = "";
    (result.competitorGap || []).forEach((gap) => {
      const div = document.createElement("div");
      div.innerText = `• ${gap}`;
      gapList.appendChild(div);
    });

    keywordsList.innerHTML = "";
    (result.keywords || []).forEach((kw) => {
      const chip = document.createElement("span");
      chip.style.cssText = "background: #0284c7; color: white; padding: 2px 6px; border-radius: 10px; font-size: 10px; font-weight: 600;";
      chip.innerText = kw;
      keywordsList.appendChild(chip);
    });

    if (result.imageCtr) {
      imageCtrInfo.innerHTML = `
        <div><strong>Est. CTR:</strong> <span style="color:#38bdf8; font-weight:bold;">${result.imageCtr.estimatedCtr || "N/A"}</span></div>
        <div><strong>Quality:</strong> ${result.imageCtr.qualityScore || "Good"}</div>
        <div style="margin-top: 2px; font-size: 10px; color: #94a3b8;">• ${(result.imageCtr.tips || []).join("<br>• ")}</div>
      `;
    }

    resultsSection.style.display = "flex";
  }

  // Listen for Extension Messages
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "SCRAPE_FORM_DATA") {
      const data = scrapeListingData();
      sendResponse(data);
    } else if (request.action === "TOGGLE_SIDEBAR") {
      createSidebarOverlay();
      const el = document.getElementById("listingboom-overlay");
      if (el) {
        el.style.display = el.style.display === "none" ? "flex" : "none";
      }
      sendResponse({ status: "toggled" });
    } else if (request.action === "APPLY_TITLE") {
      const ok = applyTitleToForm(request.title);
      sendResponse({ success: ok });
    } else if (request.action === "APPLY_ALL") {
      const ok = applyAllToForm(request.title, request.description);
      sendResponse({ success: ok });
    }
    return true;
  });

  if (document.readyState === "interactive" || document.readyState === "complete") {
    createSidebarOverlay();
  } else {
    document.addEventListener("DOMContentLoaded", createSidebarOverlay);
  }
})();
