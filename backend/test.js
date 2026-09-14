const assert = require('assert');
const app = require('./server');

async function runTests() {
  console.log('Running Backend API Tests...');

  const server = app.listen(0, async () => {
    const port = server.address().port;
    const baseUrl = `http://localhost:${port}`;

    try {
      // Test GET /
      const resHealth = await fetch(`${baseUrl}/`);
      const healthData = await resHealth.json();
      assert.strictEqual(resHealth.status, 200);
      assert.strictEqual(healthData.status, 'ok');
      console.log('✓ GET / health check passed');

      // Test POST /analyze-listing (Amazon sample with language hi)
      const resAnalyze = await fetch(`${baseUrl}/analyze-listing`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platform: 'Amazon',
          title: 'Wireless Bluetooth Earbuds Headphone',
          description: 'High quality noise cancelling earbuds with fast charging case.',
          bullets: ['Bluetooth 5.3', 'IPX5 Waterproof'],
          price: '999',
          imageUrls: ['https://example.com/img1.jpg', 'https://example.com/img2.jpg', 'https://example.com/img3.jpg'],
          language: 'hi'
        })
      });

      const analyzeData = await resAnalyze.json();
      assert.strictEqual(resAnalyze.status, 200);
      assert.strictEqual(analyzeData.platform, 'Amazon');
      assert.ok(analyzeData.score > 50);
      assert.ok(Array.isArray(analyzeData.keywords));
      assert.ok(Array.isArray(analyzeData.competitorGap));
      assert.strictEqual(analyzeData.imageCtr.imageCount, 3);
      console.log('✓ POST /analyze-listing (with language toggle & competitor gap) passed');

      // Test POST /generate-bullets-desc
      const resGen = await fetch(`${baseUrl}/generate-bullets-desc`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'Smart Watch Series 9',
          platform: 'Flipkart',
          language: 'en'
        })
      });

      const genData = await resGen.json();
      assert.strictEqual(resGen.status, 200);
      assert.strictEqual(genData.bullets.length, 5);
      assert.ok(genData.description.length > 50);
      console.log('✓ POST /generate-bullets-desc passed');

      console.log('All enhanced backend tests passed successfully!');
    } catch (err) {
      console.error('❌ Test failed:', err);
      process.exitCode = 1;
    } finally {
      server.close();
    }
  });
}

runTests();
