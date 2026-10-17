const http = require('http');

const endpoints = [
  { name: 'GET / (Homepage)', path: '/', method: 'GET' },
  { name: 'GET /api/portfolio', path: '/api/portfolio', method: 'GET' },
  { name: 'GET /api/market', path: '/api/market', method: 'GET' },
  { name: 'GET /api/t3-signals', path: '/api/t3-signals', method: 'GET' },
  { name: 'GET /api/api-center', path: '/api/api-center', method: 'GET' },
  { name: 'GET /api/bmsc', path: '/api/bmsc', method: 'GET' },
  { name: 'GET /api/backup', path: '/api/backup', method: 'GET' },
  { 
    name: 'POST /api/api-center (Ping Vietstock)', 
    path: '/api/api-center', 
    method: 'POST', 
    body: JSON.stringify({ action: 'TEST_CONNECTION', providerCode: 'VIETSTOCK' }) 
  },
  { 
    name: 'POST /api/api-center (Check BMSC)', 
    path: '/api/api-center', 
    method: 'POST', 
    body: JSON.stringify({ action: 'TEST_CONNECTION', providerCode: 'BMSC' }) 
  },
  { 
    name: 'POST /api/ai (Analyze FPT)', 
    path: '/api/ai', 
    method: 'POST', 
    body: JSON.stringify({ prompt: 'Phân tích cổ phiếu FPT' }) 
  },
  { 
    name: 'POST /api/backtest (Test Breakout)', 
    path: '/api/backtest', 
    method: 'POST', 
    body: JSON.stringify({ strategy: 'Breakout', timeframe: '6M' }) 
  },
  { 
    name: 'POST /api/backup (Create Snapshot)', 
    path: '/api/backup', 
    method: 'POST', 
    body: JSON.stringify({ action: 'CREATE_SNAPSHOT' }) 
  },
];

async function runTests() {
  console.log('=== BẮT ĐẦU KIỂM THỬ TẤT CẢ ENDPOINTS STOCKAI PERSONAL ===\n');
  let passed = 0;

  for (const ep of endpoints) {
    await new Promise((resolve) => {
      const options = {
        hostname: 'localhost',
        port: 3000,
        path: ep.path,
        method: ep.method,
        headers: ep.body ? {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(ep.body)
        } : {},
      };

      const req = http.request(options, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            console.log(`[PASS] ${ep.name} -> Status: ${res.statusCode} (Length: ${data.length} bytes)`);
            passed++;
          } else {
            console.error(`[FAIL] ${ep.name} -> Status: ${res.statusCode}`);
          }
          resolve();
        });
      });

      req.on('error', (e) => {
        console.error(`[FAIL] ${ep.name} -> Error: ${e.message}`);
        resolve();
      });

      if (ep.body) req.write(ep.body);
      req.end();
    });
  }

  console.log(`\n=== TỔNG KẾT: ĐÃ VƯỢT QUA ${passed}/${endpoints.length} ENDPOINTS (${Math.round(passed/endpoints.length*100)}%) ===`);
  if (passed === endpoints.length) {
    process.exit(0);
  } else {
    process.exit(1);
  }
}

runTests();
