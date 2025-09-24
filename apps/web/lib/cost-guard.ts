import analytics from './analytics'

interface CostGuardConfig {
  maxCostPerRequest: number
  warningThreshold: number
  dailyBudget: number
  emergencyStop: boolean
}

interface DegradedModeSettings {
  reduceModelTier: boolean
  limitTokens: boolean
  cacheResponses: boolean
  skipAnalytics: boolean
}

class CostGuard {
  private config: CostGuardConfig
  private degradedSettings: DegradedModeSettings
  private isDegraded: boolean = false
  private dailyCosts: number = 0
  private requestCount: number = 0
  private startTime: Date = new Date()

  constructor() {
    this.config = {
      maxCostPerRequest: 0.0002,
      warningThreshold: 0.80, // 80% of max cost
      dailyBudget: 0.02, // $0.02 daily budget
      emergencyStop: false
    }

    this.degradedSettings = {
      reduceModelTier: true,    // Switch to cheaper model
      limitTokens: true,        // Reduce max tokens
      cacheResponses: true,     // Aggressive caching
      skipAnalytics: false      // Keep monitoring
    }
  }

  async checkCost(requestCost: number, operation: string): Promise<{
    allowed: boolean
    degraded: boolean
    reason?: string
    adjustedCost?: number
  }> {
    this.requestCount++
    this.dailyCosts += requestCost

    // Log the cost check
    await analytics.trackCost(operation, requestCost)

    // Emergency stop check
    if (this.config.emergencyStop) {
      return {
        allowed: false,
        degraded: true,
        reason: 'EMERGENCY_STOP_ACTIVE'
      }
    }

    // Daily budget check
    if (this.dailyCosts > this.config.dailyBudget) {
      this.activateDegradedMode('DAILY_BUDGET_EXCEEDED')
      return {
        allowed: false,
        degraded: true,
        reason: `Daily budget exceeded: $${this.dailyCosts.toFixed(6)} > $${this.config.dailyBudget}`
      }
    }

    // Per-request cost check
    if (requestCost > this.config.maxCostPerRequest) {
      this.activateDegradedMode('REQUEST_COST_EXCEEDED')
      
      // Try to adjust cost in degraded mode
      const adjustedCost = this.adjustCostForDegradedMode(requestCost)
      
      if (adjustedCost <= this.config.maxCostPerRequest) {
        return {
          allowed: true,
          degraded: true,
          adjustedCost,
          reason: `Cost adjusted from $${requestCost.toFixed(6)} to $${adjustedCost.toFixed(6)}`
        }
      }

      return {
        allowed: false,
        degraded: true,
        reason: `Request cost $${requestCost.toFixed(6)} exceeds limit $${this.config.maxCostPerRequest.toFixed(6)}`
      }
    }

    // Warning threshold check
    const warningCost = this.config.maxCostPerRequest * this.config.warningThreshold
    if (requestCost > warningCost && !this.isDegraded) {
      await analytics.logEvent('COST_WARNING', {
        requestCost,
        threshold: warningCost,
        operation
      })
    }

    return {
      allowed: true,
      degraded: this.isDegraded
    }
  }

  private adjustCostForDegradedMode(originalCost: number): number {
    let adjustedCost = originalCost

    if (this.degradedSettings.reduceModelTier) {
      // Simulate switching to cheaper model (reduce cost by ~60%)
      adjustedCost *= 0.4
    }

    if (this.degradedSettings.limitTokens) {
      // Reduce token count (reduce cost by ~40%)
      adjustedCost *= 0.6
    }

    return adjustedCost
  }

  private async activateDegradedMode(reason: string): Promise<void> {
    if (!this.isDegraded) {
      this.isDegraded = true
      await analytics.logEvent('DEGRADED_MODE_ACTIVATED', {
        reason,
        dailyCosts: this.dailyCosts,
        requestCount: this.requestCount,
        settings: this.degradedSettings
      })
    }
  }

