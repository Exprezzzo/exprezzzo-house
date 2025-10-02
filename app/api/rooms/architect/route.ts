import { NextRequest, NextResponse } from 'next/server'
import hallway from '../../../../lib/hallway'
import patterns from '../../../../lib/patterns'
import analytics from '../../../../lib/analytics'
import costGuard from '../../../../lib/cost-guard'

export async function POST(request: NextRequest) {
  const startTime = Date.now()
  
  try {
    const { task, context = {}, sessionId } = await request.json()

    if (!task) {
      return NextResponse.json({
        success: false,
        error: 'Task is required'
      }, { status: 400 })
    }

    // Cost validation
    const estimatedCost = 0.00012 // Architect room processing cost
    const costCheck = await costGuard.checkCost(estimatedCost, 'architect_processing')
    
    if (!costCheck.allowed) {
      return NextResponse.json({
        success: false,
        error: 'Request blocked by cost guard',
        reason: costCheck.reason,
        degraded: costCheck.degraded
      }, { status: 429 })
    }

    // Check for reusable patterns first
    const existingPattern = await patterns.findReusablePattern(
      `architecture design ${task.type || ''} ${task.description || ''}`,
      'architecture',
      estimatedCost
    )

    if (existingPattern) {
      const result = {
        approach: 'PATTERN_REUSE',
        pattern: existingPattern,
        architecture: JSON.parse(existingPattern.implementation),
        recommendations: [
          'Using proven architecture pattern',
          `Success rate: ${(existingPattern.successRate * 100).toFixed(1)}%`,
          `Cost savings: $${(estimatedCost - existingPattern.cost).toFixed(6)}`
        ],
        cost: existingPattern.cost
      }

      await analytics.logEvent('ARCHITECT_PATTERN_REUSED', {
        patternId: existingPattern.id,
        task: task.type,
        costSavings: estimatedCost - existingPattern.cost,
        sessionId
      })

      return NextResponse.json({
        success: true,
        room: 'architect',
        result,
        patternReused: true,
        processingTime: Date.now() - startTime
      })
    }

    // Process architecture task
    const architecture = await processArchitectureTask(task, context)
    const latency = Date.now() - startTime

    // Auto-capture successful pattern
    if (architecture.success) {
      await patterns.capturePattern({
        name: `Architecture: ${task.type || 'System Design'}`,
        description: task.description || 'System architecture design',
        approach: architecture.approach,
        implementation: JSON.stringify(architecture.design),
        cost: costCheck.adjustedCost || estimatedCost,
        success: true,
        category: 'architecture',
        sourceOperation: 'architect_room_processing'
      })
    }

    // Check if handoff needed
    if (architecture.needsImplementation) {
      await hallway.handoff('architect', 'developer', {
        type: 'IMPLEMENTATION_REQUEST',
        architecture: architecture.design,
        requirements: architecture.requirements
      }, { originalTask: task, sessionId })
    }

    await analytics.logEvent('ARCHITECT_TASK_COMPLETED', {
      taskType: task.type,
      success: architecture.success,
      cost: costCheck.adjustedCost || estimatedCost,
      latency,
      sessionId,
      handoffRequired: architecture.needsImplementation
    })

    return NextResponse.json({
      success: true,
      room: 'architect',
      result: architecture,
      cost: costCheck.adjustedCost || estimatedCost,
      processingTime: latency,
      degraded: costCheck.degraded
    })

  } catch (error) {
    console.error('Architect room error:', error)
    
    await analytics.logEvent('ARCHITECT_ERROR', {
      error: error?.message || 'Unknown error',
      processingTime: Date.now() - startTime
    })

    return NextResponse.json({
      success: false,
      error: 'Architect room processing failed'
    }, { status: 500 })
  }
}

async function processArchitectureTask(task: any, context: any) {
  // Mock architecture processing - in production would use AI models
  const taskTypes = {
    'system_design': () => ({
      approach: 'MICROSERVICES_ARCHITECTURE',
      design: {
        components: ['API Gateway', 'Auth Service', 'Data Layer', 'Cache Layer'],
        patterns: ['Circuit Breaker', 'Retry Pattern', 'Bulkhead'],
        technologies: ['Node.js', 'PostgreSQL', 'Redis', 'Docker'],
        scalability: 'Horizontal scaling with load balancers',
        security: 'OAuth2 + JWT, input validation, rate limiting'
      },
      requirements: [
        'Implement API Gateway with rate limiting',
        'Set up authentication service',
        'Configure PostgreSQL with connection pooling',
        'Implement caching strategy with Redis'
      ],
      success: true,
      needsImplementation: true
    }),
    
    'database_design': () => ({
      approach: 'NORMALIZED_RELATIONAL',
      design: {
        tables: ['users', 'sessions', 'transactions', 'audit_log'],
        relationships: ['users->sessions (1:n)', 'users->transactions (1:n)'],
        indexes: ['user_id', 'created_at', 'status'],
        constraints: ['FK constraints', 'Check constraints', 'Unique constraints'],
        performance: 'Optimized for read-heavy workloads'
      },
      requirements: [
        'Create normalized table structure',
        'Implement proper indexing strategy',
        'Set up foreign key relationships',
        'Add performance monitoring'
      ],
      success: true,
      needsImplementation: true
    }),

    'api_design': () => ({
      approach: 'REST_WITH_GRAPHQL',
      design: {
        endpoints: ['/api/v1/users', '/api/v1/sessions', '/graphql'],
        methods: ['GET', 'POST', 'PUT', 'DELETE'],
        authentication: 'Bearer token authentication',
        validation: 'JSON schema validation',
        documentation: 'OpenAPI 3.0 specification'
      },
      requirements: [
        'Implement REST endpoints with proper HTTP methods',
        'Set up GraphQL endpoint for complex queries',
        'Add request validation and error handling',
        'Generate API documentation'
      ],
      success: true,
      needsImplementation: true
    })
  }

  const processor = taskTypes[task.type as keyof typeof taskTypes]
  if (processor) {
    return processor()
  }

  // Default generic architecture
  return {
    approach: 'MODULAR_DESIGN',
    design: {
      modules: ['Core', 'Interface', 'Data', 'Utilities'],
      principles: ['Single Responsibility', 'Open/Closed', 'Dependency Injection'],
      patterns: ['Factory', 'Observer', 'Strategy'],
      testing: 'Unit + Integration + E2E testing strategy'
    },
    requirements: [
      'Implement modular architecture',
      'Apply SOLID principles',
      'Add comprehensive testing',
      'Document architecture decisions'
    ],
    success: true,
    needsImplementation: true
  }
}

export async function GET() {
  const context = await hallway.getContext('architect')
  const stats = patterns.getBankStats()
  
  return NextResponse.json({
    success: true,
    room: 'architect',
    capabilities: hallway.getRoomCapabilities('architect'),
    context,
    patternStats: stats,
    queueStatus: hallway.getQueueStatus()
  })
}