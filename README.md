# ⚡ ListingBoom AI - Instant Product Listing AI Assistant

ListingBoom AI is a Chrome Extension (Manifest V3) and Express Node.js Backend service designed for sellers on **Amazon India**, **Flipkart Seller Hub**, and **Meesho Supplier Panel**. It automatically evaluates product listings, provides real-time quality scores, CTR image audits, trending keyword suggestions, and one-click title optimization.

---

## ⚡ Quick Start (1-Command Run)

Run this single command from the root folder to start everything automatically:

```bash
npm start
```

This command will automatically install all backend dependencies and start the backend AI server at `http://localhost:3000`.

To run backend automated tests with one command:
```bash
npm test
```

---

## 🌐 Chrome Extension Setup (1-Time Step)

1. Open Google Chrome and go to `chrome://extensions/`.
2. Enable **Developer mode** (toggle switch in the top right corner).
3. Click **Load unpacked** (top left corner) and select this project folder (where `manifest.json` is located).
4. Done! **ListingBoom AI** is ready to use on Amazon, Flipkart, and Meesho seller pages.

---

## 📁 Repository Structure

```
.
├── package.json              # Single command runner script (`npm start`)
├── backend/                  # Node.js Express API Server
│   ├── package.json
│   ├── server.js            # Main backend server (/analyze-listing)
│   └── test.js              # API test suite
├── background/               # Chrome Extension Background Service Worker
│   └── service-worker.js
├── content/                  # Extension Content Script & Sidebar Overlay
│   └── content-script.js
├── popup/                    # Extension Popup Interface
│   ├── popup.html
│   └── popup.js
├── manifest.json             # Extension Manifest V3 configuration
├── PROJECT_TRACKER.md        # Feature tracking and roadmap
└── README.md                 # Setup and Usage Guide
```

---

## 🛠 Features & Usage

1. **Active Page DOM Scraper & Instant Audit**:
   - Open any product listing page on Amazon, Flipkart, Meesho, or generic seller panels.
   - Click the **ListingBoom AI** extension icon in your toolbar and press **⚡ Quick Audit Active Tab**.

2. **Real-Time Floating Sidebar Overlay**:
   - The extension automatically injects an overlay sidebar directly onto seller panel listing pages.
   - Click **🔍 Audit Live Listing Page** in the sidebar to run a scan.
   - Click **✨ Auto-Apply Best Title** to instantly fill the optimized title into the product form!

3. **Offline Fallback Engine**:
   - If the local backend server is not running, the content script and popup automatically fall back to an internal client-side evaluation engine.
