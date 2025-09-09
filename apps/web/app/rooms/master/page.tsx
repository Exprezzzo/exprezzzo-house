'use client'
import { useState, useEffect } from 'react'
import { Crown, Activity, Zap, Shield, Users, Server } from 'lucide-react'

export default function MasterRoom() {
  const [stats, setStats] = useState({
    totalRequests: 0,
    activeConnections: 0,
    sovereignStatus: 'ACTIVE',
    systemLoad: '23%',
    revenue: 0.00,
  })

  const [sseConnected, setSseConnected] = useState(false)
  const [sovereignty, setSovereignty] = useState('Checking...')
  const [services, setServices] = useState<any>({})

  useEffect(() => {
    // Fetch sovereignty status
    fetch('/api/status')
      .then(r => r.json())
      .then(data => {
        setSovereignty(data.sovereignty)
        setServices(data.services || {})
      })
      .catch(err => {
        console.error('Status check failed:', err)
        setSovereignty('ERROR')
      })

    // Set up SSE connection
    const eventSource = new EventSource('/api/sse/master')
    
    eventSource.onopen = () => {
      setSseConnected(true)
    }
    
    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data)
      setStats(prev => ({ ...prev, ...data }))
    }
    
    eventSource.onerror = () => {
      setSseConnected(false)
    }
    
    return () => {
      eventSource.close()
    }
  }, [])

  const roomControls = [
    { name: 'Chat', status: 'active', users: 12 },
    { name: 'Library', status: 'active', users: 8 },
    { name: 'Workspace', status: 'active', users: 5 },
    { name: 'Vault', status: 'secure', users: 3 },
    { name: 'Network', status: 'monitoring', users: 2 },
    { name: 'Admin', status: 'restricted', users: 1 },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-chocolate via-vegas-dust to-chocolate">
      <div className="container mx-auto px-6 py-8">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-4 mb-4">
            <Crown className="w-12 h-12 text-vegas-gold animate-pulse" />
            <h1 className="text-6xl font-bold text-vegas-gold">
              MASTER ROOM
            </h1>
          </div>
          <p className="text-2xl text-desert-sand">
            Command Center of the Sovereign House
          </p>
          <div className="flex items-center justify-center gap-2 mt-4">
            <div className={`w-3 h-3 rounded-full animate-pulse ${sseConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className="text-vegas-gold font-medium">
              {sseConnected ? 'Live Connected' : 'Disconnected'}
            </span>
          </div>
        </div>

        {/* Real-time Stats Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6 mb-12">
          <div className="bg-chocolate/80 backdrop-blur border-2 border-vegas-gold/30 rounded-xl p-6 text-center">
            <Activity className="w-8 h-8 text-vegas-gold mx-auto mb-2" />
            <h3 className="text-lg font-semibold text-vegas-gold">Requests</h3>
            <p className="text-3xl font-bold text-desert-sand">{stats.totalRequests.toLocaleString()}</p>
          </div>
          
          <div className="bg-chocolate/80 backdrop-blur border-2 border-vegas-gold/30 rounded-xl p-6 text-center">
            <Users className="w-8 h-8 text-vegas-gold mx-auto mb-2" />
            <h3 className="text-lg font-semibold text-vegas-gold">Active</h3>
            <p className="text-3xl font-bold text-desert-sand">{stats.activeConnections}</p>
          </div>
          
          <div className="bg-chocolate/80 backdrop-blur border-2 border-vegas-gold/30 rounded-xl p-6 text-center">
            <Shield className="w-8 h-8 text-vegas-gold mx-auto mb-2" />
            <h3 className="text-lg font-semibold text-vegas-gold">Status</h3>
            <p className="text-lg font-bold text-green-500">{stats.sovereignStatus}</p>
          </div>
          
          <div className="bg-chocolate/80 backdrop-blur border-2 border-vegas-gold/30 rounded-xl p-6 text-center">
            <Server className="w-8 h-8 text-vegas-gold mx-auto mb-2" />
            <h3 className="text-lg font-semibold text-vegas-gold">Load</h3>
            <p className="text-2xl font-bold text-desert-sand">{stats.systemLoad}</p>
          </div>
          
          <div className="bg-chocolate/80 backdrop-blur border-2 border-vegas-gold/30 rounded-xl p-6 text-center">
            <Zap className="w-8 h-8 text-vegas-gold mx-auto mb-2" />
            <h3 className="text-lg font-semibold text-vegas-gold">Revenue</h3>
            <p className="text-2xl font-bold text-green-500">${stats.revenue.toFixed(3)}</p>
          </div>
        </div>

        {/* Sovereignty Status Panel */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          <div className="bg-chocolate/80 backdrop-blur border-2 border-vegas-gold/30 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <Crown className="w-8 h-8 text-vegas-gold" />
              <h2 className="text-2xl font-bold text-vegas-gold">Sovereignty Status</h2>
            </div>
            <div className="text-center">
              <p className={`text-4xl font-bold mb-2 ${
                sovereignty === 'SOVEREIGN' ? 'text-green-500' :
                sovereignty === 'MOSTLY_SOVEREIGN' ? 'text-yellow-500' :
                sovereignty === 'ERROR' ? 'text-red-500' : 'text-vegas-gold'
              }`}>
                {sovereignty}
              </p>
              <p className="text-desert-sand">Vegas-first architecture ensures data sovereignty</p>
            </div>
          </div>
          
          <div className="bg-chocolate/80 backdrop-blur border-2 border-vegas-gold/30 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <Server className="w-8 h-8 text-vegas-gold" />
              <h2 className="text-2xl font-bold text-vegas-gold">Services Status</h2>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-vegas-gold">Database:</span>
                <span className={services.database ? 'text-green-500' : 'text-red-500'}>
                  {services.database ? '✅ Online' : '❌ Offline'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-vegas-gold">Cache:</span>
                <span className={services.cache ? 'text-green-500' : 'text-red-500'}>
                  {services.cache ? '✅ Online' : '❌ Offline'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-vegas-gold">LLM:</span>
                <span className={services.llm ? 'text-green-500' : 'text-red-500'}>
                  {services.llm ? '✅ Online' : '❌ Offline'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-vegas-gold">Models:</span>
                <span className="text-desert-sand text-sm">
                  {services.models ? services.models.join(', ') : 'Loading...'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Room Control Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {roomControls.map((room) => (
            <div key={room.name} className="bg-chocolate/60 backdrop-blur border-2 border-vegas-gold/20 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-2xl font-bold text-vegas-gold">{room.name}</h3>
                <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                  room.status === 'active' ? 'bg-green-500/20 text-green-500' :
                  room.status === 'secure' ? 'bg-blue-500/20 text-blue-500' :
                  room.status === 'monitoring' ? 'bg-yellow-500/20 text-yellow-500' :
                  'bg-red-500/20 text-red-500'
                }`}>
                  {room.status.toUpperCase()}
                </div>
              </div>
              
              <div className="flex items-center justify-between text-desert-sand">
                <span>Active Users</span>
                <span className="text-2xl font-bold text-vegas-gold">{room.users}</span>
              </div>
              
              <div className="mt-4 pt-4 border-t border-vegas-gold/20">
                <button className="w-full bg-vegas-gold/10 hover:bg-vegas-gold/20 border border-vegas-gold/30 text-vegas-gold font-medium py-2 px-4 rounded-lg transition-colors">
                  Monitor Room
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Vegas Signature */}
        <div className="text-center mt-12 py-8 border-t-2 border-vegas-gold/20">
          <p className="text-vegas-gold text-lg font-semibold">
            🎰 What happens in Vegas... gets processed at $0.0002/request 🎰
          </p>
        </div>
      </div>
    </div>
  )
}