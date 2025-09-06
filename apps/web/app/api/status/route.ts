// Fix: Add proper edge runtime response
import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    sovereignty: process.env.SOVEREIGNTY_ENFORCED === 'true' ? 'ENFORCED' : 'DISABLED',
    timestamp: new Date().toISOString(),
    cost_target: process.env.TARGET_COST || '0.001'
  });
}