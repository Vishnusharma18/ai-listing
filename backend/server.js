const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Health check route
app.get('/', (req, res) => {
  res.json({ status: 'ok', service: 'ListingBoom AI Server', version: '1.0.0' });
});

// Listing Analysis Endpoint
app.post('/analyze-listing', async (req, res) => {
  try {
    const { platform = 'Generic', title = '', description = '', bullets = [], price = '', imageUrls = [] } = req.body;

    let score = 50;

    // 1. Title Evaluation
    const titleLen = title.length;
    let titleFeedback = '';
    let suggestedTitle = title;

    if (titleLen === 0) {
      titleFeedback = 'Missing title. Add a clear title containing Brand + Product Type + Color/Size + Key Benefit.';
      suggestedTitle = 'Brand Premium Quality Product - Stylish & Durable Design';
    } else if (titleLen < 30) {
      score += 10;
      titleFeedback = 'Title is too short. Include brand name, material, key features, and size/color.';
      suggestedTitle = `${title} - Premium Quality & Durable (Top Rated)`;
    } else if (titleLen >= 30 && titleLen <= 150) {
      score += 25;
      titleFeedback = 'Excellent title length and clarity!';
      suggestedTitle = title.includes('|') ? title : `${title} | High Quality & Free Delivery`;
    } else {
      score += 15;
      titleFeedback = 'Title is slightly long. Ensure core keywords appear in the first 50 characters.';
      suggestedTitle = title.slice(0, 150);
    }

    // 2. Description & Bullets Evaluation
    const descLen = description.length;
    let descScore = 10;
    if (descLen > 100 || bullets.length > 0) {
      score += 20;
      descScore = 90;
    } else {
      score += 5;
    }

    // 3. Image CTR & Vision Evaluation
    let imageScore = 10;
    const imgCount = imageUrls.length;
    let ctrEst = '2.5%';
    let imgTips = [];

    if (imgCount === 0) {
      imgTips.push('Add at least 3 to 5 images to boost click-through rate.');
      imgTips.push('Use a crisp white background (RGB 255,255,255) for main product image.');
    } else if (imgCount < 3) {
      score += 10;
      ctrEst = '3.8%';
      imgTips.push('Add secondary lifestyle / feature breakdown images.');
      imgTips.push('Ensure main image fills at least 85% of the frame.');
    } else {
      score += 20;
      ctrEst = '5.4%';
      imgTips.push('Great image quantity!');
      imgTips.push('Ensure dimensions / infographic chart is included as last slide.');
    }

    // 4. Trending Keyword Generation based on platform
    let keywords = [];
    if (platform.toLowerCase() === 'amazon') {
      keywords = ['Amazon Fulfilled', 'Best Seller', 'Top Rated 2025', 'Premium Material', 'Durable Build'];
    } else if (platform.toLowerCase() === 'flipkart') {
      keywords = ['Assured Quality', 'Trendy Choice', 'Fast Delivery', 'Value for Money', 'Top Brand'];
    } else if (platform.toLowerCase() === 'meesho') {
      keywords = ['Lowest Price', 'Free Delivery', 'Easy Returns', 'Trending Fashion', 'Wholesale Quality'];
    } else {
      keywords = ['High Quality', 'Popular Choice', 'Durable', 'Free Shipping', 'Customer Favorite'];
    }

    const finalScore = Math.min(Math.max(score, 20), 99);

    return res.json({
      score: finalScore,
      platform,
      titleAudit: {
        score: titleLen >= 30 ? 90 : 60,
        feedback: titleFeedback,
        suggestedTitle: suggestedTitle
      },
      descriptionAudit: {
        score: descScore,
        bulletCount: bullets.length
      },
      keywords,
      imageCtr: {
        estimatedCtr: ctrEst,
        imageCount: imgCount,
        qualityScore: imgCount >= 3 ? 'High' : 'Medium',
        tips: imgTips
      }
    });
  } catch (err) {
    console.error('Analysis error:', err);
    res.status(500).json({ error: 'Failed to analyze listing', details: err.message });
  }
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`ListingBoom AI Server running on port ${PORT}`);
  });
}

module.exports = app;
