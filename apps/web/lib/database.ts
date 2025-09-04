// Database integration for EXPREZZZO Sovereign House
// PostgreSQL + Redis setup for sovereign data management

import { Pool, PoolClient } from 'pg'
import Redis from 'ioredis'

// PostgreSQL Configuration
const pgConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'exprezzzo_house',
  user: process.env.DB_USER || 'exprezzzo',
  password: process.env.DB_PASSWORD || 'sovereign',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
}

// Redis Configuration
const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD || undefined,
  db: 0,
  retryDelayOnFailover: 100,
  maxRetriesPerRequest: 3,
}

// Initialize connections
let pgPool: Pool | null = null
let redisClient: Redis | null = null

// PostgreSQL Pool
export const getPostgresPool = (): Pool => {
  if (!pgPool) {
    pgPool = new Pool(pgConfig)
    
    pgPool.on('error', (err) => {
      console.error('PostgreSQL pool error:', err)
    })
    
    pgPool.on('connect', () => {
      console.log('🎰 PostgreSQL connected - Vegas data secured!')
    })
  }
  return pgPool
}

// Redis Client
export const getRedisClient = (): Redis => {
  if (!redisClient) {
    redisClient = new Redis(redisConfig)
    
    redisClient.on('error', (err) => {
      console.error('Redis error:', err)
    })
    
    redisClient.on('connect', () => {
      console.log('⚡ Redis connected - Vegas cache online!')
    })
  }
  return redisClient
}

