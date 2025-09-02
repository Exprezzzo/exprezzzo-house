"use client"

import { useEffect, useState } from 'react'
import { Shield, DollarSign, AlertTriangle } from 'lucide-react'

interface SovereigntyScore {
  vendor_name: string
  sovereignty_score: number
  lock_in_risk: string
  escape_difficulty: string
}

interface Provider {
  name: string
  type: string
  enabled: boolean
  sovereignty_score: number
}

export default function Home() {
  const [health, setHealth] = useState<any>(null)
  const [sovereignty, setSovereignty] = useState<SovereigntyScore[]>([])
  const [providers, setProviders] = useState<Provider[]>([])

  useEffect(() => {
    fetch('http://localhost:3001/health')
      .then(res => res.json())
      .then(setHealth)
      .catch(console.error)

    fetch('http://localhost:3001/api/sovereignty')
      .then(res => res.json())
      .then(data => setSovereignty(data.vendors))
      .catch(console.error)

    fetch('http://localhost:3001/api/providers')
      .then(res => res.json())
      .then(data => setProviders(data.providers))
      .catch(console.error)
  }, [])

  const getScoreColor = (score: number) => {
    if (score >= 0.9) return 'text-green-500'
    if (score >= 0.7) return 'text-yellow-500'
    return 'text-red-500'
  }

  return (
    <div className="space-y-8">
      <h2 className="text-3xl font-bold text-vegas-gold">Master Bedroom - Orchestration Center</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card-sovereign">
          <div className="flex items-center gap-2 mb-2">
            <Shield className="text-vegas-gold" />
            <h3 className="text-lg font-semibold text-vegas-gold">Sovereignty</h3>
          </div>
          <p className="text-2xl font-bold text-green-500">100%</p>
          <p className="text-sm text-dust">Local-first enforced</p>
        </div>
        
        <div className="card-sovereign">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="text-vegas-gold" />
            <h3 className="text-lg font-semibold text-vegas-gold">Cost Target</h3>
          </div>
          <p className="text-2xl font-bold text-green-500">$0.001</p>
          <p className="text-sm text-dust">Per request maximum</p>
        </div>
        
        <div className="card-sovereign">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="text-vegas-gold" />
            <h3 className="text-lg font-semibold text-vegas-gold">Escape Protocol</h3>
          </div>
          <p className="text-2xl font-bold text-green-500">Ready</p>
          <p className="text-sm text-dust">Docker compose active</p>
        </div>
      </div>

      <div className="card-sovereign">
        <h3 className="text-xl font-semibold mb-4 text-vegas-gold">System Status</h3>
        {health && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>Database: {health.services?.database ? '✅' : '❌'}</div>
            <div>Cache: {health.services?.cache ? '✅' : '❌'}</div>
            <div>LLM: {health.services?.llm ? '✅' : '❌'}</div>
            <div>Mode: {health.sovereignty?.mode}</div>
            <div className="col-span-2 md:col-span-4">
              Models: {health.services?.models?.join(', ') || 'None'}
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card-sovereign">
          <h3 className="text-xl font-semibold mb-4 text-vegas-gold">Sovereignty Scores</h3>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {sovereignty.map((vendor) => (
              <div key={vendor.vendor_name} className="flex justify-between items-center">
                <span>{vendor.vendor_name}</span>
                <div className="flex gap-4 items-center">
                  <span className={getScoreColor(vendor.sovereignty_score)}>
                    {(vendor.sovereignty_score * 100).toFixed(0)}%
                  </span>
                  <span className="text-xs text-dust">{vendor.lock_in_risk}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card-sovereign">
          <h3 className="text-xl font-semibold mb-4 text-vegas-gold">Provider Lanes</h3>
          <div className="space-y-2">
            {providers.map((provider) => (
              <div key={provider.name} className="flex justify-between items-center">
                <span>{provider.name}</span>
                <div className="flex gap-4 items-center">
                  <span className={`text-xs px-2 py-1 rounded ${
                    provider.type === 'sovereign' ? 'bg-green-500/20 text-green-500' :
                    provider.type === 'flash' ? 'bg-yellow-500/20 text-yellow-500' :
                    'bg-red-500/20 text-red-500'
                  }`}>
                    {provider.type}
                  </span>
                  <span className={provider.enabled ? 'text-green-500' : 'text-gray-500'}>
                    {provider.enabled ? '✓' : '✗'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}