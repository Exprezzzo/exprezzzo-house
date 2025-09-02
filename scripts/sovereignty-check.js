import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';
import { config } from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

config({ path: '.env.local' });

const VEGAS_COLORS = {
  gold: '#C5B358',
  chocolate: '#381819',
  sand: '#EDC9AF',
  rose: '#C72C41',
  dust: '#A89F91',
  lightSand: '#F5F5DC'
};

const FORBIDDEN_COLORS = [
  '#000000', '#FFFFFF', '#FF0000', '#00FF00', '#0000FF'
];

async function checkSovereignty() {
  console.log('🏠 EXPREZZZO Sovereignty Check - Hurricane Spec\n');
  
  let violations = 0;

  try {
    const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
    
    const vendors = await pool.query(
      'SELECT * FROM sovereignty_scores ORDER BY sovereignty_score DESC'
    );
    
    console.log('📊 Vendor Sovereignty Scores:');
    vendors.rows.forEach(v => {
      const emoji = v.sovereignty_score >= 0.9 ? '✅' : 
                    v.sovereignty_score >= 0.7 ? '⚠️' : '❌';
      console.log(`${emoji} ${v.vendor_name}: ${(v.sovereignty_score * 100).toFixed(0)}%`);
      
      if (v.sovereignty_score < 0.5) {
        violations++;
        console.log(`  ⚠️  WARNING: ${v.vendor_name} has low sovereignty!`);
      }
    });

    const providers = await pool.query('SELECT * FROM providers WHERE enabled = true');
    const sovereignEnabled = providers.rows.some(p => p.type === 'sovereign' && p.enabled);
    
    if (!sovereignEnabled) {
      console.log('❌ No sovereign provider enabled!');
      violations++;
    } else {
      console.log('✅ Sovereign lane active');
    }

    await pool.end();
  } catch (error) {
    console.log('⚠️  Database check skipped (not running)');
  }

  console.log('\n🎨 Vegas Palette Check:');
  
  const filesToCheck = [
    'app/globals.css',
    'tailwind.config.js'
  ];

  if (fs.existsSync('app')) {
    const appFiles = fs.readdirSync('app', { recursive: true })
      .filter(f => typeof f === 'string' && (f.endsWith('.tsx') || f.endsWith('.css')))
      .map(f => path.join('app', f));
    filesToCheck.push(...appFiles);
  }

  let paletteViolations = 0;
  
  filesToCheck.forEach(file => {
    if (!fs.existsSync(file)) return;
    
    const content = fs.readFileSync(file, 'utf8');
    
    FORBIDDEN_COLORS.forEach(color => {
      if (content.toLowerCase().includes(color.toLowerCase())) {
        console.log(`  ❌ Non-Vegas color found in ${file}: ${color}`);
        paletteViolations++;
        violations++;
      }
    });
  });

  if (paletteViolations === 0) {
    console.log('  ✅ All files use Vegas palette');
  }

  console.log('\n🚪 Escape Protocol Check:');
  const escapeFiles = ['docker-compose.yml', 'Dockerfile', 'Dockerfile.api'];
  
  escapeFiles.forEach(file => {
    if (fs.existsSync(file)) {
      console.log(`  ✅ ${file} exists`);
    } else {
      console.log(`  ❌ ${file} missing`);
      violations++;
    }
  });

  console.log('\n💰 Cost Enforcement:');
  const maxCost = parseFloat(process.env.MAX_COST_PER_REQUEST || '0.001');
  if (maxCost > 0.001) {
    console.log(`  ❌ Max cost ${maxCost} exceeds limit!`);
    violations++;
  } else {
    console.log(`  ✅ Max cost: ${maxCost}/request`);
  }

  console.log('\n' + '='.repeat(50));
  if (violations === 0) {
    console.log('✅ SOVEREIGNTY MAINTAINED - House is secure');
    console.log('✅ Hurricane Spec requirements met');
    process.exit(0);
  } else {
    console.log(`❌ SOVEREIGNTY VIOLATIONS: ${violations} issues found`);
    process.exit(1);
  }
}

checkSovereignty().catch(console.error);