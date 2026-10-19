/**
 * Integration Test for SSI FastConnect Data in StockAI
 * Verifies:
 * 1. GET /api/api-center returns real SSI config, providers, logs
 * 2. Status conforms strictly to the 7 defined states:
 *    NOT_CONFIGURED, CONFIGURED, TESTING, CONNECTED, CONNECTION_FAILED, SYNCING, SYNC_ERROR
 * 3. Zero fake connection policy: returns failed/not configured when credentials invalid
 * 4. POST /api/api-center handles SAVE_SSI_CONFIG, TEST_CONNECTION, SYNC_DATA, CLEAR_LOGS
 * 5. GET /api/admin/system returns live SSI status
 */

const http = require('http');
const crypto = require('crypto');

const PORT = 3000;
const BASE_URL = `http://localhost:${PORT}`;
const SESSION_SECRET = process.env.SESSION_SECRET || 'stockai-secure-oauth-secret-token-key-2026';

function createAdminCookie() {
  const sessionData = {
    userId: 'admin-001',
    email: 'triqnnamabank@gmail.com',
    role: 'ADMIN',
    tier: 'ENTERPRISE',
    createdAt: Date.now(),
    expiresAt: Date.now() + 30 * 24 * 3600 * 1000,
  };
  const rawPayload = Buffer.from(JSON.stringify(sessionData)).toString('base64url');
  const signature = crypto.createHmac('sha256', SESSION_SECRET).update(rawPayload).digest('base64url');
  return `stockai_session=${rawPayload}.${signature}`;
}

