import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Dynamic import to avoid build issues
    const { Pool } = await import('pg');
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });

    // Get sovereignty scores
    let scores: Array<{ vendor_name: string; sovereignty_score: number; lock_in_risk: string }> = [];
    try {
      const result = await pool.query(
        `SELECT vendor_name, sovereignty_score, lock_in_risk FROM sovereignty_scores ORDER BY sovereignty_score DESC`
      );
      scores = result.rows;
    } catch (error) {
      console.error('Error fetching sovereignty scores:', error);
    }

    // Calculate overall score
    const overallScore = scores.length > 0 
      ? scores.reduce((sum, s) => sum + s.sovereignty_score, 0) / scores.length 
      : 0;

    // Determine risk level
    let riskLevel = 'Unknown';
    if (overallScore >= 0.9) riskLevel = 'Very Low';
    else if (overallScore >= 0.7) riskLevel = 'Low';
    else if (overallScore >= 0.5) riskLevel = 'Medium';
    else if (overallScore >= 0.3) riskLevel = 'High';
    else riskLevel = 'Very High';

    const data = {
      scores,
      overallScore,
      riskLevel
    };

    await pool.end();
    
    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error('Sovereignty API error:', error);
    // Return mock data if database is unavailable
    return NextResponse.json({
      scores: [
        { vendor_name: 'Ollama', sovereignty_score: 1.0, lock_in_risk: 'None' },
        { vendor_name: 'PostgreSQL', sovereignty_score: 1.0, lock_in_risk: 'None' },
        { vendor_name: 'Redis', sovereignty_score: 0.95, lock_in_risk: 'Minimal' }
      ],
      overallScore: 0.98,
      riskLevel: 'Very Low'
    }, { status: 200 });
  }
}