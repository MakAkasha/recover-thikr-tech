import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    recoveredCarts: 0,
    recoveredRevenue: 0,
    messagesSent: 0,
    recoveryRate: 0,
    recent: [],
  });
}
