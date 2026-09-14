# ⚡ ListingBoom AI Pro - Product Listing AI Assistant & Vision Auditor

**ListingBoom AI Pro** is a high-performance Chrome Extension (Manifest V3) and Express Node.js Backend service tailored for sellers on **Amazon India**, **Flipkart Seller Hub**, and **Meesho Supplier Panel**.

It provides real-time listing quality scoring, Vision CTR image auditing, competitor gap analysis, Hinglish/English language toggle, and **1-click auto-fill AI content generation** (5 SEO bullet points + product description).

---

## ⚡ Quick Start (1-Command Launch)

Start the entire backend AI service automatically with a single command from the root directory:

```bash
npm start
```

This command will automatically install dependencies and launch the server on `http://localhost:3000`.

To run the automated backend test suite:
```bash
npm test
```

---

## 🌐 Chrome Extension Setup

1. Open Google Chrome and go to `chrome://extensions/`.
2. Enable **Developer mode** using the toggle switch in the top right corner.
3. Click **Load unpacked** in the top left corner and select this repository folder (where `manifest.json` is located).
4. **Done!** Open any listing form on Amazon, Flipkart, or Meesho to start auditing.

---

## 🔥 Key Features

1. **Sleek Tabbed Extension UI**:
   - **🔍 Audit Tab**: Scrapes listing fields and generates instant score (0-100) with score progress ring and title suggestions.
   - **✨ AI Gen Tab**: Generates 5 SEO bullet points and a high-converting description in 1-Click.
   - **🔥 Trends Tab**: Displays platform-specific trending keywords and Vision CTR predictions.

2. **Injected Live Floating Sidebar Overlay**:
   - Injected directly into seller panel listing forms.
   - Includes **Hinglish / English** language selector.
   - Includes **"✨ Auto-Apply Best Title"** and **"⚡ Auto-Fill Generated Content"** buttons to write directly into product inputs and rich-text editors.

3. **Offline Evaluation Engine**:
   - Even if the local backend server is temporarily offline, the content script and popup automatically use built-in client-side fallback engines.

---

## 📁 Repository Structure

```
.
├── package.json              # Root runner (`npm start` & `npm test`)
├── backend/                  # Express.js API Server
│   ├── package.json
│   ├── server.js            # Endpoints: /analyze-listing & /generate-bullets-desc
│   └── test.js              # Automated test suite
├── background/               # Service worker extension lifecycle script
│   └── service-worker.js
├── content/                  # Active DOM scraper & injected overlay sidebar
│   └── content-script.js
├── popup/                    # Tabbed popup UI interface
│   ├── popup.html
│   └── popup.js
├── manifest.json             # Manifest V3 extension configuration
├── PROJECT_TRACKER.md        # Roadmap & phase tracker
└── README.md                 # Setup & User Guide
```

---

## 🧪 Testing Backend API Manually

```bash
# Test Listing Analysis
curl -X POST http://localhost:3000/analyze-listing \
  -H "Content-Type: application/json" \
  -d '{
    "platform": "Amazon",
    "title": "Wireless Earbuds Bluetooth 5.3",
    "language": "hi",
    "imageUrls": ["https://example.com/img1.jpg", "https://example.com/img2.jpg"]
  }'

# Test AI Content Generator
curl -X POST http://localhost:3000/generate-bullets-desc \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Smart Watch Series 9",
    "platform": "Flipkart",
    "language": "en"
  }'
```
