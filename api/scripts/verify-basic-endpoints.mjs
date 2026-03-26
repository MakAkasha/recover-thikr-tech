const API_BASE = process.env.API_BASE_URL || 'http://localhost:3001';

async function check(path, expectedStatuses) {
  const url = `${API_BASE}${path}`;
  const res = await fetch(url);
  const text = await res.text();
  const ok = expectedStatuses.includes(res.status);
  console.log(`${ok ? '✅' : '❌'} ${path} -> ${res.status}`);
  if (!ok) {
    console.log(`   Response: ${text}`);
    throw new Error(`Unexpected status for ${path}: ${res.status}`);
  }
}

async function main() {
  console.log(`Running basic endpoint verification against ${API_BASE}`);
  await check('/api/health', [200]);
  await check('/api/whatsapp/health', [200]);
  await check('/api/admin/sessions', [200]);

  const paymentsRes = await fetch(`${API_BASE}/api/payments/moyasar/webhook`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: '{}',
  });
  const paymentsText = await paymentsRes.text();
  const paymentsOk = paymentsRes.status === 400;
  console.log(`${paymentsOk ? '✅' : '❌'} /api/payments/moyasar/webhook (invalid request) -> ${paymentsRes.status}`);
  if (!paymentsOk) {
    console.log(`   Response: ${paymentsText}`);
    throw new Error(`Unexpected status for invalid Moyasar webhook: ${paymentsRes.status}`);
  }

  console.log('All basic endpoint checks passed.');
}

main().catch((error) => {
  console.error('Basic verification failed:', error.message);
  process.exit(1);
});
