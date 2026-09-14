// ListingBoom AI Content Script & Sidebar Overlay Injector Pro

(function () {
  if (window.__listingboom_injected) return;
  window.__listingboom_injected = true;

  console.log("ListingBoom AI Pro Content Script Loaded.");

  let currentLanguage = "en";

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
            <div style="font-weight: 800; font-size: 13px; color: #38bdf8;">Listing Copilot Pro</div>
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
          <div style="font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px; color: #94a3b8; font-weight: 700;">Listing Readiness Score</div>
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
            <div style="font-weight: 700; font-size: 10px; color: #f59e0b; margin-bottom: 4px; text-transform: uppercase;">🔥 TOP ACTIONS RIGHT NOW</div>
            <div id="lb-top-actions" style="font-size: 11px; color: #f8fafc; line-height: 1.4;"></div>
          </div>

          <div style="background: #1e293b; border: 1px solid #334155; padding: 8px; border-radius: 6px;">
            <div style="font-weight: 700; font-size: 10px; color: #38bdf8; margin-bottom: 4px; text-transform: uppercase;">TITLE QUALITY</div>
            <div id="lb-title-feedback" style="color: #cbd5e1; font-size: 11px; margin-bottom: 6px;"></div>
            <button id="lb-fix-title-btn" style="width: 100%; background: #10b981; color: white; border: none; padding: 6px; border-radius: 6px; font-size: 11px; font-weight: 700; cursor: pointer;">
              ✨ Auto-Apply Best Title
            </button>
          </div>

          <div style="background: #1e293b; border: 1px solid #334155; padding: 8px; border-radius: 6px;">
            <div style="font-weight: 700; font-size: 10px; color: #38bdf8; margin-bottom: 4px; text-transform: uppercase;">OBSERVED KEYWORDS</div>
            <div id="lb-keywords-list" style="display: flex; flex-wrap: wrap; gap: 4px;"></div>
          </div>

          <div style="background: #1e293b; border: 1px solid #334155; padding: 8px; border-radius: 6px;">
            <div style="font-weight: 700; font-size: 10px; color: #38bdf8; margin-bottom: 4px; text-transform: uppercase;">IMAGE OPTIMIZATION READINESS</div>
            <div id="lb-image-readiness-info" style="font-size: 11px; color: #cbd5e1; line-height: 1.4;"></div>
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
      if (suggested && window.PlatformAdapters) {
        const ok = window.PlatformAdapters.applyTitle(suggested);
        alert(ok ? "✨ Title applied to form!" : "Title copied to clipboard!");
      }
    });

    document.getElementById("lb-apply-all-generated-btn").addEventListener("click", () => {
      const title = document.getElementById("lb-apply-all-generated-btn").dataset.genTitle;
      const desc = document.getElementById("lb-apply-all-generated-btn").dataset.genDesc;
      if (window.PlatformAdapters) {
        window.PlatformAdapters.applyAll(title, desc);
        alert("✨ AI Content auto-filled into listing form!");
      }
    });

    const data = window.PlatformAdapters ? window.PlatformAdapters.scrape() : {};
    document.getElementById("lb-platform-badge").innerText = `Platform: ${data.platform || "Detecting..."}`;
  }

  async function runLiveAudit() {
    const auditBtn = document.getElementById("lb-audit-btn");
    const scoreDisplay = document.getElementById("lb-score-display");

    auditBtn.disabled = true;
    auditBtn.innerText = "⏳ Analyzing...";
    scoreDisplay.innerText = "Analyzing...";

    const scrapedData = window.PlatformAdapters ? window.PlatformAdapters.scrape() : {};
    scrapedData.language = currentLanguage;

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
      console.warn("Backend offline, running fallback audit:", err);
      const fallbackResult = generateClientAudit(scrapedData);
      displayResults(fallbackResult);
    } finally {
      auditBtn.disabled = false;
      auditBtn.innerText = "🔍 Quick Audit";
    }
  }

  async function runAIGenerator() {
    const genBtn = document.getElementById("lb-generate-all-btn");
    genBtn.disabled = true;
    genBtn.innerText = "⏳ Generating...";

    const scrapedData = window.PlatformAdapters ? window.PlatformAdapters.scrape() : {};
    scrapedData.language = currentLanguage;

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
      console.warn("Backend offline, using fallback AI generator:", err);
      displayGeneratedContent({
        title: `${scrapedData.title || "Product"} - Quality Assured & Durable Design`,
        bullets: [
          "MATERIAL & BUILD: Crafted with durable quality materials.",
          "DESIGN & FIT: Modern aesthetic engineered for daily utility.",
          "EASY MAINTENANCE: Designed for long service life.",
          "PERFORMANCE: Tested for reliability.",
          "PACKAGING: Secure packaging for safe transit."
        ],
        description: `Upgrade your listing with ${scrapedData.title || "this item"}. Carefully engineered for everyday comfort and utility.`
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
    if (titleLen > 25) score += 20;
    if (data.description && data.description.length > 50) score += 15;
    if (data.imageUrls && data.imageUrls.length >= 2) score += 10;

    return {
      listingReadinessScore: Math.min(score, 95),
      platform: data.platform,
      topActions: [
        "Expand title with brand, size, or key specifications.",
        "Upload secondary product images (3+ gallery images recommended)."
      ],
      titleAnalysis: {
        score: titleLen > 25 ? 85 : 55,
        feedback: titleLen > 25 ? "Good title length." : "Title is short. Add key product attributes.",
        suggestedTitle: `${data.title || "Product"} - Quality Assured & Durable Design`
      },
      observedKeywords: ["High Quality", "Durable", "Best Value"],
      imageAnalysis: {
        readinessScore: data.imageUrls && data.imageUrls.length >= 3 ? 85 : 50,
        imageCount: data.imageUrls ? data.imageUrls.length : 0,
        recommendations: ["Main image should have a clean white background.", "Add size infographic or lifestyle image."]
      }
    };
  }

  function displayResults(result) {
    const scoreDisplay = document.getElementById("lb-score-display");
    const scoreStatus = document.getElementById("lb-score-status");
    const resultsSection = document.getElementById("lb-results-section");
    const topActionsDiv = document.getElementById("lb-top-actions");
    const titleFeedback = document.getElementById("lb-title-feedback");
    const fixTitleBtn = document.getElementById("lb-fix-title-btn");
    const keywordsList = document.getElementById("lb-keywords-list");
    const imageReadinessInfo = document.getElementById("lb-image-readiness-info");

    const score = result.listingReadinessScore || result.score || 50;
    scoreDisplay.innerText = `${score} / 100`;
    scoreStatus.innerText = score >= 80 ? "🔥 High Listing Readiness!" : "⚠️ Optimization Opportunities Found";
    scoreStatus.style.color = score >= 80 ? "#10b981" : "#f59e0b";

    topActionsDiv.innerHTML = "";
    (result.topActions || []).forEach((action) => {
      const div = document.createElement("div");
      div.innerText = `• ${action}`;
      topActionsDiv.appendChild(div);
    });

    titleFeedback.innerText = result.titleAnalysis?.feedback || "Title analyzed.";
    if (result.titleAnalysis?.suggestedTitle) {
      fixTitleBtn.dataset.suggestedTitle = result.titleAnalysis.suggestedTitle;
      fixTitleBtn.style.display = "block";
    }

    keywordsList.innerHTML = "";
    (result.observedKeywords || result.keywords || []).forEach((kw) => {
      const chip = document.createElement("span");
      chip.style.cssText = "background: #0284c7; color: white; padding: 2px 6px; border-radius: 10px; font-size: 10px; font-weight: 600;";
      chip.innerText = kw;
      keywordsList.appendChild(chip);
    });

    if (result.imageAnalysis) {
      imageReadinessInfo.innerHTML = `
        <div><strong>Image Optimization Readiness:</strong> <span style="color:#38bdf8; font-weight:bold;">${result.imageAnalysis.readinessScore || 60}/100</span></div>
        <div><strong>Image Count:</strong> ${result.imageAnalysis.imageCount || 0} images</div>
        <div style="margin-top: 2px; font-size: 10px; color: #94a3b8;">• ${(result.imageAnalysis.recommendations || []).join("<br>• ")}</div>
      `;
    }

    resultsSection.style.display = "flex";
  }

  // Listen for Messages
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "SCRAPE_FORM_DATA") {
      const data = window.PlatformAdapters ? window.PlatformAdapters.scrape() : {};
      sendResponse(data);
    } else if (request.action === "TOGGLE_SIDEBAR") {
      createSidebarOverlay();
      const el = document.getElementById("listingboom-overlay");
      if (el) {
        el.style.display = el.style.display === "none" ? "flex" : "none";
      }
      sendResponse({ status: "toggled" });
    } else if (request.action === "APPLY_TITLE") {
      const ok = window.PlatformAdapters ? window.PlatformAdapters.applyTitle(request.title) : false;
      sendResponse({ success: ok });
    } else if (request.action === "APPLY_ALL") {
      const ok = window.PlatformAdapters ? window.PlatformAdapters.applyAll(request.title, request.description) : false;
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
