#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

// Vegas palette (immutable)
const VEGAS_COLORS = ['#C5B358','#381819','#EDC9AF','#C72C41','#A89F91','#F5F5DC'];
const VEGAS_SET = new Set(VEGAS_COLORS.map(c => c.toLowerCase()));

// Pattern matchers
const HEX_PATTERN = /#[0-9a-fA-F]{6}\b/g;
const HEX_SHORT_PATTERN = /#[0-9a-fA-F]{3}\b/g;
const RGB_PATTERN = /rgb\s*\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*\)/g;
const RGBA_PATTERN = /rgba\s*\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*,\s*[\d.]+\s*\)/g;

let violations = [];
let filesScanned = 0;
let totalColors = 0;

// Recursive file scanner
function scanDirectory(dir, extensions) {
  if (!fs.existsSync(dir)) return [];
  
  let files = [];
  const items = fs.readdirSync(dir, { withFileTypes: true });
  
  for (const item of items) {
    const fullPath = path.join(dir, item.name);
    
    // Skip node_modules and hidden directories
    if (item.name.startsWith('.') || item.name === 'node_modules') continue;
    
    if (item.isDirectory()) {
      files = files.concat(scanDirectory(fullPath, extensions));
    } else if (item.isFile()) {
      const ext = path.extname(item.name);
      if (extensions.includes(ext)) {
        files.push(fullPath);
      }
    }
  }
  
  return files;
}

// Check file for color violations
function checkFile(filePath) {
  filesScanned++;
  const content = fs.readFileSync(filePath, 'utf8');
  
  // Find all color references
  const hexColors = content.match(HEX_PATTERN) || [];
  const shortHexColors = content.match(HEX_SHORT_PATTERN) || [];
  const rgbColors = content.match(RGB_PATTERN) || [];
  const rgbaColors = content.match(RGBA_PATTERN) || [];
  
  const allColors = [...hexColors, ...shortHexColors, ...rgbColors, ...rgbaColors];
  totalColors += allColors.length;
  
  // Check each color
  for (const color of hexColors) {
    if (!VEGAS_SET.has(color.toLowerCase())) {
      violations.push({
        file: filePath,
        color: color,
        line: getLineNumber(content, color)
      });
    }
  }
  
  // Expand short hex colors and check
  for (const color of shortHexColors) {
    const expanded = color.replace(/#(.)(.)(.)/, '#$1$1$2$2$3$3');
    if (!VEGAS_SET.has(expanded.toLowerCase())) {
      violations.push({
        file: filePath,
        color: color,
        line: getLineNumber(content, color)
      });
    }
  }
}

// Get line number for violation
function getLineNumber(content, searchStr) {
  const lines = content.split('\n');
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes(searchStr)) {
      return i + 1;
    }
  }
  return 0;
}

// Main execution
console.log('🎨 EXPREZZZO Sovereignty Check - Vegas Palette Enforcement');
console.log('=========================================================');
console.log(`Allowed colors: ${VEGAS_COLORS.join(', ')}`);
console.log('');

// Scan source files
const sourceDirs = [
  'apps/web/app',
  'apps/web/components',
  'apps/web/styles',
  'lib',
  'components'
];

const fileExtensions = ['.tsx', '.ts', '.jsx', '.js', '.css', '.scss', '.sass'];

console.log('Scanning directories...');
for (const dir of sourceDirs) {
  if (fs.existsSync(dir)) {
    console.log(`  📁 ${dir}`);
    const files = scanDirectory(dir, fileExtensions);
    files.forEach(checkFile);
  }
}

// Check compiled CSS if it exists
if (fs.existsSync('apps/web/.next/static/css')) {
  console.log('  📁 apps/web/.next/static/css (compiled)');
  const compiledFiles = scanDirectory('apps/web/.next/static/css', ['.css']);
  compiledFiles.forEach(checkFile);
}

// Report results
console.log('');
console.log('Results:');
console.log(`  Files scanned: ${filesScanned}`);
console.log(`  Total colors found: ${totalColors}`);
console.log(`  Violations: ${violations.length}`);

if (violations.length === 0) {
  console.log('');
  console.log('✅ Vegas palette enforced - All colors are sovereign!');
  console.log('🌹 The House maintains its aesthetic sovereignty');
  process.exit(0);
} else {
  console.log('');
  console.error('❌ Vegas palette violations detected:');
  console.error('=====================================');
  for (const violation of violations) {
    console.error(`  File: ${violation.file}`);
    console.error(`  Line: ${violation.line}`);
    console.error(`  Color: ${violation.color} (not in Vegas palette)`);
    console.error('  ---');
  }
  console.error('');
  console.error(`Total violations: ${violations.length}`);
  console.error('Fix these violations to maintain House sovereignty!');
  process.exit(1);
}
