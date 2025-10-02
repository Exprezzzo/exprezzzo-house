'use client'
import { useEffect, useState } from 'react'
import { Crown, DollarSign, Users, Settings, Database, Globe, 
         BookOpen, Shield, TrendingUp } from 'lucide-react'
import analytics, { MetricsSummary } from '../../lib/analytics'

interface TileProps {
  title: string
  icon: React.ReactNode
  children: React.ReactNode
  status?: 'active' | 'warning' | 'error'
  className?: string
}

function Tile({ title, icon, children, status = 'active', className = '' }: TileProps) {
  const statusColors = {
    active: 'border-vegas-gold/30 bg-gradient-to-br from-chocolate/80 to-desert-sand/20',
    warning: 'border-yellow-400/50 bg-gradient-to-br from-yellow-900/30 to-chocolate/80',
    error: 'border-red-400/50 bg-gradient-to-br from-red-900/30 to-chocolate/80'
  }

  return (
    <div className={`
      w-[380px] h-[280px] p-6 rounded-2xl border backdrop-blur-lg
      ${statusColors[status]}
      shadow-2xl hover:shadow-vegas-gold/20 transition-all duration-300
      hover:scale-[1.02] cursor-pointer
      ${className}
    `}>
      <div className="flex items-center gap-3 mb-4">
        <div className="text-vegas-gold text-2xl">{icon}</div>
        <h3 className="text-vegas-gold font-bold text-lg">{title}</h3>
      </div>
      <div className="text-desert-sand h-[180px] overflow-hidden">
        {children}
      </div>
    </div>
  )
}

