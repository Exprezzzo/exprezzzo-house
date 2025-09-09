// Quick database connection test
require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

async function testDatabase() {
  console.log('DATABASE_URL from env:', process.env.DATABASE_URL);
  
  const pool = new Pool({ 
    connectionString: process.env.DATABASE_URL,
    max: 10,
  });
  
  try {
    console.log('Testing database connection...');
    
    // Test basic connection
    const client = await pool.connect();
    console.log('✅ Connected to database');
    
    // Test table existence
    const tableResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    console.log('✅ Tables found:', tableResult.rows.map(r => r.table_name));
    
    // Test specific query that's failing
    const requestResult = await client.query(`
      SELECT 
        COUNT(*)::int AS total_requests,
        COALESCE(SUM(estimated_cost), 0)::float AS total_cost,
        COALESCE(AVG(latency_ms), 0)::float AS avg_latency
      FROM request_log
      WHERE created_at > NOW() - INTERVAL '24 hours'
    `);
    console.log('✅ Request log query result:', requestResult.rows[0]);
    
    client.release();
    await pool.end();
    console.log('✅ Database test completed successfully');
    
  } catch (error) {
    console.error('❌ Database test failed:', error.message);
    console.error('Error details:', error);
  }
}

testDatabase();