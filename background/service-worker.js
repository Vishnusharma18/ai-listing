// Extension Lifecycle & Background Communication Handler
chrome.runtime.onInstalled.addListener(() => {
  console.log("ListingBoom AI Extension Installed Successfully.");
});

// Handle messages from Popup or Content Script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "ANALYZE_VIA_BACKEND") {
    fetch("http://localhost:3000/analyze-listing", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request.payload)
    })
      .then((res) => res.json())
      .then((data) => sendResponse({ success: true, data }))
      .catch((err) => sendResponse({ success: false, error: err.message }));

    return true; // Keeps messaging channel open for async response
  }
});