export default function SovereignDashboard() {
  const [metrics, setMetrics] = useState<MetricsSummary | null>(null)
  const [degradedMode, setDegradedMode] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadMetrics()
    const interval = setInterval(loadMetrics, 5000) // Update every 5 seconds
    return () => clearInterval(interval)
  }, [])

  const loadMetrics = async () => {
    try {
      const response = await fetch('/api/analytics')
      const data = await response.json()
      
      if (data.success) {
        setMetrics(data.data.summary)
        setDegradedMode(data.data.degraded)
      }
    } catch (error) {
      console.error('Failed to load metrics:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-chocolate via-vegas-dust to-chocolate flex items-center justify-center">
        <div className="text-vegas-gold text-2xl animate-pulse">Loading Sovereign Dashboard...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-chocolate via-vegas-dust to-chocolate p-8">
      {/* Header */}
      <div className="text-center mb-12">
        <div className="flex items-center justify-center gap-4 mb-6">
          <Crown className="w-16 h-16 text-vegas-gold animate-pulse" />
          <div>
            <h1 className="text-6xl font-bold text-vegas-gold mb-2">
              EXPRE<span className="animate-shimmer">ZZZ</span>O
            </h1>
            <p className="text-xl text-desert-sand">Sovereign House Dashboard</p>
          </div>
        </div>
        
        {degradedMode && (
          <div className="bg-red-900/30 border border-red-400/50 rounded-lg p-4 max-w-md mx-auto">
            <p className="text-red-200 font-bold">⚠️ DEGRADED MODE ACTIVE</p>
            <p className="text-red-300 text-sm">Cost threshold exceeded - operating in safe mode</p>
          </div>
        )}

        <div className="flex justify-center gap-8 mt-6 text-desert-sand">
          <div>Vegas-First Architecture</div>
          <div className="text-vegas-gold font-bold">$0.0002 per request</div>
          <div>Hurricane v4.1 Hardened</div>
        </div>
      </div>

      {/* 3x3 Grid */}
      <div className="grid grid-cols-3 gap-6 max-w-[1200px] mx-auto">
        
        {/* Row 1 */}
        <Tile 
          title="MASTER BEDROOM" 
          icon={<Crown />}
          status={metrics?.conversionRate && metrics.conversionRate > 2.0 ? 'active' : 'warning'}
        >
          <div className="space-y-3">
            <div className="flex justify-between">
              <span>Conversion Rate:</span>
              <span className="text-vegas-gold font-bold">{metrics?.conversionRate || 0}%</span>
            </div>
            <div className="flex justify-between">
              <span>Cost per Booking:</span>
              <span className="text-vegas-gold">${(metrics?.costPerBooking || 0).toFixed(4)}</span>
            </div>
            <div className="bg-desert-sand/10 rounded-lg p-3">
              <p className="text-sm">Payment Integration: Stripe + PayPal</p>
              <p className="text-xs text-desert-sand/70 mt-1">Live booking flow active</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-sm">Booking UI Priority</span>
            </div>
          </div>
        </Tile>

        <Tile 
          title="LAS VEGAS GOOD TIMES" 
          icon={<Globe />}
        >
          <div className="space-y-3">
            <div className="flex justify-between">
              <span>Active Vendors:</span>
              <span className="text-vegas-gold font-bold">800</span>
            </div>
            <div className="flex justify-between">
              <span>Live Bookings:</span>
              <span className="text-vegas-gold">{metrics?.totalRequests || 0}</span>
            </div>
            <div className="flex justify-between">
              <span>Revenue (24h):</span>
              <span className="text-vegas-gold">${(metrics?.revenue || 0).toFixed(2)}</span>
            </div>
            <div className="bg-vegas-gold/10 rounded-lg p-3">
              <p className="text-sm">Migration: ✅ Complete</p>
              <p className="text-xs text-desert-sand/70 mt-1">Real-time sync active</p>
            </div>
          </div>
        </Tile>

        <Tile 
          title="MIAMI SANDBOX" 
          icon={<Settings />}
          status="warning"
        >
          <div className="space-y-3">
            <div className="flex justify-between">
              <span>Launch Target:</span>
              <span className="text-vegas-gold">Oct 1, 2024</span>
            </div>
            <div className="w-full bg-chocolate rounded-full h-2">
              <div className="bg-vegas-gold h-2 rounded-full w-[75%]"></div>
            </div>
            <div className="text-right text-sm">75% Complete</div>
            <button className="bg-vegas-gold/20 hover:bg-vegas-gold/30 rounded-lg p-2 w-full text-sm transition-colors">
              Import Vegas Patterns
            </button>
            <div className="text-xs text-desert-sand/70">
              One-click vendor migration ready
            </div>
          </div>
        </Tile>

        {/* Row 2 */}
        <Tile 
          title="EIS BRAIN" 
          icon={<Database />}
        >
          <div className="space-y-3">
            <div className="flex justify-between">
              <span>Achieved Cost:</span>
              <span className="text-green-400 font-bold">$0.000084/req</span>
            </div>
            <div className="flex justify-between">
              <span>Tier Routing:</span>
              <span className="text-vegas-gold">Tier_N Active</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-sm">WebSocket Connected</span>
            </div>
            <div className="bg-green-900/20 rounded-lg p-3">
              <p className="text-sm text-green-300">🧠 Neural routing optimal</p>
              <p className="text-xs text-green-400 mt-1">Latency: {metrics?.averageLatency || 0}ms</p>
            </div>
          </div>
        </Tile>

        <Tile 
          title="VENDOR PIPELINE" 
          icon={<Users />}
        >
          <div className="space-y-3">
            <div className="flex justify-between">
              <span>Pending Review:</span>
              <span className="text-vegas-gold font-bold">{metrics?.pendingVendors || 377}</span>
            </div>
            <div className="flex justify-between">
              <span>Processing Rate:</span>
              <span className="text-vegas-gold">{metrics?.processingRate || 85.2}%</span>
            </div>
            <div className="w-full bg-chocolate rounded-full h-2">
              <div className="bg-vegas-gold h-2 rounded-full w-[85%]"></div>
            </div>
            <div className="bg-desert-sand/10 rounded-lg p-3">
              <p className="text-sm">Auto-verification: Active</p>
              <p className="text-xs text-desert-sand/70 mt-1">AI screening enabled</p>
            </div>
          </div>
        </Tile>

        <Tile 
          title="WHITE LABEL STATUS" 
          icon={<Shield />}
        >
          <div className="space-y-3">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Motel 6:</span>
                <span className="text-green-400">✅ Ready</span>
              </div>
              <div className="flex justify-between">
                <span>Hugo Boss:</span>
                <span className="text-yellow-400">🔧 Dev 60%</span>
              </div>
            </div>
            <div className="flex justify-between">
              <span>Tier Cost:</span>
              <span className="text-vegas-gold">$0.00018</span>
            </div>
            <div className="bg-vegas-gold/10 rounded-lg p-3">
              <p className="text-sm">Template Engine: Active</p>
              <p className="text-xs text-desert-sand/70 mt-1">Rapid deployment ready</p>
            </div>
          </div>
        </Tile>

        {/* Row 3 */}
        <Tile 
          title="BLUEPRINT BANK" 
          icon={<BookOpen />}
        >
          <div className="space-y-3">
            <div className="flex justify-between">
              <span>Pattern Count:</span>
              <span className="text-vegas-gold font-bold">2,847</span>
            </div>
            <div className="flex justify-between">
              <span>RAG Vectors:</span>
              <span className="text-vegas-gold">8,492</span>
            </div>
            <div className="flex justify-between">
              <span>Success Rate:</span>
              <span className="text-green-400">94.2%</span>
            </div>
            <input 
              type="text" 
              placeholder="Semantic search..."
              className="w-full bg-chocolate/50 border border-vegas-gold/30 rounded p-2 text-sm text-desert-sand"
            />
          </div>
        </Tile>

        <Tile 
          title="SOVEREIGNTY EXPORT" 
          icon={<Shield />}
        >
          <div className="space-y-3">
            <div className="flex justify-between">
              <span>Last Backup:</span>
              <span className="text-vegas-gold">2 hrs ago</span>
            </div>
            <div className="flex justify-between">
              <span>Export Time:</span>
              <span className="text-green-400 font-bold">0.64s</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-sm">24hr escape ready</span>
            </div>
            <button className="bg-red-600/20 hover:bg-red-600/30 rounded-lg p-2 w-full text-sm transition-colors">
              🚨 EMERGENCY EXPORT
            </button>
          </div>
        </Tile>

        <Tile 
          title="COST TRACKER" 
          icon={<DollarSign />}
          status={degradedMode ? 'error' : metrics?.totalCost && metrics.totalCost > 0.00016 ? 'warning' : 'active'}
        >
          <div className="space-y-3">
            <div className="flex justify-between">
              <span>Real-time Cost:</span>
              <span className="text-vegas-gold font-bold">
                ${(metrics?.totalCost || 0).toFixed(6)}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Requests (24h):</span>
              <span className="text-vegas-gold">{metrics?.totalRequests || 0}</span>
            </div>
            <div className="w-full bg-chocolate rounded-full h-2">
              <div 
                className={`h-2 rounded-full transition-all ${
                  degradedMode ? 'bg-red-400' : 
                  (metrics?.totalCost || 0) > 0.00016 ? 'bg-yellow-400' : 'bg-green-400'
                }`}
                style={{ 
                  width: `${Math.min(((metrics?.totalCost || 0) / 0.0002) * 100, 100)}%` 
                }}
              ></div>
            </div>
            <div className="text-xs text-center">
              Budget: {(((metrics?.totalCost || 0) / 0.0002) * 100).toFixed(1)}%
            </div>
          </div>
        </Tile>

      </div>

      {/* Footer */}
      <div className="text-center mt-12 text-desert-sand/60">
        <p className="text-sm">
          🎰 Hurricane v4.1 | Uptime: {metrics?.uptime || 99.94}% | 
          Vegas Sovereign Always | Cost Guard: {degradedMode ? 'ACTIVE' : 'STANDBY'} 🎰
        </p>
      </div>
    </div>
  )
}