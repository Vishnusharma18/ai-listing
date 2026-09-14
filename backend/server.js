const express = require('express');
const cors = require('cors');
require('dotenv').config();

const aiProvider = require('./services/aiProvider');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '2mb' }));

// Health Check
app.get('/', (req, res) => {
  res.json({
    status: 'ok',
    service: 'AI Listing Copilot Backend',
    version: '3.0.0'
  });
});

// Listing Analyzer Engine
function analyzeListingQuality(data) {
  const {
    platform = 'Generic',
    title = '',
    description = '',
    bullets = [],
    price = '',
    imageUrls = [],
    brand = '',
    material = '',
    category = ''
  } = data;

  const issues = [];
  const topActions = [];

  // 1. Title Evaluation
  const titleLen = title.length;
  let titleScore = 40;
  if (titleLen === 0) {
    issues.push({ field: 'title', level: 'HIGH', message: 'Title is missing.' });
    topActions.push('Add a clear product title including Brand + Product Type + Key Specification.');
  } else if (titleLen < 30) {
    titleScore = 65;
    issues.push({ field: 'title', level: 'MEDIUM', message: 'Title is too short (< 30 chars) and may lack key search terms.' });
    topActions.push('Expand title with key attributes (e.g., material, size, model, or color).');
  } else if (titleLen >= 30 && titleLen <= 150) {
    titleScore = 95;
  } else {
    titleScore = 75;
    issues.push({ field: 'title', level: 'LOW', message: 'Title exceeds 150 characters; ensure core keyword is in first 50 chars.' });
  }

  // 2. Content & Bullets Evaluation
  let contentScore = 30;
  const bulletCount = bullets.length;
  if (bulletCount >= 5 && description.length > 100) {
    contentScore = 95;
  } else if (bulletCount >= 3 || description.length > 50) {
    contentScore = 70;
    topActions.push('Add at least 5 structured bullet points highlighting key specifications.');
  } else {
    issues.push({ field: 'content', level: 'HIGH', message: 'Incomplete product details and bullet points.' });
    topActions.push('Add comprehensive bullet points and product description.');
  }

  // 3. Image Optimization Readiness (Honest Quality Score)
  const imageCount = imageUrls.length;
  let imageScore = 30;
  const imageTips = [];

  if (imageCount === 0) {
    issues.push({ field: 'images', level: 'HIGH', message: 'No product images detected.' });
    imageTips.push('Upload at least 3-5 product images.');
    imageTips.push('Main image should have a clean white background.');
  } else if (imageCount < 3) {
    imageScore = 60;
    imageTips.push('Add secondary gallery images (e.g. lifestyle, close-up, or size infographic).');
    imageTips.push('Ensure main image fills 85%+ of frame area.');
  } else {
    imageScore = 90;
    imageTips.push('Good image count! Consider adding a size/dimension chart if applicable.');
  }

  // 4. Listing Readiness Score Calculation (Weighted)
  const overallScore = Math.round((titleScore * 0.35) + (contentScore * 0.35) + (imageScore * 0.30));

  // 5. Keyword Suggestions
  const derivedKeywords = Array.from(new Set([
    ...title.split(/\s+/).filter(w => w.length > 3),
    category,
    brand,
    material
  ].filter(Boolean)));

  return {
    listingReadinessScore: overallScore,
    platform,
    funnelFocus: overallScore < 60 ? 'Visibility & CTR' : 'Conversion & Clarity',
    topActions: topActions.slice(0, 3),
    scores: {
      titleQuality: titleScore,
      contentQuality: contentScore,
      imageReadiness: imageScore
    },
    titleAnalysis: {
      length: titleLen,
      score: titleScore,
      suggestedTitle: titleLen > 0 ? `${title} | Quality Assured` : 'Brand Product Title - High Quality & Durable'
    },
    imageAnalysis: {
      imageCount,
      readinessScore: imageScore,
      recommendations: imageTips
    },
    observedKeywords: derivedKeywords.slice(0, 8),
    issues
  };
}

// Listing Audit Endpoint
app.post('/analyze-listing', (req, res) => {
  try {
    const analysis = analyzeListingQuality(req.body);
    return res.json(analysis);
  } catch (err) {
    console.error('Audit error:', err);
    res.status(500).json({ error: 'Failed to analyze listing', details: err.message });
  }
});

// AI Generator Endpoint (Fact-Aware AI Provider)
app.post('/generate-bullets-desc', async (req, res) => {
  try {
    const generated = await aiProvider.generateListingContent(req.body);
    return res.json(generated);
  } catch (err) {
    console.error('Generator error:', err);
    res.status(500).json({ error: 'Failed to generate content', details: err.message });
  }
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`AI Listing Copilot Server listening on port ${PORT}`);
  });
}

module.exports = app;
