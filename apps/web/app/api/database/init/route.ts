import { NextResponse } from 'next/server'
import { initializeDatabase, getPostgresPool, getRedisClient } from '@/lib/database'

export const dynamic = 'force-dynamic'

export async function POST() {
  try {
    console.log('🏠 Initializing EXPREZZZO Sovereign House database...')
    
    // Initialize database schema
    await initializeDatabase()
    
    // Test PostgreSQL connection
    const pgPool = getPostgresPool()
    const pgClient = await pgPool.connect()
    const pgResult = await pgClient.query('SELECT NOW() as timestamp')
    pgClient.release()
    
    // Test Redis connection
    const redis = getRedisClient()
    await redis.set('house:init', 'sovereign_ready')
    const redisTest = await redis.get('house:init')
    
    console.log('✅ Database initialization complete!')
    
    return NextResponse.json({
      success: true,
      message: '🎰 EXPREZZZO Sovereign House database initialized - Vegas ready!',
      connections: {
        postgresql: {
          status: 'connected',
          timestamp: pgResult.rows[0].timestamp
        },
        redis: {
          status: 'connected',
          test_value: redisTest
        }
      },
      schema: {
        tables: ['users', 'requests', 'room_activities', 'system_metrics'],
        indexes: ['user_id', 'created_at', 'room_name', 'metric_name']
      }
    })
    
  } catch (error) {
    console.error('Database initialization error:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Database initialization failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function GET() {
  try {
    // Check database health
    const pgPool = getPostgresPool()
    const pgClient = await pgPool.connect()
    
    // Get basic stats
    const statsResult = await pgClient.query(`
      SELECT 
        (SELECT COUNT(*) FROM users) as total_users,
        (SELECT COUNT(*) FROM requests) as total_requests,
        (SELECT SUM(cost) FROM requests) as total_revenue,
        (SELECT COUNT(*) FROM room_activities) as total_activities
    `)
    
    pgClient.release()
    
    // Test Redis
    const redis = getRedisClient()
    await redis.ping()
    
    return NextResponse.json({
      status: 'healthy',
      message: '🎰 Sovereign House database operational',
      stats: statsResult.rows[0],
      connections: {
        postgresql: 'connected',
        redis: 'connected'
      },
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('Database health check error:', error)
    
    return NextResponse.json({
      status: 'unhealthy',
      error: 'Database connection failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}