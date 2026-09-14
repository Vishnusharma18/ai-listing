// Scrape Title, Description, Images from active tab listing forms
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "SCRAPE_FORM_DATA") {
    
    // Generic draft data extractor
    const pageTitle = document.title;
    const inputs = Array.from(document.querySelectorAll('input[type="text"], textarea')).map(i => i.value);
    const images = Array.from(document.querySelectorAll('img')).map(img => img.src).slice(0, 5);

    sendResponse({
      pageTitle: pageTitle,
      inputValues: inputs.filter(val => val.trim().length > 0),
      imageUrls: images
    });
  }
  return true;
});