import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const tests: Record<string, boolean> = {};
    
    // Test Ollama connection
    try {
      if (process.env.OLLAMA_BASE_URL) {
        const ollamaResponse = await fetch(process.env.OLLAMA_BASE_URL + '/api/tags', {
          signal: AbortSignal.timeout(5000)
        });
        tests.ollama = ollamaResponse.ok;
      } else {
        tests.ollama = false;
      }
    } catch {
      tests.ollama = false;
    }
    
    // Test Supabase/Database connection
    try {
      if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
        const supabaseResponse = await fetch(process.env.NEXT_PUBLIC_SUPABASE_URL + '/rest/v1/', {
          headers: {
            'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
            'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''}`
          },
          signal: AbortSignal.timeout(5000)
        });
        tests.supabase = supabaseResponse.ok;
      } else {
        // Test local database
        const { Pool } = await import('pg');
        const pool = new Pool({ connectionString: process.env.DATABASE_URL });
        const result = await pool.query('SELECT 1');
        tests.database = result.rows.length > 0;
        await pool.end();
      }
    } catch {
      tests.supabase = false;
      tests.database = false;
    }
    
    // Test cache
    try {
      const cacheResponse = await fetch(new URL('/api/cache-test', process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000'), {
        signal: AbortSignal.timeout(5000)
      });
      tests.cache = cacheResponse.ok;
    } catch {
      tests.cache = false;
    }
    
    const passedTests = Object.values(tests).filter(Boolean).length;
    const totalTests = Object.keys(tests).length;
    const sovereigntyScore = (passedTests / totalTests) * 100;
    
    return NextResponse.json({
      sovereignty_score: sovereigntyScore,
      degraded: sovereigntyScore < 80,
      cost_per_request: 0.001,
      tests,
      passed: passedTests,
      total: totalTests,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return NextResponse.json({
      sovereignty_score: 0,
      degraded: true,
      cost_per_request: 0.001,
      error: error.message,
      tests: {},
      passed: 0,
      total: 0,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}