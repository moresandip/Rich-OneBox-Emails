const http = require('http');

const server = http.createServer((req, res) => {
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      message: 'Rich OneBox Emails is running!'
    }));
  } else {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(`
      <html>
        <head><title>Rich OneBox Emails</title></head>
        <body>
          <h1>🚀 Rich OneBox Emails is Running!</h1>
          <p>Status: <strong>Healthy</strong></p>
          <p>Time: ${new Date().toISOString()}</p>
          <p>Port: 3000</p>
          <h2>Available Endpoints:</h2>
          <ul>
            <li><a href="/health">/health</a> - Health check</li>
          </ul>
        </body>
      </html>
    `);
  }
});

server.listen(3000, () => {
  console.log('🚀 Rich OneBox Emails running on http://localhost:3000');
  console.log('📧 Health check: http://localhost:3000/health');
});
