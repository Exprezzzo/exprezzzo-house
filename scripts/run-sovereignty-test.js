#!/usr/bin/env node

const { testSovereignty } = require('../api/sovereignty-test.js');

async function runTest() {
  console.log('🏠 Running EXPREZZZO Sovereignty Test...\n');
  
  try {
    // Set default environment variables if not set
    process.env.OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
    process.env.NEXT_PUBLIC_SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:3000';
    
    const result = await testSovereignty();
    
    console.log('📊 Sovereignty Test Results:');
    console.log('================================');
    console.log(`🎯 Sovereignty Score: ${result.sovereignty_score}%`);
    console.log(`⚡ Degraded Mode: ${result.degraded ? 'YES' : 'NO'}`);
    console.log(`💰 Cost per Request: $${result.cost_per_request}`);
    console.log('================================');
    
    if (result.sovereignty_score >= 80) {
      console.log('✅ SOVEREIGNTY TEST PASSED');
      console.log('🏠 The House maintains sovereignty!');
      process.exit(0);
    } else {
      console.log('❌ SOVEREIGNTY TEST FAILED');
      console.log('⚠️  House sovereignty compromised!');
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Sovereignty test failed:', error.message);
    process.exit(1);
  }
}

runTest();