import costGuard from '../lib/cost-guard'
import analytics from '../lib/analytics'
import patterns from '../lib/patterns'

interface ValidationResult {
  passed: boolean
  gate: string
  checks: CheckResult[]
  cost: number
  recommendations: string[]
  blockers: string[]
}

interface CheckResult {
  name: string
  passed: boolean
  value?: any
  threshold?: any
  message: string
}

class ValidationGates {
  
  // Gate 1: Cost Validation
  async costValidationGate(operation: {
    name: string
    estimatedCost: number
    type: 'development' | 'operation'
    priority?: 'low' | 'normal' | 'high' | 'critical'
  }): Promise<ValidationResult> {
    
    const checks: CheckResult[] = []
    const blockers: string[] = []
    const recommendations: string[] = []

    // Hurricane v4.1 cost limit check
    const costLimit = operation.type === 'development' ? 0.001 : 0.0002
    const costCheck = {
      name: 'Hurricane Cost Limit',
      passed: operation.estimatedCost <= costLimit,
      value: operation.estimatedCost,
      threshold: costLimit,
      message: `Cost ${operation.estimatedCost > costLimit ? 'exceeds' : 'within'} ${operation.type} limit`
    }
    checks.push(costCheck)

    if (!costCheck.passed && operation.priority !== 'critical') {
      blockers.push(`Cost $${operation.estimatedCost.toFixed(6)} exceeds ${operation.type} limit of $${costLimit}`)
    }

    // Cost guard validation
    const guardCheck = await costGuard.checkCost(operation.estimatedCost, operation.name)
    checks.push({
      name: 'Cost Guard Validation',
      passed: guardCheck.allowed,
      message: guardCheck.allowed ? 'Cost guard approved' : guardCheck.reason || 'Cost guard blocked'
    })

    if (!guardCheck.allowed) {
      blockers.push('Cost guard has blocked this operation')
    }

    // Degraded mode check
    if (guardCheck.degraded) {
      recommendations.push('System is in degraded mode - consider deferring non-critical operations')
    }

    // Budget utilization check
    const stats = costGuard.getStats()
    const budgetUsage = stats.dailyBudgetUsed
    
    checks.push({
      name: 'Daily Budget Usage',
      passed: budgetUsage < 80,
      value: `${budgetUsage.toFixed(1)}%`,
      threshold: '80%',
      message: `Daily budget usage at ${budgetUsage.toFixed(1)}%`
    })

    if (budgetUsage > 90) {
      blockers.push('Daily budget usage critical - operation blocked')
    } else if (budgetUsage > 80) {
      recommendations.push('Daily budget usage high - monitor closely')
    }

    await analytics.logEvent('COST_VALIDATION_GATE', {
      operation: operation.name,
      passed: checks.every(c => c.passed) && blockers.length === 0,
      cost: operation.estimatedCost,
      budgetUsage
    })

    return {
      passed: checks.every(c => c.passed) && blockers.length === 0,
      gate: 'COST_VALIDATION',
      checks,
      cost: operation.estimatedCost,
      recommendations,
      blockers
    }
  }

