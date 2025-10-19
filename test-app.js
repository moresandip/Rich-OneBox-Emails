const express = require('express');
const app = express();
const port = 3000;

app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    message: 'Rich OneBox Emails is running!'
  });
});

app.get('/', (req, res) => {
  res.send(`
    <html>
      <head><title>Rich OneBox Emails</title></head>
      <body>
        <h1>🚀 Rich OneBox Emails is Running!</h1>
        <p>Status: <strong>Healthy</strong></p>
        <p>Time: ${new Date().toISOString()}</p>
        <p>Port: ${port}</p>
        <h2>Available Endpoints:</h2>
        <ul>
          <li><a href="/health">/health</a> - Health check</li>
          <li><a href="/api/emails">/api/emails</a> - Email list</li>
          <li><a href="/api/accounts">/api/accounts</a> - Account list</li>
        </ul>
      </body>
    </html>
  `);
});

app.listen(port, () => {
  console.log(`🚀 Rich OneBox Emails running on http://localhost:${port}`);
  console.log(`📧 Health check: http://localhost:${port}/health`);
});

