const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Health check route
app.get('/', (req, res) => {
  res.json({ status: 'ok', service: 'ListingBoom AI Enhanced Server', version: '2.0.0' });
});

// Helper for AI Vision & Listing Scoring Engine
function calculateListingAudit(data) {
  const { platform = 'Generic', title = '', description = '', bullets = [], price = '', imageUrls = [], language = 'en' } = data;

  let score = 50;

  // 1. Title Analysis
  const titleLen = title.length;
  let titleFeedback = '';
  let suggestedTitle = title;

  if (titleLen === 0) {
    titleFeedback = language === 'hi'
      ? 'Title missing hai! Brand + Material + Color + Key Benefit include karein.'
      : 'Title missing! Add Brand + Product Type + Color/Size + Key Benefit.';
    suggestedTitle = 'Brand Premium Quality Product - Stylish & Durable Design';
  } else if (titleLen < 30) {
    score += 10;
    titleFeedback = language === 'hi'
      ? 'Title chota hai. Main keywords aur specifications add karein.'
      : 'Title is too short. Include brand name, material, key features, and size/color.';
    suggestedTitle = `${title} - Premium Quality & Durable (Top Rated)`;
  } else if (titleLen >= 30 && titleLen <= 150) {
    score += 25;
    titleFeedback = language === 'hi'
      ? 'Shandar title length aur keywords!'
      : 'Excellent title length and clarity!';
    suggestedTitle = title.includes('|') ? title : `${title} | High Quality & Free Delivery`;
  } else {
    score += 15;
    titleFeedback = language === 'hi'
      ? 'Title thoda lamba hai. Suruaat ke 50 chars me main keyword rakhein.'
      : 'Title is slightly long. Ensure core keywords appear in the first 50 characters.';
    suggestedTitle = title.slice(0, 150);
  }

  // 2. Description & Bullets Audit
  const descLen = description.length;
  let descScore = 10;
  if (descLen > 100 || bullets.length > 0) {
    score += 20;
    descScore = 90;
  } else {
    score += 5;
  }

  // 3. Image CTR & Vision Assessment
  const imgCount = imageUrls.length;
  let ctrEst = '2.5%';
  let imgTips = [];

  if (imgCount === 0) {
    imgTips.push(language === 'hi' ? 'Kam se kam 3 se 5 high quality images upload karein.' : 'Add at least 3 to 5 images to boost click-through rate.');
    imgTips.push(language === 'hi' ? 'Main image me pure white background (RGB 255,255,255) use karein.' : 'Use a crisp white background (RGB 255,255,255) for main product image.');
  } else if (imgCount < 3) {
    score += 10;
    ctrEst = '3.8%';
    imgTips.push(language === 'hi' ? 'Lifestyle aur features ki additional images add karein.' : 'Add secondary lifestyle / feature breakdown images.');
    imgTips.push(language === 'hi' ? 'Product image frame ka 85% area cover kare.' : 'Ensure main image fills at least 85% of the frame.');
  } else {
    score += 20;
    ctrEst = '5.8%';
    imgTips.push(language === 'hi' ? 'Images ki quantity acchi hai!' : 'Great image quantity!');
    imgTips.push(language === 'hi' ? 'Dimensions & size chart image zaroor dalein.' : 'Ensure dimensions / infographic chart is included as last slide.');
  }

  // 4. Platform-Specific Keywords & Competitor Gap
  let keywords = [];
  let competitorGap = [];
  const platLower = platform.toLowerCase();

  if (platLower === 'amazon') {
    keywords = ['Amazon Fulfilled', 'Best Seller', 'Top Rated 2025', 'Premium Material', 'Durable Build'];
    competitorGap = ['Missing A+ Content keywords', 'Include Prime badge features', 'Add dimensions bullet'];
  } else if (platLower === 'flipkart') {
    keywords = ['Assured Quality', 'Trendy Choice', 'Fast Delivery', 'Value for Money', 'Top Brand'];
    competitorGap = ['Highlight Flipkart Assured terms', 'Mention replacement warranty', 'Include exact dimensions'];
  } else if (platLower === 'meesho') {
    keywords = ['Lowest Price', 'Free Delivery', 'Easy Returns', 'Trending Fashion', 'Wholesale Quality'];
    competitorGap = ['Include Cash on Delivery callout', 'Mention easy 7-day return policy', 'Highlight trendy color options'];
  } else {
    keywords = ['High Quality', 'Popular Choice', 'Durable', 'Free Shipping', 'Customer Favorite'];
    competitorGap = ['Add bullet points for key specifications', 'Include care instructions'];
  }

  const finalScore = Math.min(Math.max(score, 20), 99);

  return {
    score: finalScore,
    platform,
    language,
    titleAudit: {
      score: titleLen >= 30 ? 90 : 60,
      feedback: titleFeedback,
      suggestedTitle
    },
    descriptionAudit: {
      score: descScore,
      bulletCount: bullets.length
    },
    keywords,
    competitorGap,
    imageCtr: {
      estimatedCtr: ctrEst,
      imageCount: imgCount,
      qualityScore: imgCount >= 3 ? 'High' : 'Medium',
      tips: imgTips
    }
  };
}

