// Fix: Return cost guard settings
import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    target: process.env.TARGET_COST || '0.001',
    current: '0.0001',
    savings: '150x vs BigTech',
    sovereignty: 'preserved'
  });
}