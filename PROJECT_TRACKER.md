# 🚀 Product Listing AI Extension - Project Tracker

## 📌 Project Overview
* **Goal:** Real-time AI Assistant Chrome Extension jo Meesho, Flipkart, aur Amazon par product listing karte samay fast suggestions, CTR image audit, trending keywords, aur listing quality score de.
* **Key Target:** Seller ko Fast & Automated listing review dena taaki bina manual research ke product boom kare.

---

## 🛠 Tech Stack
* **Frontend/Extension:** Chrome Extension Manifest V3 (Vanilla JS / Tailwind)
* **Backend/AI:** Node.js (Express) + Google Gemini / OpenAI Vision API
* **Target Platforms:** Amazon India, Flipkart Seller Hub, Meesho Supplier Panel

---

## 📋 Features Checklist & Roadmap

### Phase 1: Core Extension Framework (Current Phase)
- [x] Folder structure & Manifest V3 setup
- [x] Popup UI setup
- [x] Project Tracker file creation
- [ ] Active Page DOM Scraper (Fetch current Title, Description, Image URLs from Active Tab)

### Phase 2: AI Backend & Vision Scoring
- [ ] Fast Backend API Endpoint (`/analyze-listing`)
- [ ] Image Quality & CTR Predictor (Vision API Integration)
- [ ] Trending Keyword Injector & Competitor Gap Analysis

### Phase 3: Real-Time UI Overlay
- [ ] Sidebar Overlay directly on Seller Panels
- [ ] One-Click "Auto-Enhance Title" & "Fix Image" Suggestions

---

## 🛑 Last Left Off Status
* **Status:** Initial Extension Skeleton Created (`manifest.json`, `popup.html`, `popup.js`, `service-worker.js`).
* **Next Step:** Active DOM scrapers test karna Amazon/Flipkart/Meesho listing forms par.
