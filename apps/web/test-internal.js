// Test connection from inside container
const { Pool } = require('pg');

async function testInternal() {
  // Try connecting to the container's internal network
  const pool = new Pool({ 
    host: 'exprezzzo-postgres',  // Container hostname
    port: 5432,
    user: 'exprezzzo',
    password: 'sovereign', 
    database: 'exprezzzo_house',
    max: 10,
  });
  
  try {
    console.log('Testing connection to container network...');
    
    const client = await pool.connect();
    console.log('✅ Connected');
    
    const tables = await client.query(`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public'
    `);
    console.log('Tables found:', tables.rows.map(r => r.tablename));
    
    // Test the specific query that's failing
    const result = await client.query(`
      SELECT 
        COUNT(*)::int AS total_requests,
        COALESCE(SUM(estimated_cost), 0)::float AS total_cost,
        COALESCE(AVG(latency_ms), 0)::float AS avg_latency
      FROM request_log
      WHERE created_at > NOW() - INTERVAL '24 hours'
    `);
    console.log('Query result:', result.rows[0]);
    
    client.release();
    await pool.end();
    console.log('✅ Internal connection test passed');
    
  } catch (error) {
    console.error('❌ Internal test failed:', error.message);
  }
}

testInternal();