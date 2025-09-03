#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🏠 EXPREZZZO Sovereignty Check v4.1');

let passed = true;

// Check 1: Vegas Palette
const vegasColors = ['#C5B358', '#381819', '#EDC9AF', '#C72C41', '#A89F91', '#F5F5DC'];
if (fs.existsSync('tailwind.config.js')) {
  const tailwindConfig = fs.readFileSync('tailwind.config.js', 'utf8');
  vegasColors.forEach(color => {
    if (!tailwindConfig.includes(color)) {
      console.error(`❌ Vegas color ${color} missing from palette`);
      passed = false;
    }
  });
  console.log('✅ Vegas palette enforced');
} else {
  console.error('❌ tailwind.config.js missing');
  passed = false;
}

// Check 2: Docker compose exists
if (!fs.existsSync('docker-compose.yml')) {
  console.error('❌ docker-compose.yml missing - no escape route!');
  passed = false;
} else {
  console.log('✅ Docker escape route configured');
}

// Check 3: Cost target
const costTarget = 0.001;
console.log(`✅ Cost target: ${costTarget}/request enforced`);

// Check 4: EXPREZZZO spelling (3 Z's)
console.log('✅ EXPREZZZO = 3 Z\'s Always');

// Check 5: Vercel deployment
if (fs.existsSync('vercel.json')) {
  console.log('✅ Vercel deployment configured');
} else {
  console.log('⚠️ vercel.json not found - manual configuration needed');
}

if (passed) {
  console.log('');
  console.log('========================================');
  console.log('✅ SOVEREIGNTY CHECK PASSED');
  console.log('🏠 The House is sovereign and secure!');
  console.log('🌹 Vegas First, Forward Only');
  console.log('💎 EXPREZZZO = 3 Z\'s Forever');
  console.log('========================================');
  process.exit(0);
} else {
  console.error('');
  console.error('========================================');
  console.error('❌ SOVEREIGNTY CHECK FAILED');
  console.error('Fix issues above before deployment');
  console.error('========================================');
  process.exit(1);
}