// Database Schema Setup
export const initializeDatabase = async (): Promise<void> => {
  const pool = getPostgresPool()
  const client = await pool.connect()
  
  try {
    // Create tables for sovereign house
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR(255) UNIQUE NOT NULL,
        username VARCHAR(100),
        email VARCHAR(255),
        total_requests INTEGER DEFAULT 0,
        total_cost DECIMAL(10, 6) DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)
    
    await client.query(`
      CREATE TABLE IF NOT EXISTS requests (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL,
        request_type VARCHAR(50) NOT NULL,
        model VARCHAR(100),
        cost DECIMAL(10, 6) NOT NULL,
        duration_ms INTEGER,
        status VARCHAR(20) DEFAULT 'completed',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(user_id)
      )
    `)
    
    await client.query(`
      CREATE TABLE IF NOT EXISTS room_activities (
        id SERIAL PRIMARY KEY,
        room_name VARCHAR(50) NOT NULL,
        user_id VARCHAR(255),
        activity_type VARCHAR(100) NOT NULL,
        data JSONB,
        cost DECIMAL(10, 6) DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)
    
    await client.query(`
      CREATE TABLE IF NOT EXISTS system_metrics (
        id SERIAL PRIMARY KEY,
        metric_name VARCHAR(100) NOT NULL,
        metric_value DECIMAL(15, 6),
        metric_data JSONB,
        recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)
    
    // Create indexes for performance
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_users_user_id ON users(user_id);
      CREATE INDEX IF NOT EXISTS idx_requests_user_id ON requests(user_id);
      CREATE INDEX IF NOT EXISTS idx_requests_created_at ON requests(created_at);
      CREATE INDEX IF NOT EXISTS idx_room_activities_room ON room_activities(room_name);
      CREATE INDEX IF NOT EXISTS idx_system_metrics_name ON system_metrics(metric_name);
    `)
    
    console.log('🏠 Database schema initialized - Sovereign house ready!')
    
  } catch (error) {
    console.error('Database initialization error:', error)
    throw error
  } finally {
    client.release()
  }
}

// User Management
export class UserService {
  static async createUser(userId: string, username?: string, email?: string): Promise<void> {
    const pool = getPostgresPool()
    const client = await pool.connect()
    
    try {
      await client.query(`
        INSERT INTO users (user_id, username, email)
        VALUES ($1, $2, $3)
        ON CONFLICT (user_id) DO UPDATE SET
          username = COALESCE($2, users.username),
          email = COALESCE($3, users.email),
          updated_at = CURRENT_TIMESTAMP
      `, [userId, username, email])
    } finally {
      client.release()
    }
  }
  
  static async getUserStats(userId: string): Promise<any> {
    const pool = getPostgresPool()
    const client = await pool.connect()
    
    try {
      const result = await client.query(`
        SELECT 
          total_requests,
          total_cost,
          created_at
        FROM users
        WHERE user_id = $1
      `, [userId])
      
      return result.rows[0] || null
    } finally {
      client.release()
    }
  }
}

// Request Tracking
export class RequestService {
  static async logRequest(
    userId: string, 
    requestType: string, 
    cost: number, 
    model?: string,
    durationMs?: number
  ): Promise<void> {
    const pool = getPostgresPool()
    const client = await pool.connect()
    
    try {
      // Insert request record
      await client.query(`
        INSERT INTO requests (user_id, request_type, model, cost, duration_ms)
        VALUES ($1, $2, $3, $4, $5)
      `, [userId, requestType, model, cost, durationMs])
      
      // Update user totals
      await client.query(`
        UPDATE users 
        SET 
          total_requests = total_requests + 1,
          total_cost = total_cost + $2,
          updated_at = CURRENT_TIMESTAMP
        WHERE user_id = $1
      `, [userId, cost])
      
    } finally {
      client.release()
    }
  }
  
  static async getRequestHistory(userId: string, limit: number = 100): Promise<any[]> {
    const pool = getPostgresPool()
    const client = await pool.connect()
    
    try {
      const result = await client.query(`
        SELECT 
          request_type,
          model,
          cost,
          duration_ms,
          status,
          created_at
        FROM requests
        WHERE user_id = $1
        ORDER BY created_at DESC
        LIMIT $2
      `, [userId, limit])
      
      return result.rows
    } finally {
      client.release()
    }
  }
}

// Room Activity Tracking
export class RoomService {
  static async logActivity(
    roomName: string,
    userId: string | null,
    activityType: string,
    data?: any,
    cost: number = 0
  ): Promise<void> {
    const pool = getPostgresPool()
    const client = await pool.connect()
    
    try {
      await client.query(`
        INSERT INTO room_activities (room_name, user_id, activity_type, data, cost)
        VALUES ($1, $2, $3, $4, $5)
      `, [roomName, userId, activityType, data ? JSON.stringify(data) : null, cost])
    } finally {
      client.release()
    }
  }
  
  static async getRoomStats(roomName: string): Promise<any> {
    const pool = getPostgresPool()
    const client = await pool.connect()
    
    try {
      const result = await client.query(`
        SELECT 
          COUNT(*) as total_activities,
          COUNT(DISTINCT user_id) as unique_users,
          SUM(cost) as total_cost,
          MAX(created_at) as last_activity
        FROM room_activities
        WHERE room_name = $1
          AND created_at >= CURRENT_DATE - INTERVAL '24 hours'
      `, [roomName])
      
      return result.rows[0]
    } finally {
      client.release()
    }
  }
}

// System Metrics
export class MetricsService {
  static async recordMetric(name: string, value: number, data?: any): Promise<void> {
    const pool = getPostgresPool()
    const client = await pool.connect()
    
    try {
      await client.query(`
        INSERT INTO system_metrics (metric_name, metric_value, metric_data)
        VALUES ($1, $2, $3)
      `, [name, value, data ? JSON.stringify(data) : null])
    } finally {
      client.release()
    }
  }
  
  static async getSystemStats(): Promise<any> {
    const pool = getPostgresPool()
    const client = await pool.connect()
    
    try {
      const result = await client.query(`
        SELECT 
          (SELECT COUNT(*) FROM users) as total_users,
          (SELECT COUNT(*) FROM requests WHERE created_at >= CURRENT_DATE) as daily_requests,
          (SELECT SUM(cost) FROM requests WHERE created_at >= CURRENT_DATE) as daily_revenue,
          (SELECT COUNT(*) FROM room_activities WHERE created_at >= CURRENT_TIMESTAMP - INTERVAL '1 hour') as hourly_activities
      `)
      
      return result.rows[0]
    } finally {
      client.release()
    }
  }
}

// Cache Service using Redis
export class CacheService {
  static async set(key: string, value: any, ttlSeconds?: number): Promise<void> {
    const redis = getRedisClient()
    const serialized = JSON.stringify(value)
    
    if (ttlSeconds) {
      await redis.setex(key, ttlSeconds, serialized)
    } else {
      await redis.set(key, serialized)
    }
  }
  
  static async get(key: string): Promise<any> {
    const redis = getRedisClient()
    const value = await redis.get(key)
    
    return value ? JSON.parse(value) : null
  }
  
  static async del(key: string): Promise<void> {
    const redis = getRedisClient()
    await redis.del(key)
  }
  
  static async incr(key: string): Promise<number> {
    const redis = getRedisClient()
    return await redis.incr(key)
  }
  
  static async setCounter(key: string, value: number, ttlSeconds?: number): Promise<void> {
    const redis = getRedisClient()
    
    if (ttlSeconds) {
      await redis.setex(key, ttlSeconds, value.toString())
    } else {
      await redis.set(key, value.toString())
    }
  }
}

// Cleanup connections
export const closeConnections = async (): Promise<void> => {
  if (pgPool) {
    await pgPool.end()
    console.log('PostgreSQL pool closed')
  }
  
  if (redisClient) {
    redisClient.disconnect()
    console.log('Redis client disconnected')
  }
}