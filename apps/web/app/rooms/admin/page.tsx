'use client'
import { useState, useEffect } from 'react'
import { Crown, Settings, Users, Database, Shield, Activity, AlertTriangle, CheckCircle, Zap, DollarSign, TrendingUp, Server, BarChart3 } from 'lucide-react'

interface SystemMetric {
  name: string
  value: string | number
  status: 'good' | 'warning' | 'critical'
  icon: React.ReactNode
}

interface UserActivity {
  id: string
  user: string
  action: string
  timestamp: Date
  cost: number
  status: 'success' | 'error'
}

interface AdminStats {
  totalUsers: number
  activeUsers: number
  totalRequests: number
  revenue: number
  systemHealth: number
  errorRate: number
}

interface LiveAnalytics {
  requests: { total: number }
  costs: { total: number }
  degraded: { ratio: number }
  providers: Array<{ name: string; sovereignty_score: number }>
}

interface SovereigntyData {
  scores: Array<{ vendor_name: string; sovereignty_score: number; lock_in_risk: string }>
  overallScore: number
  riskLevel: string
}

export default function AdminRoom() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [adminCode, setAdminCode] = useState('')
  const [metrics, setMetrics] = useState<SystemMetric[]>([])
  const [activities, setActivities] = useState<UserActivity[]>([])
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    activeUsers: 0,
    totalRequests: 0,
    revenue: 0,
    systemHealth: 0,
    errorRate: 0
  })
  const [liveAnalytics, setLiveAnalytics] = useState<LiveAnalytics | null>(null)
  const [sovereigntyData, setSovereigntyData] = useState<SovereigntyData | null>(null)
  const [selectedTab, setSelectedTab] = useState<'overview' | 'users' | 'system' | 'billing' | 'sovereignty'>('overview')
  const [loading, setLoading] = useState(false)

  const handleAdminAuth = () => {
    if (adminCode === 'VEGAS2025') {
      setIsAuthenticated(true)
      setAdminCode('')
      loadAdminData()
    } else {
      alert('Invalid admin code')
    }
  }

  const fetchLiveAnalytics = async () => {
    try {
      const response = await fetch('/api/analytics')
      if (response.ok) {
        const data = await response.json()
        setLiveAnalytics(data)
      }
    } catch (error) {
      console.error('Failed to fetch analytics:', error)
    }
  }

  const fetchSovereigntyData = async () => {
    try {
      const response = await fetch('/api/sovereignty')
      if (response.ok) {
        const data = await response.json()
        setSovereigntyData(data)
      }
    } catch (error) {
      console.error('Failed to fetch sovereignty data:', error)
    }
  }

  const loadAdminData = async () => {
    setLoading(true)
    
    // Load live data
    await Promise.all([
      fetchLiveAnalytics(),
      fetchSovereigntyData()
    ])

    // Load system metrics
    setMetrics([
      {
        name: 'CPU Usage',
        value: '23%',
        status: 'good',
        icon: <Activity className="w-5 h-5" />
      },
      {
        name: 'Memory',
        value: '67%',
        status: 'warning',
        icon: <Database className="w-5 h-5" />
      },
      {
        name: 'Disk Space',
        value: '45%',
        status: 'good',
        icon: <Database className="w-5 h-5" />
      },
      {
        name: 'Ollama Status',
        value: 'Running',
        status: 'good',
        icon: <Zap className="w-5 h-5" />
      },
      {
        name: 'Redis',
        value: 'Connected',
        status: 'good',
        icon: <CheckCircle className="w-5 h-5" />
      },
      {
        name: 'PostgreSQL',
        value: 'Online',
        status: 'good',
        icon: <Database className="w-5 h-5" />
      }
    ])

    // Load user activities (simulated)
    setActivities([
      {
        id: '1',
        user: 'user_vegas_001',
        action: 'Chat request with llama3.2',
        timestamp: new Date('2025-01-15T14:30:00'),
        cost: 0.001,
        status: 'success'
      },
      {
        id: '2',
        user: 'user_sovereign_045',
        action: 'Library document download',
        timestamp: new Date('2025-01-15T14:28:00'),
        cost: 0.000,
        status: 'success'
      },
      {
        id: '3',
        user: 'user_house_123',
        action: 'Workspace project creation',
        timestamp: new Date('2025-01-15T14:25:00'),
        cost: 0.001,
        status: 'success'
      },
      {
        id: '4',
        user: 'user_admin_999',
        action: 'Vault access attempt',
        timestamp: new Date('2025-01-15T14:20:00'),
        cost: 0.000,
        status: 'error'
      }
    ])

    setLoading(false)
  }

  useEffect(() => {
    if (isAuthenticated) {
      // Refresh data every 30 seconds
      const interval = setInterval(() => {
        fetchLiveAnalytics()
        fetchSovereigntyData()
      }, 30000)

      // Real-time stats simulation
      const statsInterval = setInterval(() => {
        setStats(prev => ({
          ...prev,
          activeUsers: Math.max(0, prev.activeUsers + Math.floor(Math.random() * 3) - 1),
          totalRequests: liveAnalytics?.requests.total || prev.totalRequests,
          revenue: liveAnalytics?.costs.total || prev.revenue,
          errorRate: (liveAnalytics?.degraded.ratio || 0) * 100
        }))
      }, 5000)

      return () => {
        clearInterval(interval)
        clearInterval(statsInterval)
      }
    }
  }, [isAuthenticated, liveAnalytics])

  // Update stats when live data changes
  useEffect(() => {
    if (liveAnalytics) {
      setStats(prev => ({
        ...prev,
        totalRequests: liveAnalytics.requests.total,
        revenue: liveAnalytics.costs.total,
        errorRate: liveAnalytics.degraded.ratio * 100,
        systemHealth: Math.max(50, 100 - (liveAnalytics.degraded.ratio * 50))
      }))
    }
  }, [liveAnalytics])

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-chocolate via-vegas-dust to-chocolate flex items-center justify-center">
        <div className="bg-chocolate/80 backdrop-blur border-2 border-vegas-gold/30 rounded-2xl p-12 text-center max-w-md w-full mx-6">
          <Crown className="w-20 h-20 text-vegas-gold mx-auto mb-6" />
          <h1 className="text-4xl font-bold text-vegas-gold mb-4">ADMIN ACCESS</h1>
          <p className="text-desert-sand mb-8">Enter admin code to access the control center</p>
          
          <div className="space-y-4">
            <input
              type="password"
              value={adminCode}
              onChange={(e) => setAdminCode(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAdminAuth()}
              placeholder="Admin Code"
              className="w-full p-4 bg-chocolate/60 border border-vegas-gold/30 rounded-lg text-vegas-gold placeholder-vegas-gold/60 focus:outline-none focus:border-vegas-gold/60"
            />
            <button
              onClick={handleAdminAuth}
              className="w-full bg-vegas-gold hover:bg-vegas-gold/80 text-chocolate font-bold py-4 px-6 rounded-lg transition-colors"
            >
              <Crown className="w-5 h-5 inline mr-2" />
              ACCESS ADMIN
            </button>
          </div>
          
          <div className="mt-8 pt-6 border-t border-vegas-gold/20">
            <p className="text-vegas-gold/60 text-sm">
              👑 Only the house knows the code 👑
            </p>
          </div>
        </div>
      </div>
    )
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'good': return 'text-green-500'
      case 'warning': return 'text-yellow-500'
      case 'critical': return 'text-red-500'
      default: return 'text-gray-500'
    }
  }

  const getStatusBg = (status: string) => {
    switch (status) {
      case 'good': return 'bg-green-500/20 border-green-500/30'
      case 'warning': return 'bg-yellow-500/20 border-yellow-500/30'
      case 'critical': return 'bg-red-500/20 border-red-500/30'
      default: return 'bg-gray-500/20 border-gray-500/30'
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-chocolate via-vegas-dust to-chocolate">
      <div className="container mx-auto px-6 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-4 mb-4">
            <Crown className="w-10 h-10 text-vegas-gold" />
            <h1 className="text-4xl font-bold text-vegas-gold">
              ADMIN ROOM
            </h1>
            <div className="flex items-center gap-2">
              {loading && <div className="animate-spin w-5 h-5 border-2 border-vegas-gold border-t-transparent rounded-full" />}
              <button
                onClick={() => setIsAuthenticated(false)}
                className="bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-400 px-3 py-1 rounded-lg text-sm"
              >
                Logout
              </button>
            </div>
          </div>
          <p className="text-xl text-desert-sand">
            Supreme Command Center of the Sovereign House
          </p>
        </div>

        {/* Live Stats Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-8">
          <div className="bg-chocolate/60 backdrop-blur border-2 border-vegas-gold/20 rounded-xl p-4 text-center">
            <Users className="w-6 h-6 text-vegas-gold mx-auto mb-2" />
            <h3 className="text-sm font-semibold text-vegas-gold">Total Users</h3>
            <p className="text-xl font-bold text-desert-sand">{stats.totalUsers.toLocaleString()}</p>
          </div>
          
          <div className="bg-chocolate/60 backdrop-blur border-2 border-vegas-gold/20 rounded-xl p-4 text-center">
            <Activity className="w-6 h-6 text-vegas-gold mx-auto mb-2" />
            <h3 className="text-sm font-semibold text-vegas-gold">Active Now</h3>
            <p className="text-xl font-bold text-green-500">{stats.activeUsers}</p>
          </div>
          
          <div className="bg-chocolate/60 backdrop-blur border-2 border-vegas-gold/20 rounded-xl p-4 text-center">
            <Zap className="w-6 h-6 text-vegas-gold mx-auto mb-2" />
            <h3 className="text-sm font-semibold text-vegas-gold">Requests</h3>
            <p className="text-xl font-bold text-desert-sand">{stats.totalRequests.toLocaleString()}</p>
          </div>
          
          <div className="bg-chocolate/60 backdrop-blur border-2 border-vegas-gold/20 rounded-xl p-4 text-center">
            <DollarSign className="w-6 h-6 text-vegas-gold mx-auto mb-2" />
            <h3 className="text-sm font-semibold text-vegas-gold">Total Cost</h3>
            <p className="text-xl font-bold text-green-500">${stats.revenue.toFixed(4)}</p>
          </div>
          
          <div className="bg-chocolate/60 backdrop-blur border-2 border-vegas-gold/20 rounded-xl p-4 text-center">
            <Shield className="w-6 h-6 text-vegas-gold mx-auto mb-2" />
            <h3 className="text-sm font-semibold text-vegas-gold">Health</h3>
            <p className="text-xl font-bold text-green-500">{stats.systemHealth.toFixed(1)}%</p>
          </div>
          
          <div className="bg-chocolate/60 backdrop-blur border-2 border-vegas-gold/20 rounded-xl p-4 text-center">
            <AlertTriangle className="w-6 h-6 text-vegas-gold mx-auto mb-2" />
            <h3 className="text-sm font-semibold text-vegas-gold">Degraded</h3>
            <p className="text-xl font-bold text-yellow-500">{stats.errorRate.toFixed(1)}%</p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-chocolate/60 backdrop-blur border-2 border-vegas-gold/20 rounded-xl p-4 mb-8">
          <div className="flex gap-2 flex-wrap">
            {[
              { id: 'overview', name: 'Overview', icon: <Crown className="w-4 h-4" /> },
              { id: 'users', name: 'Users', icon: <Users className="w-4 h-4" /> },
              { id: 'system', name: 'System', icon: <Settings className="w-4 h-4" /> },
              { id: 'billing', name: 'Billing', icon: <DollarSign className="w-4 h-4" /> },
              { id: 'sovereignty', name: 'Sovereignty', icon: <Shield className="w-4 h-4" /> },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSelectedTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                  selectedTab === tab.id
                    ? 'bg-vegas-gold text-chocolate'
                    : 'text-desert-sand hover:text-vegas-gold hover:bg-vegas-gold/10'
                }`}
              >
                {tab.icon}
                {tab.name}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        {selectedTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* System Metrics */}
            <div className="bg-chocolate/60 backdrop-blur border-2 border-vegas-gold/20 rounded-xl p-6">
              <h2 className="text-2xl font-bold text-vegas-gold mb-6">System Metrics</h2>
              <div className="space-y-4">
                {metrics.map((metric, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-chocolate/40 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className={getStatusColor(metric.status)}>
                        {metric.icon}
                      </div>
                      <span className="text-vegas-gold font-medium">{metric.name}</span>
                    </div>
                    <div className={`px-3 py-1 rounded-full border text-sm font-medium ${getStatusBg(metric.status)}`}>
                      {metric.value}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Live Analytics */}
            <div className="bg-chocolate/60 backdrop-blur border-2 border-vegas-gold/20 rounded-xl p-6">
              <h2 className="text-2xl font-bold text-vegas-gold mb-6">Live Analytics</h2>
              {liveAnalytics ? (
                <div className="space-y-4">
                  <div className="p-4 bg-chocolate/40 rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="text-vegas-gold">Total Requests</span>
                      <span className="text-desert-sand font-bold">{liveAnalytics.requests.total.toLocaleString()}</span>
                    </div>
                  </div>
                  <div className="p-4 bg-chocolate/40 rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="text-vegas-gold">Total Costs</span>
                      <span className="text-green-500 font-bold">${liveAnalytics.costs.total.toFixed(4)}</span>
                    </div>
                  </div>
                  <div className="p-4 bg-chocolate/40 rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="text-vegas-gold">Degraded Ratio</span>
                      <span className="text-yellow-500 font-bold">{(liveAnalytics.degraded.ratio * 100).toFixed(1)}%</span>
                    </div>
                  </div>
                  <div className="p-4 bg-chocolate/40 rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="text-vegas-gold">Active Providers</span>
                      <span className="text-desert-sand font-bold">{liveAnalytics.providers.length}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-vegas-gold/60">
                  <BarChart3 className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Loading live analytics...</p>
                </div>
              )}
            </div>
          </div>
        )}

        {selectedTab === 'sovereignty' && (
          <div className="bg-chocolate/60 backdrop-blur border-2 border-vegas-gold/20 rounded-xl p-6">
            <h2 className="text-2xl font-bold text-vegas-gold mb-6">Sovereignty Dashboard</h2>
            {sovereigntyData ? (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-chocolate/40 rounded-xl p-6 text-center">
                    <Shield className="w-12 h-12 text-vegas-gold mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-vegas-gold mb-2">Overall Score</h3>
                    <p className="text-4xl font-bold text-green-500">{sovereigntyData.overallScore.toFixed(1)}</p>
                  </div>
                  <div className="bg-chocolate/40 rounded-xl p-6 text-center">
                    <AlertTriangle className="w-12 h-12 text-vegas-gold mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-vegas-gold mb-2">Risk Level</h3>
                    <p className="text-2xl font-bold text-yellow-500">{sovereigntyData.riskLevel}</p>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-xl font-semibold text-vegas-gold mb-4">Provider Scores</h3>
                  <div className="space-y-3">
                    {sovereigntyData.scores.map((provider, index) => (
                      <div key={index} className="p-4 bg-chocolate/40 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="text-vegas-gold font-medium">{provider.vendor_name}</span>
                            <span className="text-desert-sand/60 text-sm ml-2">({provider.lock_in_risk} risk)</span>
                          </div>
                          <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                            provider.sovereignty_score >= 0.9 ? 'bg-green-500/20 text-green-500' :
                            provider.sovereignty_score >= 0.7 ? 'bg-yellow-500/20 text-yellow-500' :
                            'bg-red-500/20 text-red-500'
                          }`}>
                            {(provider.sovereignty_score * 100).toFixed(0)}%
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {liveAnalytics && (
                  <div>
                    <h3 className="text-xl font-semibold text-vegas-gold mb-4">Active Providers</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {liveAnalytics.providers.map((provider, index) => (
                        <div key={index} className="p-4 bg-chocolate/40 rounded-lg text-center">
                          <h4 className="text-vegas-gold font-medium">{provider.name}</h4>
                          <p className="text-2xl font-bold text-green-500">{(provider.sovereignty_score * 100).toFixed(0)}%</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-12 text-vegas-gold/60">
                <Shield className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p className="text-xl">Loading sovereignty data...</p>
              </div>
            )}
          </div>
        )}

        {selectedTab === 'system' && (
          <div className="bg-chocolate/60 backdrop-blur border-2 border-vegas-gold/20 rounded-xl p-6">
            <h2 className="text-2xl font-bold text-vegas-gold mb-6">System Management</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <button className="bg-vegas-gold/10 hover:bg-vegas-gold/20 border border-vegas-gold/30 text-vegas-gold font-medium py-4 px-6 rounded-lg transition-colors">
                Restart Ollama
              </button>
              <button className="bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 text-blue-400 font-medium py-4 px-6 rounded-lg transition-colors">
                Clear Redis Cache
              </button>
              <button className="bg-green-500/10 hover:bg-green-500/20 border border-green-500/30 text-green-400 font-medium py-4 px-6 rounded-lg transition-colors">
                Database Backup
              </button>
              <button className="bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 font-medium py-4 px-6 rounded-lg transition-colors">
                Emergency Stop
              </button>
            </div>
          </div>
        )}

        {selectedTab === 'billing' && (
          <div className="bg-chocolate/60 backdrop-blur border-2 border-vegas-gold/20 rounded-xl p-6">
            <h2 className="text-2xl font-bold text-vegas-gold mb-6">Billing & Cost Analysis</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-chocolate/40 rounded-xl p-6 text-center">
                <DollarSign className="w-8 h-8 text-green-500 mx-auto mb-2" />
                <h3 className="text-lg font-semibold text-vegas-gold">Total Costs</h3>
                <p className="text-3xl font-bold text-green-500">
                  ${liveAnalytics ? liveAnalytics.costs.total.toFixed(4) : '0.0000'}
                </p>
              </div>
              <div className="bg-chocolate/40 rounded-xl p-6 text-center">
                <Zap className="w-8 h-8 text-vegas-gold mx-auto mb-2" />
                <h3 className="text-lg font-semibold text-vegas-gold">Total Requests</h3>
                <p className="text-3xl font-bold text-desert-sand">
                  {liveAnalytics ? liveAnalytics.requests.total.toLocaleString() : '0'}
                </p>
              </div>
              <div className="bg-chocolate/40 rounded-xl p-6 text-center">
                <TrendingUp className="w-8 h-8 text-vegas-gold mx-auto mb-2" />
                <h3 className="text-lg font-semibold text-vegas-gold">Avg per Request</h3>
                <p className="text-3xl font-bold text-vegas-gold">
                  ${liveAnalytics && liveAnalytics.requests.total > 0 
                    ? (liveAnalytics.costs.total / liveAnalytics.requests.total).toFixed(6)
                    : '0.001000'}
                </p>
              </div>
            </div>
            
            {liveAnalytics && (
              <div className="mt-8">
                <h3 className="text-xl font-semibold text-vegas-gold mb-4">Cost Breakdown</h3>
                <div className="bg-chocolate/40 rounded-xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-vegas-gold">Degraded Requests</span>
                    <span className="text-yellow-500 font-bold">
                      {(liveAnalytics.degraded.ratio * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full bg-chocolate/60 rounded-full h-3">
                    <div 
                      className="bg-yellow-500 h-3 rounded-full transition-all duration-1000"
                      style={{ width: `${liveAnalytics.degraded.ratio * 100}%` }}
                    ></div>
                  </div>
                  <p className="text-desert-sand/60 text-sm mt-2">
                    Requests exceeding $0.001 cost threshold
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {selectedTab === 'users' && (
          <div className="bg-chocolate/60 backdrop-blur border-2 border-vegas-gold/20 rounded-xl p-6">
            <h2 className="text-2xl font-bold text-vegas-gold mb-6">User Management</h2>
            <div className="text-center py-12 text-vegas-gold/60">
              <Users className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p className="text-xl">User management panel coming soon</p>
              <p className="text-sm text-desert-sand mt-2">Advanced user controls and analytics</p>
            </div>
          </div>
        )}

        {/* Vegas Footer */}
        <div className="text-center mt-12 py-8 border-t-2 border-vegas-gold/20">
          <p className="text-vegas-gold text-lg font-semibold">
            👑 The house always wins - But at $0.001, everyone's a winner 👑
          </p>
          {liveAnalytics && (
            <p className="text-desert-sand/60 text-sm mt-2">
              Live data refreshed every 30 seconds • Last update: {new Date().toLocaleTimeString()}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}