  // Gate 2: Sovereignty Validation
  async sovereigntyValidationGate(operation: {
    name: string
    dataHandling: 'none' | 'read' | 'write' | 'delete'
    externalDependencies: string[]
    escapeRoute: string
  }): Promise<ValidationResult> {
    
    const checks: CheckResult[] = []
    const blockers: string[] = []
    const recommendations: string[] = []

    // Escape route validation
    const escapeRouteCheck = {
      name: 'Escape Route Defined',
      passed: operation.escapeRoute && operation.escapeRoute.length > 10,
      value: operation.escapeRoute ? 'Defined' : 'Missing',
      message: operation.escapeRoute ? 'Escape route documented' : 'No escape route defined'
    }
    checks.push(escapeRouteCheck)

    if (!escapeRouteCheck.passed) {
      blockers.push('Operation must define a clear escape route for sovereignty')
    }

    // Data handling sovereignty check
    const dataCheck = {
      name: 'Data Sovereignty',
      passed: operation.dataHandling !== 'delete' || operation.escapeRoute.includes('backup'),
      message: operation.dataHandling === 'delete' && !operation.escapeRoute.includes('backup') 
        ? 'Delete operations must include backup in escape route'
        : 'Data handling sovereignty compliant'
    }
    checks.push(dataCheck)

    if (!dataCheck.passed) {
      blockers.push('Delete operations require backup strategy in escape route')
    }

    // External dependency check
    const restrictedServices = ['facebook', 'google-analytics', 'hotjar', 'mixpanel']
    const hasRestrictedDeps = operation.externalDependencies.some(dep => 
      restrictedServices.some(restricted => dep.toLowerCase().includes(restricted))
    )

    checks.push({
      name: 'External Dependencies',
      passed: !hasRestrictedDeps,
      value: operation.externalDependencies.join(', '),
      message: hasRestrictedDeps ? 'Contains restricted external dependencies' : 'External dependencies approved'
    })

    if (hasRestrictedDeps) {
      blockers.push('Operation contains restricted external dependencies that compromise sovereignty')
    }

    // 24hr escape readiness
    const escapeTimeCheck = {
      name: '24hr Escape Readiness',
      passed: operation.escapeRoute.includes('24') || operation.escapeRoute.includes('immediate'),
      message: 'Operation must support 24hr or immediate escape capability'
    }
    checks.push(escapeTimeCheck)

    if (!escapeTimeCheck.passed) {
      recommendations.push('Consider adding 24hr escape capability to enhance sovereignty')
    }

    await analytics.logEvent('SOVEREIGNTY_VALIDATION_GATE', {
      operation: operation.name,
      passed: checks.every(c => c.passed) && blockers.length === 0,
      dataHandling: operation.dataHandling,
      externalDependencies: operation.externalDependencies.length
    })

    return {
      passed: checks.every(c => c.passed) && blockers.length === 0,
      gate: 'SOVEREIGNTY_VALIDATION',
      checks,
      cost: 0.00001, // Validation cost
      recommendations,
      blockers
    }
  }

  // Gate 3: Pattern Reuse Validation
  async patternReuseValidationGate(operation: {
    name: string
    description: string
    category: string
    skipPatternCheck?: boolean
  }): Promise<ValidationResult> {
    
    const checks: CheckResult[] = []
    const recommendations: string[] = []
    const blockers: string[] = []

    if (operation.skipPatternCheck) {
      checks.push({
        name: 'Pattern Check',
        passed: true,
        message: 'Pattern check skipped by request'
      })
    } else {
      // Search for existing patterns
      const existingPattern = await patterns.findReusablePattern(
        `${operation.name} ${operation.description}`,
        operation.category,
        0.0002
      )

      const patternCheck = {
        name: 'Pattern Reuse Check',
        passed: true, // Never block, just recommend
        value: existingPattern ? 'Found reusable pattern' : 'No existing pattern',
        message: existingPattern 
          ? `Found pattern: ${existingPattern.name} (${(existingPattern.successRate * 100).toFixed(1)}% success)`
          : 'No reusable patterns found'
      }
      checks.push(patternCheck)

      if (existingPattern) {
        const costSavings = 0.0002 - existingPattern.cost
        recommendations.push(
          `Consider reusing pattern "${existingPattern.name}"`,
          `Potential cost savings: $${costSavings.toFixed(6)}`,
          `Pattern success rate: ${(existingPattern.successRate * 100).toFixed(1)}%`
        )
      } else {
        recommendations.push('New pattern - consider capturing for future reuse')
      }
    }

    // Pattern bank health check
    const bankStats = patterns.getBankStats()
    checks.push({
      name: 'Pattern Bank Health',
      passed: bankStats.totalPatterns > 0,
      value: `${bankStats.totalPatterns} patterns`,
      message: `Pattern bank contains ${bankStats.totalPatterns} reusable patterns`
    })

    if (bankStats.avgReusabilityScore < 0.5) {
      recommendations.push('Pattern bank quality is low - focus on capturing high-quality patterns')
    }

    await analytics.logEvent('PATTERN_REUSE_VALIDATION_GATE', {
      operation: operation.name,
      existingPatternFound: checks.some(c => c.value?.includes('reusable pattern')),
      bankSize: bankStats.totalPatterns
    })

    return {
      passed: checks.every(c => c.passed), // Pattern gate rarely blocks
      gate: 'PATTERN_REUSE_VALIDATION',
      checks,
      cost: 0.00002,
      recommendations,
      blockers
    }
  }

