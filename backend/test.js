const assert = require('assert');
const app = require('./server');

async function runTests() {
  console.log('Running Backend API Tests...');

  const server = app.listen(0, async () => {
    const port = server.address().port;
    const baseUrl = `http://localhost:${port}`;

    try {
      // 1. GET /
      const resHealth = await fetch(`${baseUrl}/`);
      const healthData = await resHealth.json();
      assert.strictEqual(resHealth.status, 200);
      assert.strictEqual(healthData.status, 'ok');
      console.log('✓ GET / health check passed');

      // 2. POST /analyze-listing
      const resAnalyze = await fetch(`${baseUrl}/analyze-listing`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platform: 'Amazon',
          title: 'Cotton Printed Kurti for Women',
          description: '100% Cotton straight kurti with 3/4 sleeves.',
          bullets: ['100% Cotton', '3/4 Sleeves', 'Straight Fit'],
          price: '799',
          imageUrls: ['https://example.com/img1.jpg', 'https://example.com/img2.jpg']
        })
      });

      const analyzeData = await resAnalyze.json();
      assert.strictEqual(resAnalyze.status, 200);
      assert.strictEqual(analyzeData.platform, 'Amazon');
      assert.ok(analyzeData.listingReadinessScore > 50);
      assert.ok(Array.isArray(analyzeData.topActions));
      assert.ok(analyzeData.imageAnalysis.readinessScore > 0);
      console.log('✓ POST /analyze-listing passed (honest scoring & top actions verified)');

      // 3. POST /generate-bullets-desc
      const resGen = await fetch(`${baseUrl}/generate-bullets-desc`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'Women Cotton Kurti',
          platform: 'Flipkart',
          material: 'Cotton'
        })
      });

      const genData = await resGen.json();
      assert.strictEqual(resGen.status, 200);
      assert.strictEqual(genGenDataLength(genData.bullets), 5);
      console.log('✓ POST /generate-bullets-desc passed');

      console.log('All backend tests passed successfully!');
    } catch (err) {
      console.error('❌ Test failed:', err);
      process.exitCode = 1;
    } finally {
      server.close();
    }
  });
}

function genGenDataLength(arr) {
  return Array.isArray(arr) ? arr.length : 0;
}

runTests();
