import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

// Redis mock - replace with actual Redis client
const mockRedis = {
  async get(key: string) {
    // Mock stored user data
    const mockData: { [key: string]: any } = {
      'user:requests:user_vegas_001': '145',
      'user:cost:user_vegas_001': '0.145',
      'system:total_requests': '156789',
      'system:total_revenue': '156.789'
    }
    return mockData[key] || null
  },
  
  async set(key: string, value: string) {
    console.log(`Redis SET: ${key} = ${value}`)
    return 'OK'
  },
  
  async incr(key: string) {
    console.log(`Redis INCR: ${key}`)
    return Math.floor(Math.random() * 1000)
  }
}

export async function POST(request: NextRequest) {
  try {
    const { 
      userId, 
      requestType = 'chat', 
      model = 'llama3.2', 
      degrade = true 
    } = await request.json()

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    // Calculate cost based on request type and degrade flag
    let baseCost = 0.001 // $0.001 base cost
    
    // Pricing tiers (all degraded to $0.001 when degrade=true)
    const pricingTiers: { [key: string]: number } = {
      'chat': 0.001,
      'image': 0.002,
      'code': 0.001,
      'document': 0.000, // Free for library access
      'admin': 0.000     // Free for admin operations
    }

    const finalCost = degrade ? 0.001 : (pricingTiers[requestType] || 0.001)

    // Track user usage
    const userRequestsKey = `user:requests:${userId}`
    const userCostKey = `user:cost:${userId}`
    const systemRequestsKey = 'system:total_requests'
    const systemRevenueKey = 'system:total_revenue'

    // Increment counters
    await Promise.all([
      mockRedis.incr(userRequestsKey),
      mockRedis.incr(systemRequestsKey)
    ])

    // Update cost tracking
    const currentUserCost = parseFloat(await mockRedis.get(userCostKey) || '0')
    const newUserCost = currentUserCost + finalCost
    await mockRedis.set(userCostKey, newUserCost.toString())

    const currentSystemRevenue = parseFloat(await mockRedis.get(systemRevenueKey) || '0')
    const newSystemRevenue = currentSystemRevenue + finalCost
    await mockRedis.set(systemRevenueKey, newSystemRevenue.toString())

    // Create billing record
    const billingRecord = {
      id: `bill_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId,
      requestType,
      model,
      cost: finalCost,
      degraded: degrade,
      timestamp: new Date().toISOString(),
      status: 'completed'
    }

    return NextResponse.json({
      success: true,
      billing: billingRecord,
      userTotal: newUserCost,
      systemStats: {
        totalRequests: await mockRedis.get(systemRequestsKey),
        totalRevenue: newSystemRevenue
      },
      pricing: {
        baseCost: pricingTiers[requestType] || 0.001,
        finalCost,
        degraded: degrade,
        savings: degrade ? (pricingTiers[requestType] || 0.001) - finalCost : 0
      }
    })

  } catch (error) {
    console.error('Pricing API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    // Get user statistics
    const userRequests = await mockRedis.get(`user:requests:${userId}`) || '0'
    const userCost = await mockRedis.get(`user:cost:${userId}`) || '0'
    const systemRequests = await mockRedis.get('system:total_requests') || '0'
    const systemRevenue = await mockRedis.get('system:total_revenue') || '0'

    return NextResponse.json({
      user: {
        id: userId,
        totalRequests: parseInt(userRequests),
        totalCost: parseFloat(userCost),
        avgCostPerRequest: parseFloat(userCost) / Math.max(parseInt(userRequests), 1)
      },
      system: {
        totalRequests: parseInt(systemRequests),
        totalRevenue: parseFloat(systemRevenue),
        avgRevenuePerRequest: parseFloat(systemRevenue) / Math.max(parseInt(systemRequests), 1)
      },
      pricing: {
        chat: 0.001,
        image: 0.002,
        code: 0.001,
        document: 0.000,
        admin: 0.000
      },
      degrade: {
        enabled: true,
        targetCost: 0.001,
        description: "All requests degraded to $0.001 for sovereign operation"
      }
    })

  } catch (error) {
    console.error('Pricing GET error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}