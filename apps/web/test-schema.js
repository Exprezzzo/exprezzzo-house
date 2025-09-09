// Test schema access
require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

async function testSchema() {
  const pool = new Pool({ 
    connectionString: process.env.DATABASE_URL,
    max: 10,
  });
  
  try {
    console.log('DATABASE_URL:', process.env.DATABASE_URL);
    
    const client = await pool.connect();
    
    // Check current database and schema
    const currentDb = await client.query('SELECT current_database(), current_schema()');
    console.log('Current database and schema:', currentDb.rows[0]);
    
    // Check search path
    const searchPath = await client.query('SHOW search_path');
    console.log('Search path:', searchPath.rows[0]);
    
    // Check all schemas
    const schemas = await client.query(`
      SELECT schema_name 
      FROM information_schema.schemata 
      WHERE schema_name NOT LIKE 'pg_%' 
      AND schema_name != 'information_schema'
    `);
    console.log('Available schemas:', schemas.rows.map(r => r.schema_name));
    
    // Check tables in public schema specifically
    const publicTables = await client.query(`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public'
    `);
    console.log('Tables in public schema:', publicTables.rows.map(r => r.tablename));
    
    // Try to access request_log directly with schema qualification
    const directQuery = await client.query('SELECT COUNT(*) FROM public.request_log');
    console.log('Direct query result:', directQuery.rows[0]);
    
    client.release();
    await pool.end();
    
  } catch (error) {
    console.error('Schema test failed:', error.message);
  }
}

testSchema();