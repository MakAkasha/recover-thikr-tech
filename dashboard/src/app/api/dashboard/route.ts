import { NextResponse } from 'next/server';

export async function GET() {
  const apiUrl = process.env.API_URL || 'http://localhost:3001/api';
  const storeId = 'test-store'; // TODO: Get from session

  try {
    const res = await fetch(`${apiUrl}/dashboard?storeId=${storeId}`, { cache: 'no-store' });
    if (!res.ok) {
      throw new Error(`API returned ${res.status}`);
    }
    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Dashboard fetch error:', error);
    return NextResponse.json({
      recoveredCarts: 0,
      recoveredRevenue: 0,
      messagesSent: 0,
      recoveryRate: 0,
      recent: [],
    });
  }
}
