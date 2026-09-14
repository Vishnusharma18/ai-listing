document.addEventListener('DOMContentLoaded', () => {
  const platformStatus = document.getElementById('platform-status');
  const analyzeBtn = document.getElementById('analyze-btn');

  // Active Tab Platform Detection
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const url = tabs[0]?.url || '';
    if (url.includes('amazon')) {
      platformStatus.innerText = 'Amazon';
    } else if (url.includes('flipkart')) {
      platformStatus.innerText = 'Flipkart';
    } else if (url.includes('meesho')) {
      platformStatus.innerText = 'Meesho';
    } else {
      platformStatus.innerText = 'Unknown Site';
      platformStatus.style.background = '#64748b';
    }
  });

  // Fast Audit Click
  analyzeBtn.addEventListener('click', () => {
    document.getElementById('listing-score').innerText = 'Analyzing...';
    
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      chrome.tabs.sendMessage(tabs[0].id, { action: "SCRAPE_FORM_DATA" }, (response) => {
        if (response) {
          console.log("Scraped Data:", response);
          // Backend API Call processing will happen here
          document.getElementById('listing-score').innerText = '85 / 100';
        }
      });
    });
  });
});