import crypto from 'crypto';

const API_BASE = process.env.API_BASE_URL || 'http://localhost:3001';

async function postJson(path, payload, signatureHeader, secret) {
  const raw = JSON.stringify(payload);
  const signature = crypto.createHmac('sha256', secret).update(raw).digest('hex');

  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      [signatureHeader]: signature,
    },
    body: raw,
  });

  const text = await res.text();
  return { status: res.status, text };
}

async function main() {
  console.log(`Running signed webhook verification against ${API_BASE}`);

  const sallaSecret = process.env.SALLA_WEBHOOK_SECRET;
  const sallaStoreId = process.env.SALLA_TEST_STORE_ID || 'test-store';
  if (!sallaSecret) {
    console.log('ℹ️  Skipping Salla signed check (SALLA_WEBHOOK_SECRET not set).');
  } else {
    const sallaPayload = {
      event: 'cart.abandoned',
      data: {
        id: 'test-cart-1',
        total: 100,
        customer: { first_name: 'Test', last_name: 'User', mobile: '966500000000' },
        items: [{ name: 'منتج تجريبي', quantity: 1, price: 100 }],
      },
    };
    const res = await postJson(`/api/webhook/salla/${sallaStoreId}`, sallaPayload, 'x-salla-signature', sallaSecret);
    const ok = [201, 202, 404].includes(res.status);
    console.log(`${ok ? '✅' : '❌'} Signed Salla webhook -> ${res.status}`);
    if (!ok) {
      console.log(`   Response: ${res.text}`);
      throw new Error(`Unexpected Salla webhook status: ${res.status}`);
    }
  }

  const moyasarSecret = process.env.MOYASAR_API_KEY;
  if (!moyasarSecret) {
    console.log('ℹ️  Skipping Moyasar signed check (MOYASAR_API_KEY not set).');
  } else {
    const moyasarPayload = {
      status: 'paid',
      metadata: { moyasarCustId: 'cust-test-1' },
      source: { company: 'cust-test-1' },
    };
    const res = await postJson('/api/payments/moyasar/webhook', moyasarPayload, 'x-moyasar-signature', moyasarSecret);
    const ok = [200, 404].includes(res.status);
    console.log(`${ok ? '✅' : '❌'} Signed Moyasar webhook -> ${res.status}`);
    if (!ok) {
      console.log(`   Response: ${res.text}`);
      throw new Error(`Unexpected Moyasar webhook status: ${res.status}`);
    }
  }

  console.log('Signed webhook verification finished.');
}

main().catch((error) => {
  console.error('Signed webhook verification failed:', error.message);
  process.exit(1);
});
