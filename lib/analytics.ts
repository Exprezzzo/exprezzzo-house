let pool: any = null;

async function getPool() {
  if (!pool) {
    const { Pool } = await import('pg');
    pool = new Pool({ connectionString: process.env.DATABASE_URL });
  }
  return pool;
}

export async function getAnalytics() {
  const dbPool = await getPool();
  
  const req = await dbPool.query(
    `SELECT COUNT(*)::int AS c, COALESCE(SUM(estimated_cost),0)::float AS s FROM request_log`
  );
  const totalRequests = req.rows[0]?.c ?? 0;
  const totalCost = req.rows[0]?.s ?? 0;

  const deg = await dbPool.query(
    `SELECT
       COUNT(*)::int AS over,
       (SELECT COUNT(*) FROM request_log)::int AS total
     FROM request_log
     WHERE estimated_cost > 0.001`
  );
  const over = deg.rows[0]?.over ?? 0;
  const total = deg.rows[0]?.total ?? 0;
  const degradedRatio = total > 0 ? over / total : 0;

  let providers: Array<{ name: string; sovereignty_score: number }> = [];
  try {
    const p = await dbPool.query(
      `SELECT name, sovereignty_score FROM providers ORDER BY sovereignty_score DESC`
    );
    providers = p.rows;
  } catch { }

  return {
    requests: { total: totalRequests },
    costs: { total: totalCost },
    degraded: { ratio: degradedRatio },
    providers
  };
}