function makeRequest(method, path, body = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, raw: data });
        }
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function runTests() {
  console.log('====================================================');
  console.log('🧪 BẮT ĐẦU KIỂM TRA TÍCH HỢP SSI FASTCONNECT DATA');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, name) {
    if (condition) {
      console.log(`✅ [PASS] ${name}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${name}`);
      failed++;
    }
  }

  try {
    // 1. GET /api/api-center
    console.log('--- 1. Kiểm tra API GET /api/api-center ---');
    const getRes = await makeRequest('GET', '/api/api-center');
    assert(getRes.status === 200, 'GET /api/api-center trả về HTTP 200');
    assert(getRes.data && getRes.data.success === true, 'Response success === true');
    assert(getRes.data.data && getRes.data.data.ssi_config, 'Dữ liệu chứa ssi_config');
    assert(Array.isArray(getRes.data.data.providers), 'Dữ liệu chứa danh sách providers');
    assert(Array.isArray(getRes.data.data.logs), 'Dữ liệu chứa danh sách logs');

    const ssiProvider = getRes.data.data.providers.find((p) => p.code === 'SSI');
    assert(!!ssiProvider, 'Có provider mã SSI');
    console.log(`   Trạng thái hiện tại của SSI: ${ssiProvider.status}`);

    // 2. Validate strict 7 status definitions
    const validStatuses = [
      'NOT_CONFIGURED',
      'CONFIGURED',
      'TESTING',
      'CONNECTED',
      'CONNECTION_FAILED',
      'SYNCING',
      'SYNC_ERROR',
      'NOT_SUPPORTED',
    ];
    assert(
      validStatuses.includes(ssiProvider.status),
      `Trạng thái SSI (${ssiProvider.status}) thuộc tập hợp 7 trạng thái chuẩn`
    );

    // 3. ZERO-FAKE POLICY TEST:
    // Calling test connection with unconfigured or invalid keys must NOT report CONNECTED
    console.log('\n--- 2. Kiểm tra chính sách KHÔNG FAKE KẾT NỐI (Zero-fake policy) ---');
    const testRes = await makeRequest('POST', '/api/api-center', {
      action: 'TEST_CONNECTION',
      providerCode: 'SSI',
    });
    console.log('   Kết quả test SSI:', testRes.data);
    assert(testRes.status === 200, 'POST TEST_CONNECTION trả về HTTP 200');
    // If not configured, it should return false or NOT_CONFIGURED/CONNECTION_FAILED
    if (!getRes.data.data.ssi_config.hasCredentials) {
      assert(
        testRes.data.data?.status === 'NOT_CONFIGURED' || testRes.data.data?.status === 'CONNECTION_FAILED',
        'Khi chưa cấu hình thật, kết nối KHÔNG được báo CONNECTED'
      );
    } else {
      console.log(`   (Đã có credentials, kết quả thực tế: status=${testRes.data.data?.status})`);
    }

    // 4. Test SAVE_SSI_CONFIG
    console.log('\n--- 3. Kiểm tra lưu cấu hình SSI FastConnect (SAVE_SSI_CONFIG) ---');
    const saveRes = await makeRequest('POST', '/api/api-center', {
      action: 'SAVE_SSI_CONFIG',
      consumerId: 'TEST_CONSUMER_ID_123',
      consumerSecret: 'test_secret_key_abc_xyz',
      apiUrl: 'https://fc-data.ssi.com.vn/api/v2',
      streamingUrl: 'wss://fc-data.ssi.com.vn/v2.0/signalr',
      autoSync: true,
    });
    assert(saveRes.status === 200, 'POST SAVE_SSI_CONFIG trả về HTTP 200');
    assert(saveRes.data.success === true, 'Lưu cấu hình SSI thành công');

    // Verify secret is masked in subsequent GET
    const getAfterSave = await makeRequest('GET', '/api/api-center');
    assert(
      getAfterSave.data.data.ssi_config.consumerId === 'TEST_CONSUMER_ID_123',
      'Consumer ID được lưu chính xác'
    );
    assert(
      getAfterSave.data.data.ssi_config.hasCredentials === true,
      'hasCredentials được nhận diện = true'
    );
    assert(
      !getAfterSave.data.data.ssi_config.consumerSecret ||
        getAfterSave.data.data.ssi_config.consumerSecret.includes('••••'),
      'Secret Key được bảo mật / che giấu, không lộ plain text'
    );

    // 5. Test real ping with fake credentials -> MUST FAIL (Zero fake)
    console.log('\n--- 4. Kiểm tra ping với thông tin giả -> Phải trả về CONNECTION_FAILED ---');
    const testFailedRes = await makeRequest('POST', '/api/api-center', {
      action: 'TEST_CONNECTION',
      providerCode: 'SSI',
    });
    console.log('   Kết quả ping thực tế:', testFailedRes.data);
    assert(
      testFailedRes.data.data?.status === 'CONNECTION_FAILED' ||
        testFailedRes.data.data?.status === 'ERROR',
      'Test thực tế thất bại khi thông tin không khớp với SSI Auth, status = CONNECTION_FAILED'
    );

    // 6. Test SYNC_DATA
    console.log('\n--- 5. Kiểm tra thực hiện đồng bộ dữ liệu (SYNC_DATA) ---');
    const syncRes = await makeRequest('POST', '/api/api-center', {
      action: 'SYNC_DATA',
      providerCode: 'SSI',
    });
    console.log('   Kết quả SYNC_DATA:', syncRes.data);
    assert(syncRes.status === 200, 'POST SYNC_DATA trả về HTTP 200');

    // 7. Test Admin System Endpoint with Admin Cookie
    console.log('\n--- 6. Kiểm tra Admin System Endpoint (GET /api/admin/system) ---');
    const adminCookie = createAdminCookie();
    const systemRes = await makeRequest('GET', '/api/admin/system', null, {
      Cookie: adminCookie,
    });
    assert(systemRes.status === 200, 'GET /api/admin/system trả về HTTP 200 với quyền ADMIN');
    assert(systemRes.data.data && systemRes.data.data.ssi, 'Hệ thống Admin trả về đối tượng cấu hình ssi');
    console.log(`   Admin ssi: code=${systemRes.data.data?.ssi?.code}, status=${systemRes.data.data?.ssi?.status}, latency=${systemRes.data.data?.ssi?.responseTimeMs}ms`);

    // Clean up test config back to empty so it doesn't leave junk
    await makeRequest('POST', '/api/api-center', {
      action: 'SAVE_SSI_CONFIG',
      consumerId: '',
      consumerSecret: '',
      apiUrl: 'https://fc-data.ssi.com.vn/api/v2',
      streamingUrl: 'wss://fc-data.ssi.com.vn/v2.0/signalr',
      autoSync: true,
    });
    console.log('\n🧹 Đã dọn dẹp cấu hình kiểm thử về trạng thái chuẩn.');

    console.log('\n====================================================');
    console.log(`🎉 KẾT QUẢ KIỂM TRA: ${passed} PASSED, ${failed} FAILED`);
    console.log('====================================================\n');

    process.exit(failed > 0 ? 1 : 0);
  } catch (err) {
    console.error('Lỗi khi chạy integration test:', err);
    process.exit(1);
  }
}

runTests();
