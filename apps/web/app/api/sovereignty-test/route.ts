import { NextResponse } from 'next/server';
import { calculateSovereigntyScore } from '../../../lib/sovereignty-metrics';

export async function GET() {
  try {
    const metrics = await calculateSovereigntyScore();
    
    return NextResponse.json({
      sovereignty_score: metrics.score,
      services: metrics.services,
      cost_per_request: metrics.costPerRequest,
      escape_velocity_hours: metrics.escapeVelocity,
      degraded: metrics.degraded,
      brand_compliance: metrics.brandCompliance,
      timestamp: new Date().toISOString(),
      message: metrics.score >= 80 
        ? 'The House maintains sovereignty! 🏠✨' 
        : `Sovereignty at ${metrics.score}% - ${Math.ceil(metrics.escapeVelocity)}h to full migration`
    });

  } catch (error) {
    return NextResponse.json({
      sovereignty_score: 0,
      services: { ollama: false, database: false, cache: false, vectors: false },
      cost_per_request: 0.001,
      escape_velocity_hours: 24,
      degraded: true,
      brand_compliance: { threeZs: true, vegasColors: true },
      error: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString(),
      message: 'Sovereignty compromised - immediate attention required! ⚠️'
    }, { status: 500 });
  }
}