  // Gate 4: Vegas Standards Validation
  async vegasStandardsValidationGate(operation: {
    name: string
    type: 'ui' | 'api' | 'database' | 'infrastructure' | 'other'
    colorUsage?: string[]
    designPrinciples?: string[]
  }): Promise<ValidationResult> {
    
    const checks: CheckResult[] = []
    const recommendations: string[] = []
    const blockers: string[] = []

    // Vegas color palette validation (for UI operations)
    if (operation.type === 'ui') {
      const vegasColors = ['#C5B358', '#2C1810', '#EDC9AF', '#3E2723', '#C72C41', '#A89F91', '#F5F5DC']
      const prohibitedColors = ['#000000', '#000', '#ffffff', '#fff']
      
      const colorCheck = {
        name: 'Vegas Color Palette',
        passed: true,
        message: 'Vegas color palette compliance'
      }

      if (operation.colorUsage) {
        const hasProhibited = operation.colorUsage.some(color => 
          prohibitedColors.some(prohibited => color.toLowerCase().includes(prohibited))
        )
        
        colorCheck.passed = !hasProhibited
        colorCheck.value = operation.colorUsage.join(', ')
        colorCheck.message = hasProhibited 
          ? 'Contains prohibited colors (pure black/white)' 
          : 'Color usage follows Vegas palette'
        
        if (hasProhibited) {
          blockers.push('UI uses prohibited pure black (#000) or pure white (#fff) - use Vegas palette instead')
        }
      }
      
      checks.push(colorCheck)
    }

    // Naming convention validation
    const namingCheck = {
      name: 'Vegas Naming Convention',
      passed: !operation.name.toLowerCase().includes('google') && 
              !operation.name.toLowerCase().includes('facebook'),
      message: 'Follows Vegas-first naming conventions'
    }
    checks.push(namingCheck)

    if (!namingCheck.passed) {
      recommendations.push('Consider Vegas-first naming that emphasizes sovereignty')
    }

    // Design principles check
    if (operation.designPrinciples) {
      const vegasPrinciples = ['sovereignty', 'cost-conscious', 'pattern-reuse', 'escape-ready']
      const followsPrinciples = operation.designPrinciples.some(principle => 
        vegasPrinciples.some(vegas => principle.toLowerCase().includes(vegas))
      )

      checks.push({
        name: 'Vegas Design Principles',
        passed: followsPrinciples,
        value: operation.designPrinciples.join(', '),
        message: followsPrinciples ? 'Follows Vegas design principles' : 'Could better align with Vegas principles'
      })

      if (!followsPrinciples) {
        recommendations.push('Consider incorporating Vegas design principles: sovereignty, cost-consciousness, pattern reuse')
      }
    }

    await analytics.logEvent('VEGAS_STANDARDS_VALIDATION_GATE', {
      operation: operation.name,
      type: operation.type,
      passed: checks.every(c => c.passed) && blockers.length === 0
    })

    return {
      passed: checks.every(c => c.passed) && blockers.length === 0,
      gate: 'VEGAS_STANDARDS_VALIDATION',
      checks,
      cost: 0.00001,
      recommendations,
      blockers
    }
  }

  // Comprehensive gate runner
  async runAllGates(operation: {
    name: string
    estimatedCost: number
    type: 'development' | 'operation'
    dataHandling: 'none' | 'read' | 'write' | 'delete'
    externalDependencies: string[]
    escapeRoute: string
    description: string
    category: string
    uiType?: 'ui' | 'api' | 'database' | 'infrastructure' | 'other'
    colorUsage?: string[]
    designPrinciples?: string[]
  }): Promise<ValidationResult[]> {
    
    const results = await Promise.all([
      this.costValidationGate({
        name: operation.name,
        estimatedCost: operation.estimatedCost,
        type: operation.type
      }),
      this.sovereigntyValidationGate({
        name: operation.name,
        dataHandling: operation.dataHandling,
        externalDependencies: operation.externalDependencies,
        escapeRoute: operation.escapeRoute
      }),
      this.patternReuseValidationGate({
        name: operation.name,
        description: operation.description,
        category: operation.category
      }),
      this.vegasStandardsValidationGate({
        name: operation.name,
        type: operation.uiType || 'other',
        colorUsage: operation.colorUsage,
        designPrinciples: operation.designPrinciples
      })
    ])

    // Log overall validation result
    const overallPassed = results.every(r => r.passed)
    const totalCost = results.reduce((sum, r) => sum + r.cost, 0)
    const totalBlockers = results.reduce((count, r) => count + r.blockers.length, 0)

    await analytics.logEvent('VALIDATION_GATES_COMPLETE', {
      operation: operation.name,
      overallPassed,
      totalCost,
      totalBlockers,
      gatesPassed: results.filter(r => r.passed).length,
      totalGates: results.length
    })

    return results
  }
}

// Singleton instance
const validationGates = new ValidationGates()

export default validationGates
export type { ValidationResult, CheckResult }