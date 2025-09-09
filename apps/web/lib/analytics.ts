import { Pool } from 'pg';
import Redis from 'ioredis';

const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  max: 10,
});

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
  retryStrategy: (times) => Math.min(times * 50, 2000),
  maxRetriesPerRequest: 3,
});

const CACHE_TTL = 60; // 1 minute cache

export async function getAnalytics(useCache = true) {
  const cacheKey = 'analytics:dashboard';
  
  // Try cache first
  if (useCache) {
    try {
      const cached = await redis.get(cacheKey);
      if (cached) {
        console.log('Analytics served from cache');
        return JSON.parse(cached);
      }
    } catch (error) {
      console.error('Cache read failed:', error);
    }
  }
  
  // Fetch from database
  const [requestStats, degradedStats, providerStats, costBreakdown] = await Promise.all([
    pool.query(`
      SELECT 
        COUNT(*)::int AS total_requests,
        COALESCE(SUM(estimated_cost), 0)::float AS total_cost,
        COALESCE(AVG(latency_ms), 0)::float AS avg_latency
      FROM request_log
      WHERE created_at > NOW() - INTERVAL '24 hours'
    `),
    
    pool.query(`
      SELECT 
        COUNT(*)::int AS degraded_count,
        (SELECT COUNT(*) FROM request_log WHERE created_at > NOW() - INTERVAL '24 hours')::int AS total
      FROM request_log 
      WHERE degraded = true AND created_at > NOW() - INTERVAL '24 hours'
    `),
    
    pool.query(`
      SELECT 
        p.name,
        p.sovereignty_score,
        COUNT(r.id) AS request_count,
        COALESCE(AVG(r.latency_ms), 0) AS avg_latency
      FROM providers p
      LEFT JOIN request_log r ON r.provider = p.name
      WHERE p.is_active = true
      GROUP BY p.id, p.name, p.sovereignty_score
      ORDER BY p.sovereignty_score DESC
    `),
    
    pool.query(`
      SELECT 
        DATE_TRUNC('hour', created_at) AS hour,
        SUM(estimated_cost) AS hourly_cost,
        COUNT(*) AS request_count
      FROM request_log
      WHERE created_at > NOW() - INTERVAL '24 hours'
      GROUP BY hour
      ORDER BY hour DESC
    `)
  ]);
  
  const result = {
    requests: {
      total: requestStats.rows[0]?.total_requests ?? 0,
      avgLatency: requestStats.rows[0]?.avg_latency ?? 0,
    },
    costs: {
      total: requestStats.rows[0]?.total_cost ?? 0,
      perRequest: requestStats.rows[0]?.total_requests > 0 
        ? (requestStats.rows[0]?.total_cost / requestStats.rows[0]?.total_requests) 
        : 0,
    },
    degraded: {
      count: degradedStats.rows[0]?.degraded_count ?? 0,
      ratio: degradedStats.rows[0]?.total > 0 
        ? (degradedStats.rows[0]?.degraded_count / degradedStats.rows[0]?.total) 
        : 0,
    },
    providers: providerStats.rows,
    hourlyBreakdown: costBreakdown.rows,
    sovereignty: {
      score: providerStats.rows.length > 0 
        ? providerStats.rows.reduce((acc, p) => acc + p.sovereignty_score, 0) / providerStats.rows.length 
        : 0,
      escapeVelocity: 24, // hours
    },
    timestamp: new Date().toISOString(),
  };
  
  // Cache result
  try {
    await redis.setex(cacheKey, CACHE_TTL, JSON.stringify(result));
  } catch (error) {
    console.error('Cache write failed:', error);
  }
  
  return result;
}

// Log request with sovereignty tracking
export async function logRequest(data: {
  route: string;
  method: string;
  provider: string;
  estimatedCost: number;
  latency: number;
  degraded: boolean;
}) {
  const maxCost = parseFloat(process.env.MAX_COST_PER_REQUEST || '0.0002');
  const sovereigntyPreserved = data.provider === 'ollama' || data.provider === 'local';
  
  await pool.query(`
    INSERT INTO request_log (route, method, provider, estimated_cost, latency_ms, degraded, sovereignty_preserved)
    VALUES ($1, $2, $3, $4, $5, $6, $7)
  `, [
    data.route,
    data.method,
    data.provider,
    Math.min(data.estimatedCost, maxCost), // Cost guard
    data.latency,
    data.degraded || data.estimatedCost > maxCost,
    sovereigntyPreserved
  ]);
  
  // Update metrics
  await pool.query(`
    INSERT INTO metrics (metric_type, metric_name, metric_value, tags)
    VALUES 
      ('request', 'cost', $1, $2),
      ('request', 'latency', $3, $2)
  `, [data.estimatedCost, JSON.stringify({ provider: data.provider }), data.latency]);
}
