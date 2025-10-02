import { promises as fs } from 'fs'
import path from 'path'
import analytics from './analytics'
import costGuard from './cost-guard'
import patterns from './patterns'

interface FeatureSpec {
  id: string
  name: string
  description: string
  requirements: string[]
  architecture: {
    components: string[]
    endpoints: string[]
    database: string[]
    dependencies: string[]
  }
  implementation: {
    phases: ImplementationPhase[]
    totalEstimatedCost: number
    totalEstimatedTime: string
    riskFactors: string[]
  }
  validation: {
    criteria: string[]
    testCases: string[]
    successMetrics: string[]
  }
  sovereignty: {
    escapeRoute: string
    backupStrategy: string
    costLimits: {
      development: number
      operation: number
    }
  }
  generatedAt: string
  lastUpdated: string
}

interface ImplementationPhase {
  name: string
  description: string
  tasks: string[]
  estimatedCost: number
  dependencies: string[]
  deliverables: string[]
}

class PlanningSystem {
  private specsDirectory = path.join(process.cwd(), 'specs')

  async generateSpec(request: {
    feature: string
    description: string
    requirements?: string[]
    context?: any
  }): Promise<FeatureSpec> {

    // Cost validation for spec generation
    const specGenerationCost = 0.00008
    const costCheck = await costGuard.checkCost(specGenerationCost, 'spec_generation')
    
    if (!costCheck.allowed) {
      throw new Error(`Spec generation blocked: ${costCheck.reason}`)
    }

    // Check for existing patterns
    const relatedPatterns = await patterns.findReusablePattern(
      `${request.feature} ${request.description}`,
      undefined,
      0.0002
    )

    const specId = `spec_${Date.now()}_${request.feature.toLowerCase().replace(/\s+/g, '_')}`
    
    const spec: FeatureSpec = {
      id: specId,
      name: request.feature,
      description: request.description,
      requirements: request.requirements || await this.generateRequirements(request),
      architecture: await this.generateArchitecture(request, relatedPatterns),
      implementation: await this.generateImplementationPlan(request, relatedPatterns),
      validation: await this.generateValidationPlan(request),
      sovereignty: await this.generateSovereigntyPlan(request),
      generatedAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString()
    }

    // Save spec to file
    await this.saveSpec(spec)

    // Log analytics
    await analytics.logEvent('SPEC_GENERATED', {
      specId,
      feature: request.feature,
      cost: costCheck.adjustedCost || specGenerationCost,
      patternsReferenced: relatedPatterns ? 1 : 0,
      phases: spec.implementation.phases.length
    })

    return spec
  }

  private async generateRequirements(request: any): Promise<string[]> {
    // Base requirements for any EXPREZZZO feature
    const baseRequirements = [
      'Must operate under $0.0002 per request cost limit',
      'Must support Hurricane v4.1 degraded mode',
      'Must integrate with existing analytics system',
      'Must follow Vegas-first design principles',
      'Must include sovereignty escape mechanisms'
    ]

    // Feature-specific requirements based on type
    const featureRequirements = this.getFeatureSpecificRequirements(request.feature, request.description)
    
    return [...baseRequirements, ...featureRequirements]
  }

  private getFeatureSpecificRequirements(feature: string, description: string): string[] {
    const text = `${feature} ${description}`.toLowerCase()
    const requirements = []

    if (text.includes('api') || text.includes('endpoint')) {
      requirements.push(
        'Must implement proper HTTP status codes',
        'Must include request/response validation',
        'Must support authentication and authorization',
        'Must include rate limiting'
      )
    }

    if (text.includes('database') || text.includes('data')) {
      requirements.push(
        'Must use PostgreSQL with proper indexing',
        'Must implement connection pooling',
        'Must include data migration strategy',
        'Must support backup and recovery'
      )
    }

    if (text.includes('ui') || text.includes('interface') || text.includes('component')) {
      requirements.push(
        'Must follow Vegas color palette',
        'Must be responsive and accessible',
        'Must include loading states',
        'Must support error handling'
      )
    }

    if (text.includes('payment') || text.includes('billing') || text.includes('money')) {
      requirements.push(
        'Must integrate with Stripe and PayPal',
        'Must include fraud detection',
        'Must support refunds and disputes',
        'Must comply with PCI standards'
      )
    }

    return requirements
  }

