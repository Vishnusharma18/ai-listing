# ⚡ ListingBoom AI - Instant Product Listing AI Assistant

ListingBoom AI is a Chrome Extension (Manifest V3) and Express Node.js Backend service designed for sellers on **Amazon India**, **Flipkart Seller Hub**, and **Meesho Supplier Panel**. It automatically evaluates product listings, provides real-time quality scores, CTR image audits, trending keyword suggestions, and one-click title optimization.

---

## 📁 Repository Structure

```
.
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

## 🚀 Setup Instructions

### 1. Backend API Server Setup

1. Open your terminal and navigate to the `backend` directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Run the automated test suite to ensure server components are functioning properly:
   ```bash
   npm test
   ```

4. Start the backend server:
   ```bash
   npm start
   ```
   The backend server will run at `http://localhost:3000`.

---

### 2. Chrome Extension Setup

1. Open Google Chrome and navigate to `chrome://extensions/`.
2. Enable **Developer mode** using the toggle switch in the top right corner.
3. Click the **Load unpacked** button in the top left corner.
4. Select the root folder of this repository (the folder containing `manifest.json`).
5. The **ListingBoom AI** extension will now be installed in Chrome!

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

---

## 🧪 Testing Backend API

To manually test the backend analysis endpoint via `curl`:

```bash
curl -X POST http://localhost:3000/analyze-listing \
  -H "Content-Type: application/json" \
  -d '{
    "platform": "Amazon",
    "title": "Wireless Bluetooth Earbuds",
    "description": "High quality noise cancelling earbuds with fast charging case.",
    "bullets": ["Bluetooth 5.3", "IPX5 Waterproof"],
    "price": "999",
    "imageUrls": ["https://example.com/img1.jpg", "https://example.com/img2.jpg"]
  }'
```
