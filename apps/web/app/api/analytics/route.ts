import { NextResponse } from 'next/server';
import { getAnalytics } from '../../../lib/analytics';

export async function GET(request: Request) {
  try {
    // Check authorization header
    const authHeader = request.headers.get('authorization');
    if (process.env.NODE_ENV === 'production' && !authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get analytics with caching
    const data = await getAnalytics();
    
    // Add sovereignty headers
    const response = NextResponse.json(data, { status: 200 });
    response.headers.set('X-Sovereignty-Score', data.sovereignty.score.toString());
    response.headers.set('X-Cost-Per-Request', data.costs.perRequest.toFixed(6));
    response.headers.set('Cache-Control', 'private, max-age=60');
    
    return response;
  } catch (error) {
    console.error('Analytics API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', timestamp: new Date().toISOString() },
      { status: 500 }
    );
  }
}