// 1. Full Listing Analysis Endpoint
app.post('/analyze-listing', (req, res) => {
  try {
    const result = calculateListingAudit(req.body);
    return res.json(result);
  } catch (err) {
    console.error('Analysis error:', err);
    res.status(500).json({ error: 'Failed to analyze listing', details: err.message });
  }
});

// 2. AI Generator Endpoint: Auto Generate 5 Bullet Points & SEO Description
app.post('/generate-bullets-desc', (req, res) => {
  try {
    const { title = 'Product', platform = 'Generic', language = 'en' } = req.body;

    const isHi = language === 'hi';

    const bullets = isHi ? [
      `🔥 PREMIUM QUALITY: ${title} ko high-grade durable material se banaya gaya hai.`,
      `✨ TRENDY & ELEGANT DESIGN: Modern look jo daily use aur special occasions dono ke liye perfect hai.`,
      `📦 COMFORT & UTILITY: Compact, lightweight aur aasan use ke sath perfect finishing.`,
      `💯 HIGH DURABILITY: Long-lasting performance aur daily wear & tear resitance.`,
      `🚚 TRUSTED BRAND: Quick delivery, top customer support aur guaranteed satisfaction.`
    ] : [
      `🔥 PREMIUM QUALITY: Built with top-grade, durable materials ensuring long-lasting performance for ${title}.`,
      `✨ ELEGANT & TRENDY DESIGN: Modern aesthetic crafted perfectly for everyday style and high utility.`,
      `📦 MAXIMUM COMFORT & UTILITY: Lightweight, highly functional, and crafted for seamless user experience.`,
      `💯 SUPERIOR DURABILITY: Engineered to withstand daily wear and tear while maintaining brand-new look.`,
      `🚚 TOP RATED ASSURANCE: Trusted quality, backed by fast shipping and dedicated customer support.`
    ];

    const generatedDescription = isHi
      ? `Aapke product listing ko boom karne ke liye ye ultimate ${title} hai! Isme premium material, modern finishing, aur high durability di gayi hai jo customers ko attract karti hai. Best for ${platform} sellers seeking high sales!`
      : `Upgrade your product portfolio with the all-new ${title}! Meticulously designed for unmatched quality, high durability, and maximum aesthetic appeal. Ideal for buyers looking for value, style, and top-tier performance on ${platform}.`;

    return res.json({
      title: isHi ? `${title} | Premium Quality & Top Rated (Trending 2025)` : `${title} | Premium Quality & Top Rated (2025 Edition)`,
      bullets,
      description: generatedDescription,
      platform
    });
  } catch (err) {
    console.error('Generation error:', err);
    res.status(500).json({ error: 'Failed to generate content', details: err.message });
  }
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`ListingBoom AI Enhanced Server running on port ${PORT}`);
  });
}

module.exports = app;
