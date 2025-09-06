// Fix: Return stubbed metrics for Vercel (no Redis/DB)
import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    totalRequests: 0,
    totalCost: 0,
    avgLatency: 0,
    providers: [],
    note: 'Full metrics require Docker deployment with Redis'
  });
}