  private async generateArchitecture(request: any, relatedPattern: any): Promise<FeatureSpec['architecture']> {
    const components = ['Core Module', 'API Layer', 'Data Layer']
    const endpoints = []
    const database = []
    const dependencies = ['analytics', 'cost-guard']

    const text = `${request.feature} ${request.description}`.toLowerCase()

    // Add components based on feature type
    if (text.includes('api')) {
      endpoints.push(`/api/${request.feature.toLowerCase().replace(/\s+/g, '-')}`)
      components.push('Request Validator', 'Response Formatter')
    }

    if (text.includes('database') || text.includes('data')) {
      database.push(`${request.feature.toLowerCase().replace(/\s+/g, '_')}_table`)
      components.push('Data Access Layer', 'Migration Scripts')
      dependencies.push('pg')
    }

    if (text.includes('ui') || text.includes('component')) {
      components.push('UI Components', 'State Management')
      dependencies.push('react', 'tailwindcss')
    }

    if (text.includes('payment')) {
      components.push('Payment Processor', 'Transaction Logger')
      dependencies.push('stripe', 'paypal')
    }

    // Leverage pattern if available
    if (relatedPattern) {
      const patternArch = JSON.parse(relatedPattern.implementation)
      if (patternArch.components) {
        components.push(...patternArch.components.filter((c: string) => !components.includes(c)))
      }
    }

    return { components, endpoints, database, dependencies }
  }

  private async generateImplementationPlan(request: any, relatedPattern: any): Promise<FeatureSpec['implementation']> {
    const phases: ImplementationPhase[] = []
    let totalCost = 0

    // Phase 1: Planning and Setup
    const planningPhase: ImplementationPhase = {
      name: 'Planning and Setup',
      description: 'Project initialization and infrastructure setup',
      tasks: [
        'Create project structure',
        'Set up development environment',
        'Configure CI/CD pipeline',
        'Initialize database schemas'
      ],
      estimatedCost: 0.00003,
      dependencies: [],
      deliverables: ['Project structure', 'Development environment', 'CI/CD configuration']
    }
    phases.push(planningPhase)
    totalCost += planningPhase.estimatedCost

    // Phase 2: Core Implementation
    const corePhase: ImplementationPhase = {
      name: 'Core Implementation',
      description: 'Main feature development',
      tasks: [
        'Implement core functionality',
        'Add error handling',
        'Integrate with existing systems',
        'Add logging and analytics'
      ],
      estimatedCost: relatedPattern ? relatedPattern.cost * 1.2 : 0.00008,
      dependencies: ['Planning and Setup'],
      deliverables: ['Core functionality', 'Integration points', 'Error handling']
    }
    phases.push(corePhase)
    totalCost += corePhase.estimatedCost

    // Phase 3: Testing and Validation
    const testingPhase: ImplementationPhase = {
      name: 'Testing and Validation',
      description: 'Comprehensive testing and quality assurance',
      tasks: [
        'Write unit tests',
        'Implement integration tests',
        'Perform user acceptance testing',
        'Validate cost constraints'
      ],
      estimatedCost: 0.00004,
      dependencies: ['Core Implementation'],
      deliverables: ['Test suite', 'Test reports', 'Quality metrics']
    }
    phases.push(testingPhase)
    totalCost += testingPhase.estimatedCost

    // Phase 4: Deployment and Monitoring
    const deploymentPhase: ImplementationPhase = {
      name: 'Deployment and Monitoring',
      description: 'Production deployment and monitoring setup',
      tasks: [
        'Deploy to production',
        'Set up monitoring and alerts',
        'Configure backup systems',
        'Document deployment procedures'
      ],
      estimatedCost: 0.00002,
      dependencies: ['Testing and Validation'],
      deliverables: ['Production deployment', 'Monitoring dashboard', 'Documentation']
    }
    phases.push(deploymentPhase)
    totalCost += deploymentPhase.estimatedCost

    return {
      phases,
      totalEstimatedCost: totalCost,
      totalEstimatedTime: this.estimateTimeFromCost(totalCost),
      riskFactors: this.identifyRiskFactors(request, totalCost)
    }
  }

  private async generateValidationPlan(request: any): Promise<FeatureSpec['validation']> {
    const criteria = [
      'Feature meets all specified requirements',
      'Cost remains under $0.0002 per request',
      'Performance meets latency requirements',
      'Security validations pass',
      'Integration tests pass'
    ]

    const testCases = [
      'Happy path functionality test',
      'Error handling validation',
      'Cost constraint verification',
      'Load testing under degraded mode',
      'Security penetration testing'
    ]

    const successMetrics = [
      'All tests pass with >95% success rate',
      'Cost stays below Hurricane v4.1 limits',
      'Latency <500ms for 99% of requests',
      'Zero critical security vulnerabilities',
      'Pattern successfully captured for reuse'
    ]

    return { criteria, testCases, successMetrics }
  }

  private async generateSovereigntyPlan(request: any): Promise<FeatureSpec['sovereignty']> {
    return {
      escapeRoute: 'Feature can be disabled via feature flag with <1 minute rollback time',
      backupStrategy: 'All data backed up to sovereignty export system with 0.64s recovery',
      costLimits: {
        development: 0.001, // Higher limit for development
        operation: 0.0002  // Hurricane v4.1 operational limit
      }
    }
  }

