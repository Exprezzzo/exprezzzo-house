interface AnalyticsEvent {
  type: string
  data?: any
  timestamp: Date
  costImpact: number
}

interface MetricsSummary {
  totalRequests: number
  totalCost: number
  averageLatency: number
  conversionRate: number
  revenue: number
  costPerBooking: number
  pendingVendors: number
  processingRate: number
  uptime: number
}

class Analytics {
  private events: AnalyticsEvent[] = []
  private readonly maxCostPerRequest = 0.0002
  private isDegraded = false

  async logEvent(type: string, data?: any, costImpact: number = 0): Promise<void> {
    const event: AnalyticsEvent = {
      type,
      data,
      timestamp: new Date(),
      costImpact
    }

    this.events.push(event)

    // Check for cost threshold breach
    if (costImpact > this.maxCostPerRequest) {
      this.isDegraded = true
      this.logEvent('DEGRADED_MODE_ACTIVATED', { 
        exceededBy: costImpact - this.maxCostPerRequest,
        originalCost: costImpact
      })
    }

    // Store in database if available
    try {
      await this.persistEvent(event)
    } catch (error) {
      console.warn('Failed to persist analytics event:', error)
    }
  }

  private async persistEvent(event: AnalyticsEvent): Promise<void> {
    // Implementation would connect to actual database
    // For now, just log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log('Analytics Event:', event)
    }
  }

  async getMetricsSummary(): Promise<MetricsSummary> {
    const now = Date.now()
    const dayAgo = now - (24 * 60 * 60 * 1000)
    
    const recentEvents = this.events.filter(e => 
      e.timestamp.getTime() > dayAgo
    )

    const requestEvents = recentEvents.filter(e => e.type === 'API_REQUEST')
    const bookingEvents = recentEvents.filter(e => e.type === 'BOOKING_COMPLETED')
    
    const totalCost = recentEvents.reduce((sum, e) => sum + e.costImpact, 0)
    const totalRequests = requestEvents.length
    
    // Mock data for demo - in real implementation would query database
    return {
      totalRequests,
      totalCost: parseFloat(totalCost.toFixed(6)),
      averageLatency: 0.23,
      conversionRate: 2.3,
      revenue: bookingEvents.length * 125.50,
      costPerBooking: totalRequests > 0 ? totalCost / Math.max(bookingEvents.length, 1) : 0,
      pendingVendors: 377,
      processingRate: 85.2,
      uptime: 99.94
    }
  }

  getDegradedStatus(): boolean {
    return this.isDegraded
  }

  resetDegradedMode(): void {
    this.isDegraded = false
    this.logEvent('DEGRADED_MODE_RESET')
  }

  getRecentEvents(limit: number = 100): AnalyticsEvent[] {
    return this.events.slice(-limit)
  }

  // Real-time cost tracking
  async trackCost(operation: string, cost: number): Promise<void> {
    await this.logEvent('COST_TRACKED', { operation }, cost)
    
    if (cost > this.maxCostPerRequest * 0.8) {
      await this.logEvent('COST_WARNING', { 
        operation, 
        cost, 
        threshold: this.maxCostPerRequest 
      })
    }
  }

  // Booking conversion tracking
  async trackBooking(data: any): Promise<void> {
    await this.logEvent('BOOKING_COMPLETED', data, 0.00012)
  }

  // Vendor processing tracking
  async trackVendorProcessing(vendorId: string, status: string): Promise<void> {
    await this.logEvent('VENDOR_PROCESSED', { vendorId, status }, 0.00008)
  }

  // Revenue tracking
  async trackRevenue(amount: number, source: string): Promise<void> {
    await this.logEvent('REVENUE_GENERATED', { amount, source })
  }
}

// Singleton instance
const analytics = new Analytics()

export default analytics
export type { AnalyticsEvent, MetricsSummary }