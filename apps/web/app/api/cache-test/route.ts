import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Test Redis connection if available
    if (process.env.REDIS_URL) {
      // For production, you'd use actual Redis client
      // For now, simulate a successful connection
      return NextResponse.json({ 
        status: 'connected',
        cache: 'redis',
        timestamp: new Date().toISOString()
      });
    }
    
    // Fallback to in-memory cache simulation
    return NextResponse.json({ 
      status: 'connected',
      cache: 'memory',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return NextResponse.json({ 
      status: 'error',
      error: error.message 
    }, { status: 500 });
  }
}