  private estimateTimeFromCost(cost: number): string {
    // Rough time estimation based on cost
    const hours = Math.max(1, Math.floor(cost * 10000)) // $0.0001 = ~1 hour
    if (hours < 24) return `${hours} hours`
    const days = Math.ceil(hours / 8) // 8 hour work days
    return `${days} days`
  }

  private identifyRiskFactors(request: any, cost: number): string[] {
    const risks = []
    
    if (cost > 0.00015) {
      risks.push('High cost implementation - close monitoring required')
    }

    const text = `${request.feature} ${request.description}`.toLowerCase()
    
    if (text.includes('payment') || text.includes('money')) {
      risks.push('Financial operations - extra security validation needed')
    }

    if (text.includes('database') || text.includes('migration')) {
      risks.push('Data operations - backup and rollback plan essential')
    }

    if (text.includes('api') || text.includes('external')) {
      risks.push('External dependencies - fallback mechanisms required')
    }

    return risks
  }

  private async saveSpec(spec: FeatureSpec): Promise<void> {
    // Ensure specs directory exists
    try {
      await fs.access(this.specsDirectory)
    } catch {
      await fs.mkdir(this.specsDirectory, { recursive: true })
    }

    // Create feature-specific directory
    const featureDir = path.join(this.specsDirectory, spec.id)
    await fs.mkdir(featureDir, { recursive: true })

    // Save spec as JSON
    const specPath = path.join(featureDir, 'spec.json')
    await fs.writeFile(specPath, JSON.stringify(spec, null, 2))

    // Save as markdown for human readability
    const markdownPath = path.join(featureDir, 'plan.md')
    const markdown = this.generateMarkdownSpec(spec)
    await fs.writeFile(markdownPath, markdown)
  }

  private generateMarkdownSpec(spec: FeatureSpec): string {
    return `# ${spec.name}

## Description
${spec.description}

## Requirements
${spec.requirements.map(req => `- ${req}`).join('\n')}

## Architecture

### Components
${spec.architecture.components.map(comp => `- ${comp}`).join('\n')}

### Endpoints
${spec.architecture.endpoints.map(ep => `- ${ep}`).join('\n')}

### Database
${spec.architecture.database.map(db => `- ${db}`).join('\n')}

### Dependencies
${spec.architecture.dependencies.map(dep => `- ${dep}`).join('\n')}

## Implementation Plan

**Total Estimated Cost:** $${spec.implementation.totalEstimatedCost.toFixed(6)}
**Total Estimated Time:** ${spec.implementation.totalEstimatedTime}

${spec.implementation.phases.map(phase => `
### ${phase.name}
${phase.description}

**Tasks:**
${phase.tasks.map(task => `- ${task}`).join('\n')}

**Estimated Cost:** $${phase.estimatedCost.toFixed(6)}
**Dependencies:** ${phase.dependencies.join(', ') || 'None'}
**Deliverables:** ${phase.deliverables.join(', ')}
`).join('\n')}

## Risk Factors
${spec.implementation.riskFactors.map(risk => `- ${risk}`).join('\n')}

## Validation

### Criteria
${spec.validation.criteria.map(c => `- ${c}`).join('\n')}

### Test Cases
${spec.validation.testCases.map(tc => `- ${tc}`).join('\n')}

### Success Metrics
${spec.validation.successMetrics.map(sm => `- ${sm}`).join('\n')}

## Sovereignty

**Escape Route:** ${spec.sovereignty.escapeRoute}
**Backup Strategy:** ${spec.sovereignty.backupStrategy}
**Development Cost Limit:** $${spec.sovereignty.costLimits.development}
**Operation Cost Limit:** $${spec.sovereignty.costLimits.operation}

---

*Generated: ${spec.generatedAt}*
*Last Updated: ${spec.lastUpdated}*
`
  }

  async getSpec(specId: string): Promise<FeatureSpec | null> {
    try {
      const specPath = path.join(this.specsDirectory, specId, 'spec.json')
      const specContent = await fs.readFile(specPath, 'utf-8')
      return JSON.parse(specContent)
    } catch {
      return null
    }
  }

  async updateSpec(specId: string, updates: Partial<FeatureSpec>): Promise<void> {
    const spec = await this.getSpec(specId)
    if (spec) {
      const updatedSpec = { ...spec, ...updates, lastUpdated: new Date().toISOString() }
      await this.saveSpec(updatedSpec)
    }
  }

  async listSpecs(): Promise<string[]> {
    try {
      const entries = await fs.readdir(this.specsDirectory, { withFileTypes: true })
      return entries
        .filter(entry => entry.isDirectory())
        .map(entry => entry.name)
    } catch {
      return []
    }
  }
}

// Singleton instance
const planner = new PlanningSystem()

export default planner
export type { FeatureSpec, ImplementationPhase }