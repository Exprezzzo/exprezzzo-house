'use client'
import { useState, useEffect } from 'react'
import { Briefcase, Play, Save, FolderOpen, Terminal, Code2, FileText, Zap, Clock } from 'lucide-react'

interface Project {
  id: string
  name: string
  type: 'ai-model' | 'web-app' | 'api' | 'script'
  status: 'active' | 'paused' | 'completed'
  lastModified: Date
  size: string
  language: string
  description: string
}

interface WorkspaceStats {
  activeProjects: number
  totalRequests: number
  avgResponseTime: number
  costSavings: number
}

export default function WorkspaceRoom() {
  const [projects, setProjects] = useState<Project[]>([])
  const [selectedProject, setSelectedProject] = useState<string | null>(null)
  const [code, setCode] = useState('')
  const [terminal, setTerminal] = useState<string[]>([])
  const [isRunning, setIsRunning] = useState(false)
  const [stats, setStats] = useState<WorkspaceStats>({
    activeProjects: 0,
    totalRequests: 0,
    avgResponseTime: 0,
    costSavings: 0
  })

  // Sample workspace data
  useEffect(() => {
    setProjects([
      {
        id: '1',
        name: 'Sovereign Chat Bot',
        type: 'ai-model',
        status: 'active',
        lastModified: new Date('2025-01-15'),
        size: '2.3 MB',
        language: 'Python',
        description: 'Custom chat bot with local Ollama integration'
      },
      {
        id: '2',
        name: 'Cost Optimizer API',
        type: 'api',
        status: 'active',
        lastModified: new Date('2025-01-14'),
        size: '850 KB',
        language: 'Node.js',
        description: 'API endpoint for $0.0002 request optimization'
      },
      {
        id: '3',
        name: 'Vegas UI Dashboard',
        type: 'web-app',
        status: 'paused',
        lastModified: new Date('2025-01-12'),
        size: '1.2 MB',
        language: 'TypeScript',
        description: 'Real-time monitoring dashboard with Vegas theme'
      },
      {
        id: '4',
        name: 'Model Deployment Script',
        type: 'script',
        status: 'completed',
        lastModified: new Date('2025-01-10'),
        size: '245 KB',
        language: 'Bash',
        description: 'Automated deployment script for Ollama models'
      }
    ])

    setStats({
      activeProjects: 2,
      totalRequests: 15420,
      avgResponseTime: 0.15,
      costSavings: 15.42
    })

    // Sample code for first project
    setCode(`# Sovereign Chat Bot - EXPREZZZO House
import ollama
import redis
from datetime import datetime

class SovereignChatBot:
    def __init__(self):
        self.redis_client = redis.Redis(host='localhost', port=6379, db=0)
        self.model = 'llama3.2'
        self.cost_per_request = 0.001
        
    async def process_message(self, message: str, user_id: str):
        """Process user message with $0.0002 cost tracking"""
        try:
            # Log request for cost tracking
            request_id = self.log_request(user_id)
            
            # Generate response using Ollama
            response = ollama.chat(
                model=self.model,
                messages=[{'role': 'user', 'content': message}],
                stream=True
            )
            
            # Stream response with SSE
            async for chunk in response:
                yield chunk['message']['content']
                
            # Update cost tracking
            self.update_cost(request_id, self.cost_per_request)
            
        except Exception as e:
            yield f"Error: {str(e)}"
    
    def log_request(self, user_id: str) -> str:
        """Log request for billing and analytics"""
        request_id = f"req_{datetime.now().timestamp()}"
        self.redis_client.hset(request_id, {
            'user_id': user_id,
            'timestamp': datetime.now().isoformat(),
            'status': 'processing',
            'cost': self.cost_per_request
        })
        return request_id
    
    def update_cost(self, request_id: str, cost: float):
        """Update request cost and status"""
        self.redis_client.hset(request_id, {
            'status': 'completed',
            'final_cost': cost
        })

# Initialize bot
bot = SovereignChatBot()

# Vegas-style success message
print("🎰 Sovereign Chat Bot initialized - Ready to roll! 🎰")`)
  }, [])

  const runCode = async () => {
    setIsRunning(true)
    setTerminal(prev => [...prev, '$ Running Sovereign Chat Bot...'])
    
    // Simulate code execution
    await new Promise(resolve => setTimeout(resolve, 1000))
    setTerminal(prev => [...prev, '🎰 Sovereign Chat Bot initialized - Ready to roll! 🎰'])
    
    await new Promise(resolve => setTimeout(resolve, 500))
    setTerminal(prev => [...prev, '✓ Redis connection established'])
    
    await new Promise(resolve => setTimeout(resolve, 500))
    setTerminal(prev => [...prev, '✓ Ollama model loaded: llama3.2'])
    
    await new Promise(resolve => setTimeout(resolve, 500))
    setTerminal(prev => [...prev, '✓ Cost tracking enabled: $0.0002 per request'])
    
    await new Promise(resolve => setTimeout(resolve, 500))
    setTerminal(prev => [...prev, '🚀 Bot is live and ready for requests!'])
    
    setIsRunning(false)
  }

  const saveProject = () => {
    setTerminal(prev => [...prev, `💾 Project saved: ${new Date().toLocaleTimeString()}`])
  }

  const getProjectIcon = (type: string) => {
    switch (type) {
      case 'ai-model': return <Zap className="w-5 h-5" />
      case 'web-app': return <Code2 className="w-5 h-5" />
      case 'api': return <Terminal className="w-5 h-5" />
      case 'script': return <FileText className="w-5 h-5" />
      default: return <FileText className="w-5 h-5" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-500'
      case 'paused': return 'text-yellow-500'
      case 'completed': return 'text-blue-500'
      default: return 'text-gray-500'
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-chocolate via-vegas-dust to-chocolate">
      <div className="container mx-auto px-6 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-4 mb-4">
            <Briefcase className="w-10 h-10 text-vegas-gold" />
            <h1 className="text-4xl font-bold text-vegas-gold">
              WORKSPACE ROOM
            </h1>
          </div>
          <p className="text-xl text-desert-sand">
            Development Hub of the Sovereign House
          </p>
        </div>

        {/* Stats Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-chocolate/60 backdrop-blur border-2 border-vegas-gold/20 rounded-xl p-6 text-center">
            <Briefcase className="w-8 h-8 text-vegas-gold mx-auto mb-2" />
            <h3 className="text-lg font-semibold text-vegas-gold">Active Projects</h3>
            <p className="text-3xl font-bold text-desert-sand">{stats.activeProjects}</p>
          </div>
          
          <div className="bg-chocolate/60 backdrop-blur border-2 border-vegas-gold/20 rounded-xl p-6 text-center">
            <Zap className="w-8 h-8 text-vegas-gold mx-auto mb-2" />
            <h3 className="text-lg font-semibold text-vegas-gold">Total Requests</h3>
            <p className="text-3xl font-bold text-desert-sand">{stats.totalRequests.toLocaleString()}</p>
          </div>
          
          <div className="bg-chocolate/60 backdrop-blur border-2 border-vegas-gold/20 rounded-xl p-6 text-center">
            <Clock className="w-8 h-8 text-vegas-gold mx-auto mb-2" />
            <h3 className="text-lg font-semibold text-vegas-gold">Avg Response</h3>
            <p className="text-3xl font-bold text-desert-sand">{stats.avgResponseTime}s</p>
          </div>
          
          <div className="bg-chocolate/60 backdrop-blur border-2 border-vegas-gold/20 rounded-xl p-6 text-center">
            <div className="text-green-500 text-2xl mb-2">💰</div>
            <h3 className="text-lg font-semibold text-vegas-gold">Cost Savings</h3>
            <p className="text-3xl font-bold text-green-500">${stats.costSavings}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Project List */}
          <div className="bg-chocolate/60 backdrop-blur border-2 border-vegas-gold/20 rounded-xl p-6">
            <div className="flex items-center gap-2 mb-6">
              <FolderOpen className="w-6 h-6 text-vegas-gold" />
              <h2 className="text-2xl font-bold text-vegas-gold">Projects</h2>
            </div>
            
            <div className="space-y-4">
              {projects.map((project) => (
                <div
                  key={project.id}
                  onClick={() => setSelectedProject(project.id)}
                  className={`p-4 rounded-lg cursor-pointer transition-colors border ${
                    selectedProject === project.id
                      ? 'bg-vegas-gold/20 border-vegas-gold/50'
                      : 'bg-chocolate/40 border-vegas-gold/20 hover:border-vegas-gold/40'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="text-vegas-gold mt-1">
                      {getProjectIcon(project.type)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-vegas-gold">{project.name}</h3>
                        <span className={`text-xs font-medium ${getStatusColor(project.status)}`}>
                          ●
                        </span>
                      </div>
                      <p className="text-sm text-desert-sand/80 mb-2">{project.description}</p>
                      <div className="flex items-center gap-4 text-xs text-desert-sand/60">
                        <span>{project.language}</span>
                        <span>{project.size}</span>
                        <span>{project.lastModified.toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <button className="w-full mt-6 bg-vegas-gold/10 hover:bg-vegas-gold/20 border border-vegas-gold/30 text-vegas-gold font-medium py-2 px-4 rounded-lg transition-colors">
              + New Project
            </button>
          </div>

          {/* Code Editor */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-chocolate/60 backdrop-blur border-2 border-vegas-gold/20 rounded-xl">
              <div className="flex items-center justify-between p-4 border-b border-vegas-gold/20">
                <div className="flex items-center gap-2">
                  <Code2 className="w-5 h-5 text-vegas-gold" />
                  <h2 className="text-xl font-bold text-vegas-gold">Code Editor</h2>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={saveProject}
                    className="bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 text-blue-400 px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
                  >
                    <Save className="w-4 h-4" />
                    Save
                  </button>
                  <button
                    onClick={runCode}
                    disabled={isRunning}
                    className="bg-green-500/20 hover:bg-green-500/30 disabled:bg-green-500/10 border border-green-500/30 text-green-400 px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
                  >
                    <Play className="w-4 h-4" />
                    {isRunning ? 'Running...' : 'Run'}
                  </button>
                </div>
              </div>
              
              <textarea
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full h-96 p-4 bg-transparent text-desert-sand font-mono text-sm resize-none focus:outline-none"
                placeholder="// Start coding your sovereign AI project..."
              />
            </div>

            {/* Terminal */}
            <div className="bg-chocolate/60 backdrop-blur border-2 border-vegas-gold/20 rounded-xl">
              <div className="flex items-center gap-2 p-4 border-b border-vegas-gold/20">
                <Terminal className="w-5 h-5 text-vegas-gold" />
                <h2 className="text-xl font-bold text-vegas-gold">Terminal</h2>
                <button
                  onClick={() => setTerminal([])}
                  className="ml-auto text-vegas-gold/60 hover:text-vegas-gold text-sm"
                >
                  Clear
                </button>
              </div>
              
              <div className="p-4 h-48 overflow-y-auto">
                {terminal.length === 0 ? (
                  <div className="text-vegas-gold/40 font-mono">
                    Welcome to EXPREZZZO Sovereign Terminal - Ready for commands
                  </div>
                ) : (
                  <div className="space-y-1">
                    {terminal.map((line, index) => (
                      <div key={index} className="text-green-400 font-mono text-sm">
                        {line}
                      </div>
                    ))}
                  </div>
                )}
                {isRunning && (
                  <div className="flex items-center gap-2 text-vegas-gold font-mono text-sm">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-vegas-gold rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-vegas-gold rounded-full animate-bounce delay-100"></div>
                      <div className="w-2 h-2 bg-vegas-gold rounded-full animate-bounce delay-200"></div>
                    </div>
                    Executing...
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Vegas Footer */}
        <div className="text-center mt-12 py-8 border-t-2 border-vegas-gold/20">
          <p className="text-vegas-gold text-lg font-semibold">
            ⚡ Code like a high-roller - Every line counts at $0.0002 ⚡
          </p>
        </div>
      </div>
    </div>
  )
}