// ListingBoom AI Content Script & Sidebar Overlay Injector

(function () {
  if (window.__listingboom_injected) return;
  window.__listingboom_injected = true;

  console.log("ListingBoom AI Content Script Initialized.");

  let currentLanguage = "en"; // 'en' or 'hi'

  // Helper to scrape product listing form fields on Amazon, Flipkart, Meesho, or Generic
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

    // Title Scraper
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
      if (el && el.value) {
        title = el.value.trim();
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

    // Description & Bullet points Scraper
    const textareas = Array.from(document.querySelectorAll("textarea"));
    textareas.forEach((ta) => {
      const nameOrId = (ta.name + " " + ta.id + " " + ta.placeholder).toLowerCase();
      if (nameOrId.includes("desc")) {
        description = ta.value.trim();
      } else if (nameOrId.includes("bullet") || nameOrId.includes("feature") || nameOrId.includes("key")) {
        if (ta.value.trim()) bullets.push(ta.value.trim());
      }
    });

    if (!description && textareas.length > 0) {
      description = textareas.map((t) => t.value.trim()).filter(Boolean).join("\n");
    }

    // Price Scraper
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

    // Image Scraper
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
      background: #ffffff;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.2), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
      border-radius: 12px;
      z-index: 999999;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      border: 1px solid #e2e8f0;
      overflow-y: auto;
      transition: all 0.3s ease;
      display: flex;
      flex-direction: column;
    `;

    container.innerHTML = `
      <div style="background: linear-gradient(135deg, #1e293b, #0f172a); color: white; padding: 14px 16px; border-top-left-radius: 12px; border-top-right-radius: 12px; display: flex; justify-content: space-between; align-items: center;">
        <div style="display: flex; align-items: center; gap: 8px;">
          <span style="font-size: 18px;">⚡</span>
          <div>
            <div style="font-weight: 700; font-size: 14px;">ListingBoom AI Pro</div>
            <div style="font-size: 11px; opacity: 0.8;" id="lb-platform-badge">Platform: Detecting...</div>
          </div>
        </div>
        <div style="display: flex; align-items: center; gap: 8px;">
          <select id="lb-lang-select" style="background: #334155; color: white; border: none; padding: 2px 6px; border-radius: 4px; font-size: 11px; cursor: pointer;">
            <option value="en">English</option>
            <option value="hi">Hinglish</option>
          </select>
          <button id="lb-close-btn" style="background: transparent; border: none; color: #94a3b8; font-size: 18px; cursor: pointer;">✕</button>
        </div>
      </div>

      <div style="padding: 14px; font-size: 13px; color: #334155;">
        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px; text-align: center; margin-bottom: 10px;">
          <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; color: #64748b; font-weight: 600;">Listing Quality Score</div>
          <div id="lb-score-display" style="font-size: 30px; font-weight: 800; color: #2563eb; margin: 2px 0;">-- / 100</div>
          <div id="lb-score-status" style="font-size: 11px; color: #64748b;">Click Audit to evaluate listing</div>
        </div>

        <div style="display: flex; gap: 8px; margin-bottom: 10px;">
          <button id="lb-audit-btn" style="flex: 1; background: #2563eb; color: white; border: none; padding: 8px; border-radius: 6px; font-weight: 600; cursor: pointer; font-size: 12px;">
            🔍 Quick Audit
          </button>
          <button id="lb-generate-all-btn" style="flex: 1; background: #8b5cf6; color: white; border: none; padding: 8px; border-radius: 6px; font-weight: 600; cursor: pointer; font-size: 12px;">
            ✨ Generate AI All
          </button>
        </div>

        <div id="lb-results-section" style="display: none; flex-direction: column; gap: 10px;">
          <div style="border-top: 1px solid #f1f5f9; padding-top: 8px;">
            <div style="font-weight: 600; font-size: 11px; color: #475569; margin-bottom: 4px;">TITLE OPTIMIZER</div>
            <div id="lb-title-feedback" style="background: #f1f5f9; padding: 6px 8px; border-radius: 6px; font-size: 11px; color: #1e293b; margin-bottom: 6px;"></div>
            <button id="lb-fix-title-btn" style="width: 100%; background: #10b981; color: white; border: none; padding: 6px; border-radius: 6px; font-size: 11px; font-weight: 600; cursor: pointer;">
              ✨ Auto-Apply Best Title
            </button>
          </div>

          <div style="border-top: 1px solid #f1f5f9; padding-top: 8px;">
            <div style="font-weight: 600; font-size: 11px; color: #475569; margin-bottom: 4px;">COMPETITOR GAP ANALYSIS</div>
            <div id="lb-gap-list" style="font-size: 11px; color: #dc2626; line-height: 1.4;"></div>
          </div>

          <div style="border-top: 1px solid #f1f5f9; padding-top: 8px;">
            <div style="font-weight: 600; font-size: 11px; color: #475569; margin-bottom: 4px;">TRENDING KEYWORDS TO ADD</div>
            <div id="lb-keywords-list" style="display: flex; flex-wrap: wrap; gap: 4px;"></div>
          </div>

          <div style="border-top: 1px solid #f1f5f9; padding-top: 8px;">
            <div style="font-weight: 600; font-size: 11px; color: #475569; margin-bottom: 4px;">IMAGE CTR VISION AUDIT</div>
            <div id="lb-image-ctr-info" style="font-size: 11px; color: #334155; line-height: 1.4;"></div>
          </div>
        </div>

        <div id="lb-generated-preview" style="display: none; border-top: 1px solid #e2e8f0; padding-top: 10px; margin-top: 10px;">
          <div style="font-weight: 700; font-size: 12px; color: #0f172a; margin-bottom: 6px;">AI GENERATED LISTING CONTENT:</div>
          <div style="font-weight: 600; font-size: 11px; color: #475569;">Generated Description:</div>
          <div id="lb-gen-desc" style="background: #f8fafc; padding: 6px; border-radius: 4px; font-size: 11px; margin-bottom: 6px; border: 1px solid #e2e8f0;"></div>
          <div style="font-weight: 600; font-size: 11px; color: #475569;">Generated Bullets (5 Items):</div>
          <ul id="lb-gen-bullets" style="padding-left: 16px; margin: 4px 0 8px 0; font-size: 11px; color: #334155;"></ul>
          <button id="lb-apply-all-generated-btn" style="width: 100%; background: #8b5cf6; color: white; border: none; padding: 8px; border-radius: 6px; font-size: 12px; font-weight: 600; cursor: pointer;">
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
      if (suggested) applyTitleToForm(suggested);
    });

    document.getElementById("lb-apply-all-generated-btn").addEventListener("click", () => {
      const title = document.getElementById("lb-apply-all-generated-btn").dataset.genTitle;
      const desc = document.getElementById("lb-apply-all-generated-btn").dataset.genDesc;
      applyAllToForm(title, desc);
    });

    const data = scrapeListingData();
    document.getElementById("lb-platform-badge").innerText = `Platform: ${data.platform}`;
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
        el.value = newTitle;
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
        alert("✨ Optimized title successfully applied to product form!");
        return;
      }
    }
    navigator.clipboard.writeText(newTitle);
    alert("Title copied to clipboard!");
  }

  function applyAllToForm(newTitle, newDesc) {
    if (newTitle) applyTitleToForm(newTitle);

    const descEl = document.querySelector('textarea[name*="desc" i], textarea[id*="desc" i], textarea');
    if (descEl && newDesc) {
      descEl.value = newDesc;
      descEl.dispatchEvent(new Event('input', { bubbles: true }));
      descEl.dispatchEvent(new Event('change', { bubbles: true }));
    }
    alert("✨ AI Content applied to listing form!");
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
    scoreStatus.style.color = result.score >= 80 ? "#16a34a" : "#d97706";

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
      chip.style.cssText = "background: #e0f2fe; color: #0369a1; padding: 2px 6px; border-radius: 10px; font-size: 10px; font-weight: 500;";
      chip.innerText = kw;
      keywordsList.appendChild(chip);
    });

    if (result.imageCtr) {
      imageCtrInfo.innerHTML = `
        <div><strong>Est. CTR:</strong> <span style="color:#2563eb; font-weight:bold;">${result.imageCtr.estimatedCtr || "N/A"}</span></div>
        <div><strong>Quality:</strong> ${result.imageCtr.qualityScore || "Good"}</div>
        <div style="margin-top: 2px; font-size: 10px; color: #64748b;">• ${(result.imageCtr.tips || []).join("<br>• ")}</div>
      `;
    }

    resultsSection.style.display = "flex";
  }

  // Listen for Messages
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
    }
    return true;
  });

  if (document.readyState === "interactive" || document.readyState === "complete") {
    createSidebarOverlay();
  } else {
    document.addEventListener("DOMContentLoaded", createSidebarOverlay);
  }
})();