  async deactivateDegradedMode(): Promise<void> {
    if (this.isDegraded) {
      this.isDegraded = false
      await analytics.logEvent('DEGRADED_MODE_DEACTIVATED', {
        duration: Date.now() - this.startTime.getTime(),
        dailyCosts: this.dailyCosts,
        requestCount: this.requestCount
      })
    }
  }

  getDegradedMode(): boolean {
    return this.isDegraded
  }

  getDegradedSettings(): DegradedModeSettings {
    return { ...this.degradedSettings }
  }

  getStats() {
    const uptimeHours = (Date.now() - this.startTime.getTime()) / (1000 * 60 * 60)
    
    return {
      isDegraded: this.isDegraded,
      dailyCosts: this.dailyCosts,
      dailyBudgetUsed: (this.dailyCosts / this.config.dailyBudget) * 100,
      requestCount: this.requestCount,
      avgCostPerRequest: this.requestCount > 0 ? this.dailyCosts / this.requestCount : 0,
      uptime: uptimeHours,
      config: { ...this.config },
      degradedSettings: { ...this.degradedSettings }
    }
  }

  // Admin controls
  async setEmergencyStop(active: boolean): Promise<void> {
    this.config.emergencyStop = active
    await analytics.logEvent('EMERGENCY_STOP_TOGGLED', { active })
  }

  async updateBudget(newBudget: number): Promise<void> {
    const oldBudget = this.config.dailyBudget
    this.config.dailyBudget = newBudget
    await analytics.logEvent('BUDGET_UPDATED', { 
      oldBudget, 
      newBudget, 
      currentUsage: this.dailyCosts 
    })
  }

  async resetDailyStats(): Promise<void> {
    this.dailyCosts = 0
    this.requestCount = 0
    this.startTime = new Date()
    this.isDegraded = false
    await analytics.logEvent('DAILY_STATS_RESET')
  }

  // Cost optimization suggestions
  getOptimizationSuggestions(): string[] {
    const suggestions = []
    const stats = this.getStats()

    if (stats.avgCostPerRequest > this.config.maxCostPerRequest * 0.7) {
      suggestions.push('Consider using cheaper model tiers for non-critical operations')
    }

    if (stats.dailyBudgetUsed > 80) {
      suggestions.push('Daily budget usage high - consider implementing request throttling')
    }

    if (this.isDegraded) {
      suggestions.push('System in degraded mode - review cost patterns and optimize queries')
    }

    if (this.requestCount > 1000) {
      suggestions.push('High request volume - consider implementing response caching')
    }

    return suggestions
  }

  // Integration with different cost models
  async estimateOpenAICost(model: string, inputTokens: number, outputTokens: number): Promise<number> {
    const costs: Record<string, { input: number, output: number }> = {
      'gpt-4': { input: 0.00003, output: 0.00006 },
      'gpt-3.5-turbo': { input: 0.000001, output: 0.000002 },
      'text-embedding-ada-002': { input: 0.0000001, output: 0 }
    }

    const modelCost = costs[model] || costs['gpt-3.5-turbo']
    return (inputTokens * modelCost.input) + (outputTokens * modelCost.output)
  }

  async estimateClaudeCost(model: string, inputTokens: number, outputTokens: number): Promise<number> {
    const costs: Record<string, { input: number, output: number }> = {
      'claude-3-haiku': { input: 0.00000025, output: 0.00000125 },
      'claude-3-sonnet': { input: 0.000003, output: 0.000015 },
      'claude-3-opus': { input: 0.000015, output: 0.000075 }
    }

    const modelCost = costs[model] || costs['claude-3-haiku']
    return (inputTokens * modelCost.input) + (outputTokens * modelCost.output)
  }
}

// Singleton instance
const costGuard = new CostGuard()

export default costGuard
export type { CostGuardConfig, DegradedModeSettings }