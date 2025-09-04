'use client'
import { useState, useEffect } from 'react'
import { Crown, Settings, Users, Database, Shield, Activity, AlertTriangle, CheckCircle, Zap, DollarSign } from 'lucide-react'

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
  const [selectedTab, setSelectedTab] = useState<'overview' | 'users' | 'system' | 'billing'>('overview')

  const handleAdminAuth = () => {
    // Simple admin authentication
    if (adminCode === 'VEGAS2025') {
      setIsAuthenticated(true)
      setAdminCode('')
      loadAdminData()
    } else {
      alert('Invalid admin code')
    }
  }

  const loadAdminData = () => {
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

    // Load user activities
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

    // Load admin stats
    setStats({
      totalUsers: 1247,
      activeUsers: 89,
      totalRequests: 156789,
      revenue: 156.79,
      systemHealth: 97.3,
      errorRate: 0.23
    })
  }

  useEffect(() => {
    if (isAuthenticated) {
      const interval = setInterval(() => {
        // Simulate real-time updates
        setStats(prev => ({
          ...prev,
          activeUsers: prev.activeUsers + Math.floor(Math.random() * 3) - 1,
          totalRequests: prev.totalRequests + Math.floor(Math.random() * 10),
          revenue: prev.revenue + (Math.random() * 0.01)
        }))
      }, 5000)

      return () => clearInterval(interval)
    }
  }, [isAuthenticated])

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
            <button
              onClick={() => setIsAuthenticated(false)}
              className="bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-400 px-3 py-1 rounded-lg text-sm"
            >
              Logout
            </button>
          </div>
          <p className="text-xl text-desert-sand">
            Supreme Command Center of the Sovereign House
          </p>
        </div>

        {/* Admin Stats */}
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
            <h3 className="text-sm font-semibold text-vegas-gold">Revenue</h3>
            <p className="text-xl font-bold text-green-500">${stats.revenue.toFixed(2)}</p>
          </div>
          
          <div className="bg-chocolate/60 backdrop-blur border-2 border-vegas-gold/20 rounded-xl p-4 text-center">
            <Shield className="w-6 h-6 text-vegas-gold mx-auto mb-2" />
            <h3 className="text-sm font-semibold text-vegas-gold">Health</h3>
            <p className="text-xl font-bold text-green-500">{stats.systemHealth}%</p>
          </div>
          
          <div className="bg-chocolate/60 backdrop-blur border-2 border-vegas-gold/20 rounded-xl p-4 text-center">
            <AlertTriangle className="w-6 h-6 text-vegas-gold mx-auto mb-2" />
            <h3 className="text-sm font-semibold text-vegas-gold">Error Rate</h3>
            <p className="text-xl font-bold text-yellow-500">{stats.errorRate}%</p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-chocolate/60 backdrop-blur border-2 border-vegas-gold/20 rounded-xl p-4 mb-8">
          <div className="flex gap-2">
            {[
              { id: 'overview', name: 'Overview', icon: <Crown className="w-4 h-4" /> },
              { id: 'users', name: 'Users', icon: <Users className="w-4 h-4" /> },
              { id: 'system', name: 'System', icon: <Settings className="w-4 h-4" /> },
              { id: 'billing', name: 'Billing', icon: <DollarSign className="w-4 h-4" /> },
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

            {/* Recent Activities */}
            <div className="bg-chocolate/60 backdrop-blur border-2 border-vegas-gold/20 rounded-xl p-6">
              <h2 className="text-2xl font-bold text-vegas-gold mb-6">Recent Activities</h2>
              <div className="space-y-3">
                {activities.map((activity) => (
                  <div key={activity.id} className="p-4 bg-chocolate/40 rounded-lg">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-vegas-gold font-medium">{activity.user}</span>
                          <div className={`w-2 h-2 rounded-full ${
                            activity.status === 'success' ? 'bg-green-500' : 'bg-red-500'
                          }`}></div>
                        </div>
                        <p className="text-desert-sand text-sm mb-2">{activity.action}</p>
                        <div className="flex items-center gap-4 text-xs text-desert-sand/60">
                          <span>{activity.timestamp.toLocaleTimeString()}</span>
                          <span className="text-green-500">${activity.cost.toFixed(3)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
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
            <h2 className="text-2xl font-bold text-vegas-gold mb-6">Billing & Revenue</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-chocolate/40 rounded-xl p-6 text-center">
                <DollarSign className="w-8 h-8 text-green-500 mx-auto mb-2" />
                <h3 className="text-lg font-semibold text-vegas-gold">Today's Revenue</h3>
                <p className="text-3xl font-bold text-green-500">$45.67</p>
              </div>
              <div className="bg-chocolate/40 rounded-xl p-6 text-center">
                <Zap className="w-8 h-8 text-vegas-gold mx-auto mb-2" />
                <h3 className="text-lg font-semibold text-vegas-gold">Requests Today</h3>
                <p className="text-3xl font-bold text-desert-sand">45,670</p>
              </div>
              <div className="bg-chocolate/40 rounded-xl p-6 text-center">
                <Crown className="w-8 h-8 text-vegas-gold mx-auto mb-2" />
                <h3 className="text-lg font-semibold text-vegas-gold">Avg per Request</h3>
                <p className="text-3xl font-bold text-vegas-gold">$0.001</p>
              </div>
            </div>
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
        </div>
      </div>
    </div>
  )
}