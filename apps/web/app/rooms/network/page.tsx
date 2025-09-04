'use client'
import { useState, useEffect } from 'react'
import { Network, Globe, Server, Wifi, Activity, Shield, Zap, Users, Clock, TrendingUp } from 'lucide-react'

interface NetworkNode {
  id: string
  name: string
  type: 'primary' | 'secondary' | 'edge'
  status: 'active' | 'warning' | 'error'
  location: string
  latency: number
  throughput: number
  connections: number
  uptime: number
}

interface NetworkStats {
  totalNodes: number
  activeConnections: number
  totalThroughput: number
  avgLatency: number
  uptime: number
  requests24h: number
}

export default function NetworkRoom() {
  const [nodes, setNodes] = useState<NetworkNode[]>([])
  const [stats, setStats] = useState<NetworkStats>({
    totalNodes: 0,
    activeConnections: 0,
    totalThroughput: 0,
    avgLatency: 0,
    uptime: 99.97,
    requests24h: 0
  })
  const [selectedNode, setSelectedNode] = useState<string | null>(null)
  const [networkLoad, setNetworkLoad] = useState<number[]>([])

  // Real-time network simulation
  useEffect(() => {
    const networkNodes: NetworkNode[] = [
      {
        id: '1',
        name: 'Vegas-Primary',
        type: 'primary',
        status: 'active',
        location: 'Las Vegas, NV',
        latency: 12,
        throughput: 985,
        connections: 1247,
        uptime: 99.98
      },
      {
        id: '2',
        name: 'Sovereign-Core',
        type: 'primary',
        status: 'active',
        location: 'Local Network',
        latency: 3,
        throughput: 1250,
        connections: 890,
        uptime: 100.0
      },
      {
        id: '3',
        name: 'Ollama-Node',
        type: 'secondary',
        status: 'active',
        location: 'WSL2 Ubuntu',
        latency: 1,
        throughput: 456,
        connections: 234,
        uptime: 99.95
      },
      {
        id: '4',
        name: 'Redis-Cache',
        type: 'secondary',
        status: 'active',
        location: 'Localhost',
        latency: 2,
        throughput: 789,
        connections: 567,
        uptime: 99.99
      },
      {
        id: '5',
        name: 'Postgres-DB',
        type: 'secondary',
        status: 'warning',
        location: 'Localhost',
        latency: 45,
        throughput: 234,
        connections: 123,
        uptime: 99.85
      },
      {
        id: '6',
        name: 'Edge-Mirror',
        type: 'edge',
        status: 'active',
        location: 'CDN Edge',
        latency: 89,
        throughput: 156,
        connections: 45,
        uptime: 99.92
      }
    ]

    setNodes(networkNodes)

    const totalThroughput = networkNodes.reduce((sum, node) => sum + node.throughput, 0)
    const totalConnections = networkNodes.reduce((sum, node) => sum + node.connections, 0)
    const avgLatency = networkNodes.reduce((sum, node) => sum + node.latency, 0) / networkNodes.length

    setStats({
      totalNodes: networkNodes.length,
      activeConnections: totalConnections,
      totalThroughput,
      avgLatency: Math.round(avgLatency),
      uptime: 99.97,
      requests24h: 142567
    })

    // Simulate real-time network load
    const loadInterval = setInterval(() => {
      setNetworkLoad(prev => {
        const newLoad = [...prev, Math.random() * 100]
        return newLoad.slice(-20) // Keep last 20 data points
      })
    }, 1000)

    return () => clearInterval(loadInterval)
  }, [])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-500'
      case 'warning': return 'text-yellow-500'
      case 'error': return 'text-red-500'
      default: return 'text-gray-500'
    }
  }

  const getStatusBg = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500/20 border-green-500/30'
      case 'warning': return 'bg-yellow-500/20 border-yellow-500/30'
      case 'error': return 'bg-red-500/20 border-red-500/30'
      default: return 'bg-gray-500/20 border-gray-500/30'
    }
  }

  const getNodeIcon = (type: string) => {
    switch (type) {
      case 'primary': return <Server className="w-6 h-6" />
      case 'secondary': return <Globe className="w-6 h-6" />
      case 'edge': return <Wifi className="w-6 h-6" />
      default: return <Server className="w-6 h-6" />
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-chocolate via-vegas-dust to-chocolate">
      <div className="container mx-auto px-6 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-4 mb-4">
            <Network className="w-10 h-10 text-vegas-gold" />
            <h1 className="text-4xl font-bold text-vegas-gold">
              NETWORK ROOM
            </h1>
          </div>
          <p className="text-xl text-desert-sand">
            Network Operations Center of the Sovereign House
          </p>
          <div className="flex items-center justify-center gap-2 mt-4">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-vegas-gold font-medium">All Systems Operational</span>
          </div>
        </div>

        {/* Network Stats */}
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-8">
          <div className="bg-chocolate/60 backdrop-blur border-2 border-vegas-gold/20 rounded-xl p-4 text-center">
            <Server className="w-6 h-6 text-vegas-gold mx-auto mb-2" />
            <h3 className="text-sm font-semibold text-vegas-gold">Nodes</h3>
            <p className="text-2xl font-bold text-desert-sand">{stats.totalNodes}</p>
          </div>
          
          <div className="bg-chocolate/60 backdrop-blur border-2 border-vegas-gold/20 rounded-xl p-4 text-center">
            <Users className="w-6 h-6 text-vegas-gold mx-auto mb-2" />
            <h3 className="text-sm font-semibold text-vegas-gold">Connections</h3>
            <p className="text-2xl font-bold text-desert-sand">{stats.activeConnections.toLocaleString()}</p>
          </div>
          
          <div className="bg-chocolate/60 backdrop-blur border-2 border-vegas-gold/20 rounded-xl p-4 text-center">
            <TrendingUp className="w-6 h-6 text-vegas-gold mx-auto mb-2" />
            <h3 className="text-sm font-semibold text-vegas-gold">Throughput</h3>
            <p className="text-2xl font-bold text-desert-sand">{stats.totalThroughput}</p>
          </div>
          
          <div className="bg-chocolate/60 backdrop-blur border-2 border-vegas-gold/20 rounded-xl p-4 text-center">
            <Clock className="w-6 h-6 text-vegas-gold mx-auto mb-2" />
            <h3 className="text-sm font-semibold text-vegas-gold">Latency</h3>
            <p className="text-2xl font-bold text-desert-sand">{stats.avgLatency}ms</p>
          </div>
          
          <div className="bg-chocolate/60 backdrop-blur border-2 border-vegas-gold/20 rounded-xl p-4 text-center">
            <Shield className="w-6 h-6 text-vegas-gold mx-auto mb-2" />
            <h3 className="text-sm font-semibold text-vegas-gold">Uptime</h3>
            <p className="text-2xl font-bold text-green-500">{stats.uptime}%</p>
          </div>
          
          <div className="bg-chocolate/60 backdrop-blur border-2 border-vegas-gold/20 rounded-xl p-4 text-center">
            <Activity className="w-6 h-6 text-vegas-gold mx-auto mb-2" />
            <h3 className="text-sm font-semibold text-vegas-gold">Requests</h3>
            <p className="text-2xl font-bold text-desert-sand">{stats.requests24h.toLocaleString()}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Network Topology */}
          <div className="lg:col-span-2 bg-chocolate/60 backdrop-blur border-2 border-vegas-gold/20 rounded-xl p-6">
            <div className="flex items-center gap-2 mb-6">
              <Globe className="w-6 h-6 text-vegas-gold" />
              <h2 className="text-2xl font-bold text-vegas-gold">Network Topology</h2>
            </div>
            
            {/* Network Visualization */}
            <div className="relative bg-chocolate/40 rounded-xl p-8 min-h-96">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="grid grid-cols-3 gap-16">
                  {/* Primary Nodes */}
                  <div className="flex flex-col items-center gap-8">
                    {nodes.filter(node => node.type === 'primary').map((node) => (
                      <div
                        key={node.id}
                        onClick={() => setSelectedNode(node.id)}
                        className={`relative cursor-pointer transition-transform hover:scale-110 ${
                          selectedNode === node.id ? 'scale-110' : ''
                        }`}
                      >
                        <div className={`w-16 h-16 rounded-full border-2 ${getStatusBg(node.status)} flex items-center justify-center`}>
                          <div className={getStatusColor(node.status)}>
                            {getNodeIcon(node.type)}
                          </div>
                        </div>
                        <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 text-xs text-vegas-gold whitespace-nowrap">
                          {node.name}
                        </div>
                        <div className={`absolute -top-2 -right-2 w-4 h-4 rounded-full animate-pulse ${
                          node.status === 'active' ? 'bg-green-500' :
                          node.status === 'warning' ? 'bg-yellow-500' : 'bg-red-500'
                        }`}></div>
                      </div>
                    ))}
                  </div>

                  {/* Secondary Nodes */}
                  <div className="flex flex-col items-center gap-6">
                    {nodes.filter(node => node.type === 'secondary').map((node) => (
                      <div
                        key={node.id}
                        onClick={() => setSelectedNode(node.id)}
                        className={`relative cursor-pointer transition-transform hover:scale-110 ${
                          selectedNode === node.id ? 'scale-110' : ''
                        }`}
                      >
                        <div className={`w-12 h-12 rounded-full border-2 ${getStatusBg(node.status)} flex items-center justify-center`}>
                          <div className={getStatusColor(node.status)}>
                            {getNodeIcon(node.type)}
                          </div>
                        </div>
                        <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 text-xs text-vegas-gold whitespace-nowrap">
                          {node.name}
                        </div>
                        <div className={`absolute -top-1 -right-1 w-3 h-3 rounded-full animate-pulse ${
                          node.status === 'active' ? 'bg-green-500' :
                          node.status === 'warning' ? 'bg-yellow-500' : 'bg-red-500'
                        }`}></div>
                      </div>
                    ))}
                  </div>

                  {/* Edge Nodes */}
                  <div className="flex flex-col items-center gap-8">
                    {nodes.filter(node => node.type === 'edge').map((node) => (
                      <div
                        key={node.id}
                        onClick={() => setSelectedNode(node.id)}
                        className={`relative cursor-pointer transition-transform hover:scale-110 ${
                          selectedNode === node.id ? 'scale-110' : ''
                        }`}
                      >
                        <div className={`w-10 h-10 rounded-full border-2 ${getStatusBg(node.status)} flex items-center justify-center`}>
                          <div className={getStatusColor(node.status)}>
                            {getNodeIcon(node.type)}
                          </div>
                        </div>
                        <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 text-xs text-vegas-gold whitespace-nowrap">
                          {node.name}
                        </div>
                        <div className={`absolute -top-1 -right-1 w-3 h-3 rounded-full animate-pulse ${
                          node.status === 'active' ? 'bg-green-500' :
                          node.status === 'warning' ? 'bg-yellow-500' : 'bg-red-500'
                        }`}></div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Connection Lines */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none">
                <defs>
                  <linearGradient id="connectionGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#C5B358" stopOpacity="0.3"/>
                    <stop offset="100%" stopColor="#C5B358" stopOpacity="0.1"/>
                  </linearGradient>
                </defs>
                {/* Draw connection lines between nodes */}
                <line x1="30%" y1="50%" x2="50%" y2="30%" stroke="url(#connectionGradient)" strokeWidth="2" strokeDasharray="5,5">
                  <animate attributeName="stroke-dashoffset" values="0;10" dur="2s" repeatCount="indefinite"/>
                </line>
                <line x1="30%" y1="50%" x2="50%" y2="70%" stroke="url(#connectionGradient)" strokeWidth="2" strokeDasharray="5,5">
                  <animate attributeName="stroke-dashoffset" values="0;10" dur="2s" repeatCount="indefinite"/>
                </line>
                <line x1="50%" y1="50%" x2="70%" y2="50%" stroke="url(#connectionGradient)" strokeWidth="2" strokeDasharray="5,5">
                  <animate attributeName="stroke-dashoffset" values="0;10" dur="2s" repeatCount="indefinite"/>
                </line>
              </svg>
            </div>
          </div>

          {/* Node Details & Controls */}
          <div className="space-y-6">
            {/* Real-time Network Load */}
            <div className="bg-chocolate/60 backdrop-blur border-2 border-vegas-gold/20 rounded-xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <Activity className="w-5 h-5 text-vegas-gold" />
                <h3 className="text-lg font-bold text-vegas-gold">Network Load</h3>
              </div>
              <div className="h-24 flex items-end gap-1">
                {networkLoad.map((load, index) => (
                  <div
                    key={index}
                    className="bg-vegas-gold/60 rounded-sm flex-1 transition-all"
                    style={{ height: `${load}%` }}
                  ></div>
                ))}
              </div>
              <div className="text-center mt-2 text-sm text-desert-sand">
                Current Load: {Math.round(networkLoad[networkLoad.length - 1] || 0)}%
              </div>
            </div>

            {/* Selected Node Details */}
            {selectedNode && (
              <div className="bg-chocolate/60 backdrop-blur border-2 border-vegas-gold/20 rounded-xl p-6">
                {(() => {
                  const node = nodes.find(n => n.id === selectedNode)
                  if (!node) return null
                  
                  return (
                    <>
                      <div className="flex items-center gap-2 mb-4">
                        <div className={getStatusColor(node.status)}>
                          {getNodeIcon(node.type)}
                        </div>
                        <h3 className="text-lg font-bold text-vegas-gold">{node.name}</h3>
                        <div className={`px-2 py-1 rounded text-xs font-medium ${getStatusBg(node.status)}`}>
                          {node.status.toUpperCase()}
                        </div>
                      </div>
                      
                      <div className="space-y-3 text-sm">
                        <div className="flex justify-between">
                          <span className="text-vegas-gold">Location:</span>
                          <span className="text-desert-sand">{node.location}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-vegas-gold">Latency:</span>
                          <span className="text-desert-sand">{node.latency}ms</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-vegas-gold">Throughput:</span>
                          <span className="text-desert-sand">{node.throughput} MB/s</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-vegas-gold">Connections:</span>
                          <span className="text-desert-sand">{node.connections}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-vegas-gold">Uptime:</span>
                          <span className={node.uptime > 99 ? 'text-green-500' : 'text-yellow-500'}>
                            {node.uptime}%
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex gap-2 mt-4 pt-4 border-t border-vegas-gold/20">
                        <button className="flex-1 bg-vegas-gold/10 hover:bg-vegas-gold/20 border border-vegas-gold/30 text-vegas-gold font-medium py-2 px-3 rounded-lg transition-colors text-sm">
                          Monitor
                        </button>
                        <button className="flex-1 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 text-blue-400 font-medium py-2 px-3 rounded-lg transition-colors text-sm">
                          Configure
                        </button>
                      </div>
                    </>
                  )
                })()}
              </div>
            )}

            {/* Quick Actions */}
            <div className="bg-chocolate/60 backdrop-blur border-2 border-vegas-gold/20 rounded-xl p-6">
              <h3 className="text-lg font-bold text-vegas-gold mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <button className="w-full bg-vegas-gold/10 hover:bg-vegas-gold/20 border border-vegas-gold/30 text-vegas-gold font-medium py-2 px-4 rounded-lg transition-colors text-sm">
                  Run Network Diagnostics
                </button>
                <button className="w-full bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 text-blue-400 font-medium py-2 px-4 rounded-lg transition-colors text-sm">
                  Scale Network
                </button>
                <button className="w-full bg-green-500/10 hover:bg-green-500/20 border border-green-500/30 text-green-400 font-medium py-2 px-4 rounded-lg transition-colors text-sm">
                  Backup Configuration
                </button>
                <button className="w-full bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 font-medium py-2 px-4 rounded-lg transition-colors text-sm">
                  Emergency Shutdown
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Vegas Footer */}
        <div className="text-center mt-12 py-8 border-t-2 border-vegas-gold/20">
          <p className="text-vegas-gold text-lg font-semibold">
            🌐 Connected like Vegas lights - Always on, always winning 🌐
          </p>
        </div>
      </div>
    </div>
  )
}