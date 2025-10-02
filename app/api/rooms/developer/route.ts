import { NextRequest, NextResponse } from 'next/server'
import hallway from '../../../../lib/hallway'
import patterns from '../../../../lib/patterns'
import analytics from '../../../../lib/analytics'
import validationGates from '../../../../validation/gates'

export async function POST(request: NextRequest) {
  const startTime = Date.now()
  
  try {
    const { task, context = {}, sessionId } = await request.json()

    // Run validation gates first
    const validationResults = await validationGates.runAllGates({
      name: `Developer: ${task.name || 'Implementation'}`,
      estimatedCost: 0.00015,
      type: 'development',
      dataHandling: task.dataHandling || 'write',
      externalDependencies: task.dependencies || [],
      escapeRoute: task.escapeRoute || 'Code can be reverted via git rollback in <5 minutes',
      description: task.description || 'Implementation task',
      category: 'development',
      uiType: task.type === 'ui' ? 'ui' : 'other',
      colorUsage: task.colors,
      designPrinciples: ['cost-conscious', 'pattern-reuse']
    })

    // Check if any gates are blocking
    const blockers = validationResults.flatMap(r => r.blockers)
    if (blockers.length > 0) {
      return NextResponse.json({
        success: false,
        error: 'Validation gates blocked the operation',
        blockers,
        validationResults
      }, { status: 400 })
    }

    // Process development task
    const implementation = await processDevelopmentTask(task, context)
    const latency = Date.now() - startTime

    // Auto-capture successful implementation pattern
    if (implementation.success) {
      await patterns.capturePattern({
        name: `Implementation: ${task.name || task.type}`,
        description: task.description || 'Development implementation',
        approach: implementation.approach,
        implementation: implementation.code || JSON.stringify(implementation.result),
        cost: 0.00015,
        success: true,
        category: 'development',
        sourceOperation: 'developer_room_processing'
      })
    }

    // Check if handoff to quality needed
    if (implementation.needsTesting) {
      await hallway.handoff('developer', 'quality', {
        type: 'TESTING_REQUEST',
        implementation: implementation.result,
        testRequirements: implementation.testRequirements
      }, { originalTask: task, sessionId })
    }

    await analytics.logEvent('DEVELOPER_TASK_COMPLETED', {
      taskType: task.type,
      success: implementation.success,
      cost: 0.00015,
      latency,
      sessionId,
      linesOfCode: implementation.linesOfCode || 0
    })

    return NextResponse.json({
      success: true,
      room: 'developer',
      result: implementation,
      validationResults,
      cost: 0.00015,
      processingTime: latency
    })

  } catch (error) {
    console.error('Developer room error:', error)
    
    await analytics.logEvent('DEVELOPER_ERROR', {
      error: error?.message || 'Unknown error',
      processingTime: Date.now() - startTime
    })

    return NextResponse.json({
      success: false,
      error: 'Developer room processing failed'
    }, { status: 500 })
  }
}

async function processDevelopmentTask(task: any, context: any) {
  // Mock implementation - in production would use AI for code generation
  const implementations = {
    'api_endpoint': () => ({
      approach: 'EXPRESS_ROUTE_HANDLER',
      result: {
        endpoint: `/api/${task.name}`,
        method: task.method || 'GET',
        handler: 'async function handler(req, res) { /* implementation */ }',
        middleware: ['authentication', 'validation', 'rateLimit'],
        tests: ['unit', 'integration']
      },
      code: `
export async function ${task.method || 'GET'}(request: NextRequest) {
  try {
    const result = await process${task.name}()
    return NextResponse.json({ success: true, data: result })
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}`,
      success: true,
      needsTesting: true,
      testRequirements: ['Unit tests', 'Integration tests', 'Error handling tests'],
      linesOfCode: 12
    }),

    'ui_component': () => ({
      approach: 'REACT_FUNCTIONAL_COMPONENT',
      result: {
        component: task.name,
        props: task.props || [],
        styling: 'Tailwind CSS with Vegas palette',
        accessibility: 'WCAG 2.1 compliant',
        responsiveness: 'Mobile-first design'
      },
      code: `
export default function ${task.name}({ ${task.props?.join(', ') || ''} }) {
  return (
    <div className="bg-chocolate text-desert-sand p-4 rounded-lg">
      {/* Vegas-first implementation */}
    </div>
  )
}`,
      success: true,
      needsTesting: true,
      testRequirements: ['Component tests', 'Accessibility tests', 'Visual regression tests'],
      linesOfCode: 8
    }),

    'database_schema': () => ({
      approach: 'POSTGRESQL_SCHEMA',
      result: {
        tables: task.tables || ['main_table'],
        indexes: ['PRIMARY KEY', 'created_at', 'status'],
        constraints: ['NOT NULL', 'FOREIGN KEY'],
        migrations: 'Up/down migration scripts'
      },
      code: `
CREATE TABLE ${task.name} (
  id SERIAL PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX idx_${task.name}_created_at ON ${task.name}(created_at);`,
      success: true,
      needsTesting: true,
      testRequirements: ['Migration tests', 'Constraint tests', 'Performance tests'],
      linesOfCode: 6
    })
  }

  const processor = implementations[task.type as keyof typeof implementations]
  if (processor) {
    return processor()
  }

  // Default implementation
  return {
    approach: 'GENERIC_IMPLEMENTATION',
    result: {
      output: `Implementation for ${task.name}`,
      features: task.features || ['core functionality'],
      dependencies: task.dependencies || []
    },
    code: `// Implementation for ${task.name}\n// Cost-optimized and Vegas-compliant`,
    success: true,
    needsTesting: true,
    testRequirements: ['Basic functionality tests'],
    linesOfCode: 2
  }
}

export async function GET() {
  const context = await hallway.getContext('developer')
  
  return NextResponse.json({
    success: true,
    room: 'developer',
    capabilities: hallway.getRoomCapabilities('developer'),
    context,
    queueStatus: hallway.getQueueStatus()
  })
}