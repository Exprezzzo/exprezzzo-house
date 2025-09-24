import { NextRequest, NextResponse } from 'next/server'
import analytics from '../../../lib/analytics'

export async function GET(request: NextRequest) {
  try {
    const summary = await analytics.getMetricsSummary()
    const degraded = analytics.getDegradedStatus()
    const recentEvents = analytics.getRecentEvents(20)

    return NextResponse.json({
      success: true,
      data: {
        summary,
        degraded,
        recentEvents: recentEvents.map(e => ({
          type: e.type,
          timestamp: e.timestamp,
          costImpact: e.costImpact,
          data: e.data
        }))
      }
    })
  } catch (error) {
    console.error('Analytics API error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch analytics data'
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { type, data, costImpact } = await request.json()
    
    if (!type) {
      return NextResponse.json({
        success: false,
        error: 'Event type is required'
      }, { status: 400 })
    }

    await analytics.logEvent(type, data, costImpact || 0)

    return NextResponse.json({
      success: true,
      message: 'Event logged successfully'
    })
  } catch (error) {
    console.error('Analytics logging error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to log event'
    }, { status: 500 })
  }
}