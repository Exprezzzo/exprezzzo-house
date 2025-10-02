import ragHelper from './rag'
import analytics from './analytics'
import costGuard from './cost-guard'

interface Pattern {
  id: string
  name: string
  description: string
  approach: string
  implementation: string
  cost: number
  reusabilityScore: number
  successRate: number
  category: string
  tags: string[]
  sourceOperation: string
  capturedAt: string
  lastUsed?: string
  usageCount: number
  variations: PatternVariation[]
}

interface PatternVariation {
  id: string
  description: string
  modifications: string[]
  successRate: number
  cost: number
  usedAt: string
}

interface PatternCaptureResult {
  patternId: string
  captured: boolean
  reused?: boolean
  existingPatternId?: string
  costSavings?: number
}

class PatternManager {
  private patterns: Map<string, Pattern> = new Map()
  private captureThreshold = 0.80 // Minimum success rate to capture pattern

  async capturePattern(
    operationData: {
      name: string
      description: string
      approach: string
      implementation: string
      cost: number
      success: boolean
      category: string
      sourceOperation: string
    }
  ): Promise<PatternCaptureResult> {
    
    // Check if pattern already exists via semantic search
    const existingPatterns = await ragHelper.searchPatterns(
      `${operationData.name} ${operationData.description}`
    )

    // High similarity threshold for pattern matching
    const existingPattern = existingPatterns.find(p => p.similarity > 0.85)
    
    if (existingPattern) {
      // Update existing pattern with new variation
      const pattern = this.patterns.get(existingPattern.id)
      if (pattern) {
        const variation: PatternVariation = {
          id: `var_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
          description: operationData.description,
          modifications: this.findModifications(pattern, operationData),
          successRate: operationData.success ? 1.0 : 0.0,
          cost: operationData.cost,
          usedAt: new Date().toISOString()
        }

        pattern.variations.push(variation)
        pattern.lastUsed = new Date().toISOString()
        pattern.usageCount += 1
        
        // Recalculate success rate
        const allResults = [pattern.successRate, ...pattern.variations.map(v => v.successRate)]
        pattern.successRate = allResults.reduce((sum, rate) => sum + rate, 0) / allResults.length

        await analytics.logEvent('PATTERN_VARIATION_ADDED', {
          patternId: pattern.id,
          variationId: variation.id,
          cost: operationData.cost
        })

        return {
          patternId: pattern.id,
          captured: false,
          reused: true,
          existingPatternId: pattern.id,
          costSavings: this.calculateCostSavings(pattern, operationData.cost)
        }
      }
    }

    // Only capture successful operations or those meeting threshold
    if (!operationData.success && operationData.cost > 0.0001) {
      await analytics.logEvent('PATTERN_CAPTURE_SKIPPED', {
        reason: 'UNSUCCESSFUL_OPERATION',
        cost: operationData.cost
      })
      return { patternId: '', captured: false }
    }

    // Create new pattern
    const patternId = `pattern_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const reusabilityScore = this.calculateReusabilityScore(operationData)
    
    const pattern: Pattern = {
      id: patternId,
      name: operationData.name,
      description: operationData.description,
      approach: operationData.approach,
      implementation: operationData.implementation,
      cost: operationData.cost,
      reusabilityScore,
      successRate: operationData.success ? 1.0 : 0.0,
      category: operationData.category,
      tags: this.extractTags(operationData),
      sourceOperation: operationData.sourceOperation,
      capturedAt: new Date().toISOString(),
      usageCount: 1,
      variations: []
    }

    // Store pattern
    this.patterns.set(patternId, pattern)

    // Add to RAG system for semantic search
    await ragHelper.embedContent(
      `${pattern.name}: ${pattern.description}\nApproach: ${pattern.approach}`,
      'pattern',
      `pattern_${patternId}`,
      pattern.tags
    )

    await analytics.logEvent('PATTERN_CAPTURED', {
      patternId,
      reusabilityScore,
      cost: operationData.cost,
      category: operationData.category
    })

    return { patternId, captured: true }
  }

  async findReusablePattern(
    query: string,
    category?: string,
    maxCost?: number
  ): Promise<Pattern | null> {
    
    const searchResults = await ragHelper.searchPatterns(query)
    
    for (const result of searchResults) {
      const pattern = this.patterns.get(result.id.replace('pattern_', ''))
      if (!pattern) continue

      // Filter by category if specified
      if (category && pattern.category !== category) continue
      
      // Filter by max cost if specified  
      if (maxCost && pattern.cost > maxCost) continue

      // Check reusability threshold
      if (pattern.reusabilityScore > 0.7 && pattern.successRate > this.captureThreshold) {
        // Update usage stats
        pattern.lastUsed = new Date().toISOString()
        pattern.usageCount += 1

        await analytics.logEvent('PATTERN_REUSED', {
          patternId: pattern.id,
          query,
          similarity: result.similarity,
          costSavings: this.estimateImplementationCost() - pattern.cost
        })

        return pattern
      }
    }

    return null
  }

  private calculateReusabilityScore(operationData: any): number {
    let score = 0.5 // Base score

    // Cost efficiency (lower cost = higher reusability)
    if (operationData.cost < 0.00005) score += 0.2
    else if (operationData.cost < 0.0001) score += 0.1

    // Generality indicators
    const generalTerms = ['create', 'update', 'delete', 'fetch', 'process', 'validate']
    const hasGeneralTerms = generalTerms.some(term => 
      operationData.name.toLowerCase().includes(term) ||
      operationData.description.toLowerCase().includes(term)
    )
    if (hasGeneralTerms) score += 0.1

    // Implementation clarity
    if (operationData.implementation.length > 100) score += 0.1

    // Category bonus
    const highValueCategories = ['api', 'database', 'authentication', 'payment']
    if (highValueCategories.includes(operationData.category.toLowerCase())) score += 0.1

    return Math.min(score, 1.0)
  }

  private extractTags(operationData: any): string[] {
    const tags = [operationData.category]
    
    // Extract from name and description
    const text = `${operationData.name} ${operationData.description}`.toLowerCase()
    
    const commonTags = [
      'api', 'database', 'auth', 'payment', 'ui', 'validation', 
      'optimization', 'security', 'performance', 'integration'
    ]
    
    commonTags.forEach(tag => {
      if (text.includes(tag)) tags.push(tag)
    })

    return [...new Set(tags)] // Remove duplicates
  }

  private findModifications(existingPattern: Pattern, newOperation: any): string[] {
    const modifications = []
    
    if (existingPattern.cost !== newOperation.cost) {
      modifications.push(`Cost changed from $${existingPattern.cost} to $${newOperation.cost}`)
    }
    
    if (existingPattern.approach !== newOperation.approach) {
      modifications.push('Different approach used')
    }
    
    if (existingPattern.implementation !== newOperation.implementation) {
      modifications.push('Implementation variations')
    }

    return modifications
  }

  private calculateCostSavings(pattern: Pattern, actualCost: number): number {
    const estimatedNewImplementationCost = this.estimateImplementationCost()
    return Math.max(0, estimatedNewImplementationCost - pattern.cost)
  }

  private estimateImplementationCost(): number {
    // Estimate cost of implementing from scratch
    return 0.0002 // Average implementation cost
  }

  // Pattern Bank management
  async getPatternBank(): Promise<Pattern[]> {
    return Array.from(this.patterns.values())
      .sort((a, b) => b.usageCount - a.usageCount) // Most used first
  }

  async getPatternsByCategory(category: string): Promise<Pattern[]> {
    return Array.from(this.patterns.values())
      .filter(p => p.category === category)
      .sort((a, b) => b.reusabilityScore - a.reusabilityScore)
  }

  async getTopPatterns(limit: number = 10): Promise<Pattern[]> {
    return Array.from(this.patterns.values())
      .sort((a, b) => {
        // Score by usage, success rate, and reusability
        const scoreA = a.usageCount * a.successRate * a.reusabilityScore
        const scoreB = b.usageCount * b.successRate * b.reusabilityScore
        return scoreB - scoreA
      })
      .slice(0, limit)
  }

  // Validation and quality
  async validatePattern(patternId: string): Promise<boolean> {
    const pattern = this.patterns.get(patternId)
    if (!pattern) return false

    // Validation criteria
    const hasValidImplementation = pattern.implementation.length > 50
    const hasGoodSuccessRate = pattern.successRate > this.captureThreshold
    const hasReasonableCost = pattern.cost <= 0.0002
    const hasUsage = pattern.usageCount > 0

    return hasValidImplementation && hasGoodSuccessRate && hasReasonableCost && hasUsage
  }

  // Analytics and reporting
  getBankStats() {
    const patterns = Array.from(this.patterns.values())
    const totalPatterns = patterns.length
    const totalUsage = patterns.reduce((sum, p) => sum + p.usageCount, 0)
    const avgReusabilityScore = patterns.reduce((sum, p) => sum + p.reusabilityScore, 0) / totalPatterns
    const avgSuccessRate = patterns.reduce((sum, p) => sum + p.successRate, 0) / totalPatterns
    
    const categoryBreakdown: Record<string, number> = {}
    patterns.forEach(p => {
      categoryBreakdown[p.category] = (categoryBreakdown[p.category] || 0) + 1
    })

    return {
      totalPatterns,
      totalUsage,
      avgReusabilityScore: parseFloat(avgReusabilityScore.toFixed(3)),
      avgSuccessRate: parseFloat(avgSuccessRate.toFixed(3)),
      categoryBreakdown,
      lastCaptured: patterns.length > 0 ? 
        Math.max(...patterns.map(p => new Date(p.capturedAt).getTime())) : 0
    }
  }
}

// Auto-capture wrapper function
export async function autoCapture(operationResult: {
  operation: string
  success: boolean
  cost: number
  implementation?: string
  approach?: string
  category?: string
}): Promise<PatternCaptureResult> {
  const patternManager = new PatternManager()
  
  const operationData = {
    name: operationResult.operation,
    description: `Automated capture from ${operationResult.operation}`,
    approach: operationResult.approach || 'Standard implementation',
    implementation: operationResult.implementation || 'Implementation details captured',
    cost: operationResult.cost,
    success: operationResult.success,
    category: operationResult.category || 'general',
    sourceOperation: operationResult.operation
  }

  return await patternManager.capturePattern(operationData)
}

// Singleton instance
const patterns = new PatternManager()

export default patterns
export type { Pattern, PatternVariation, PatternCaptureResult }