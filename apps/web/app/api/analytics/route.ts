import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Dynamic import to avoid build issues
    const { Pool } = await import('pg');
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });

    // Get request and cost data
    const req = await pool.query(
      `SELECT COUNT(*)::int AS c, COALESCE(SUM(estimated_cost),0)::float AS s FROM request_log`
    );
    const totalRequests = req.rows[0]?.c ?? 0;
    const totalCost = req.rows[0]?.s ?? 0;

    // Get degraded ratio
    const deg = await pool.query(
      `SELECT
         COUNT(*)::int AS over,
         (SELECT COUNT(*) FROM request_log)::int AS total
       FROM request_log
       WHERE estimated_cost > 0.001`
    );
    const over = deg.rows[0]?.over ?? 0;
    const total = deg.rows[0]?.total ?? 0;
    const degradedRatio = total > 0 ? over / total : 0;

    // Get providers
    let providers: Array<{ name: string; sovereignty_score: number }> = [];
    try {
      const p = await pool.query(
        `SELECT name, sovereignty_score FROM providers ORDER BY sovereignty_score DESC`
      );
      providers = p.rows;
    } catch (error) {
      console.error('Error fetching providers:', error);
    }

    const data = {
      requests: { total: totalRequests },
      costs: { total: totalCost },
      degraded: { ratio: degradedRatio },
      providers
    };

    await pool.end();
    
    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error('Analytics API error:', error);
    // Return mock data if database is unavailable
    return NextResponse.json({
      requests: { total: 0 },
      costs: { total: 0.0 },
      degraded: { ratio: 0.0 },
      providers: []
    }, { status: 200 });
  }
}