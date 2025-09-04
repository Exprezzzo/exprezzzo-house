'use client'
import { useState, useEffect } from 'react'
import { Shield, Key, Lock, Eye, EyeOff, Download, Upload, AlertTriangle, CheckCircle } from 'lucide-react'

interface SecureItem {
  id: string
  name: string
  type: 'api-key' | 'credentials' | 'certificate' | 'token'
  description: string
  dateAdded: Date
  lastAccessed: Date
  accessCount: number
  isExpired: boolean
  expiryDate?: Date
}

interface VaultStats {
  totalItems: number
  expiredItems: number
  recentAccesses: number
  securityLevel: 'HIGH' | 'MEDIUM' | 'LOW'
}

export default function VaultRoom() {
  const [vaultItems, setVaultItems] = useState<SecureItem[]>([])
  const [showSecrets, setShowSecrets] = useState<{[key: string]: boolean}>({})
  const [masterPassword, setMasterPassword] = useState('')
  const [isUnlocked, setIsUnlocked] = useState(false)
  const [stats, setStats] = useState<VaultStats>({
    totalItems: 0,
    expiredItems: 0,
    recentAccesses: 0,
    securityLevel: 'HIGH'
  })

  // Sample vault data
  useEffect(() => {
    const items: SecureItem[] = [
      {
        id: '1',
        name: 'Ollama API Key',
        type: 'api-key',
        description: 'Local Ollama instance authentication key',
        dateAdded: new Date('2025-01-15'),
        lastAccessed: new Date('2025-01-15'),
        accessCount: 45,
        isExpired: false,
        expiryDate: new Date('2025-12-31')
      },
      {
        id: '2',
        name: 'PostgreSQL Credentials',
        type: 'credentials',
        description: 'Database connection credentials for sovereign_db',
        dateAdded: new Date('2025-01-10'),
        lastAccessed: new Date('2025-01-14'),
        accessCount: 128,
        isExpired: false
      },
      {
        id: '3',
        name: 'Redis Auth Token',
        type: 'token',
        description: 'Redis cache authentication token',
        dateAdded: new Date('2025-01-08'),
        lastAccessed: new Date('2025-01-13'),
        accessCount: 67,
        isExpired: false,
        expiryDate: new Date('2025-06-30')
      },
      {
        id: '4',
        name: 'SSL Certificate',
        type: 'certificate',
        description: 'EXPREZZZO House SSL/TLS certificate',
        dateAdded: new Date('2024-12-01'),
        lastAccessed: new Date('2025-01-12'),
        accessCount: 23,
        isExpired: true,
        expiryDate: new Date('2025-01-01')
      },
      {
        id: '5',
        name: 'JWT Secret',
        type: 'token',
        description: 'JSON Web Token signing secret for authentication',
        dateAdded: new Date('2025-01-05'),
        lastAccessed: new Date('2025-01-15'),
        accessCount: 89,
        isExpired: false
      }
    ]

    setVaultItems(items)
    setStats({
      totalItems: items.length,
      expiredItems: items.filter(item => item.isExpired).length,
      recentAccesses: items.reduce((sum, item) => sum + item.accessCount, 0),
      securityLevel: items.filter(item => item.isExpired).length > 0 ? 'MEDIUM' : 'HIGH'
    })
  }, [])

  const handleUnlock = () => {
    // Simple unlock mechanism - in production, this would be properly secured
    if (masterPassword === 'vegas2025') {
      setIsUnlocked(true)
      setMasterPassword('')
    } else {
      alert('Invalid master password')
    }
  }

  const toggleSecretVisibility = (itemId: string) => {
    if (!isUnlocked) return
    
    setShowSecrets(prev => ({
      ...prev,
      [itemId]: !prev[itemId]
    }))

    // Update access count
    setVaultItems(prev => 
      prev.map(item => 
        item.id === itemId 
          ? { ...item, accessCount: item.accessCount + 1, lastAccessed: new Date() }
          : item
      )
    )
  }

  const getSecretValue = (item: SecureItem) => {
    const secrets: {[key: string]: string} = {
      '1': 'ollama_key_a1b2c3d4e5f6g7h8',
      '2': 'postgresql://user:pass@localhost:5432/sovereign_db',
      '3': 'redis_token_x9y8z7w6v5u4t3s2',
      '4': '-----BEGIN CERTIFICATE-----\nMIIDXTCCAkWgAwIBAgIJAK...',
      '5': 'jwt_secret_m5n4o3p2q1r0s9t8u7v6w5x4y3z2a1b0'
    }
    return secrets[item.id] || 'secret_value_encrypted'
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'api-key': return <Key className="w-5 h-5" />
      case 'credentials': return <Shield className="w-5 h-5" />
      case 'certificate': return <CheckCircle className="w-5 h-5" />
      case 'token': return <Lock className="w-5 h-5" />
      default: return <Shield className="w-5 h-5" />
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'api-key': return 'text-blue-400'
      case 'credentials': return 'text-green-400'
      case 'certificate': return 'text-purple-400'
      case 'token': return 'text-yellow-400'
      default: return 'text-vegas-gold'
    }
  }

  if (!isUnlocked) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-chocolate via-vegas-dust to-chocolate flex items-center justify-center">
        <div className="bg-chocolate/80 backdrop-blur border-2 border-vegas-gold/30 rounded-2xl p-12 text-center max-w-md w-full mx-6">
          <Shield className="w-20 h-20 text-vegas-gold mx-auto mb-6" />
          <h1 className="text-4xl font-bold text-vegas-gold mb-4">VAULT ACCESS</h1>
          <p className="text-desert-sand mb-8">Enter master password to access the secure vault</p>
          
          <div className="space-y-4">
            <input
              type="password"
              value={masterPassword}
              onChange={(e) => setMasterPassword(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleUnlock()}
              placeholder="Master Password"
              className="w-full p-4 bg-chocolate/60 border border-vegas-gold/30 rounded-lg text-vegas-gold placeholder-vegas-gold/60 focus:outline-none focus:border-vegas-gold/60"
            />
            <button
              onClick={handleUnlock}
              className="w-full bg-vegas-gold hover:bg-vegas-gold/80 text-chocolate font-bold py-4 px-6 rounded-lg transition-colors"
            >
              <Lock className="w-5 h-5 inline mr-2" />
              UNLOCK VAULT
            </button>
          </div>
          
          <div className="mt-8 pt-6 border-t border-vegas-gold/20">
            <p className="text-vegas-gold/60 text-sm">
              🔒 Sovereign Security - Your secrets stay in Vegas 🔒
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-chocolate via-vegas-dust to-chocolate">
      <div className="container mx-auto px-6 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-4 mb-4">
            <Shield className="w-10 h-10 text-vegas-gold" />
            <h1 className="text-4xl font-bold text-vegas-gold">
              VAULT ROOM
            </h1>
            <button
              onClick={() => setIsUnlocked(false)}
              className="bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-400 px-3 py-1 rounded-lg text-sm"
            >
              Lock
            </button>
          </div>
          <p className="text-xl text-desert-sand">
            Secure Storage of the Sovereign House
          </p>
        </div>

        {/* Security Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-chocolate/60 backdrop-blur border-2 border-vegas-gold/20 rounded-xl p-6 text-center">
            <Shield className="w-8 h-8 text-vegas-gold mx-auto mb-2" />
            <h3 className="text-lg font-semibold text-vegas-gold">Total Items</h3>
            <p className="text-3xl font-bold text-desert-sand">{stats.totalItems}</p>
          </div>
          
          <div className="bg-chocolate/60 backdrop-blur border-2 border-vegas-gold/20 rounded-xl p-6 text-center">
            <AlertTriangle className="w-8 h-8 text-red-400 mx-auto mb-2" />
            <h3 className="text-lg font-semibold text-vegas-gold">Expired</h3>
            <p className="text-3xl font-bold text-red-400">{stats.expiredItems}</p>
          </div>
          
          <div className="bg-chocolate/60 backdrop-blur border-2 border-vegas-gold/20 rounded-xl p-6 text-center">
            <Eye className="w-8 h-8 text-vegas-gold mx-auto mb-2" />
            <h3 className="text-lg font-semibold text-vegas-gold">Accesses</h3>
            <p className="text-3xl font-bold text-desert-sand">{stats.recentAccesses}</p>
          </div>
          
          <div className="bg-chocolate/60 backdrop-blur border-2 border-vegas-gold/20 rounded-xl p-6 text-center">
            <CheckCircle className="w-8 h-8 text-green-400 mx-auto mb-2" />
            <h3 className="text-lg font-semibold text-vegas-gold">Security</h3>
            <p className={`text-2xl font-bold ${
              stats.securityLevel === 'HIGH' ? 'text-green-400' : 
              stats.securityLevel === 'MEDIUM' ? 'text-yellow-400' : 'text-red-400'
            }`}>
              {stats.securityLevel}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-center gap-4 mb-8">
          <button className="bg-vegas-gold/10 hover:bg-vegas-gold/20 border border-vegas-gold/30 text-vegas-gold font-medium py-3 px-6 rounded-lg transition-colors flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Add Secret
          </button>
          <button className="bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 text-blue-400 font-medium py-3 px-6 rounded-lg transition-colors flex items-center gap-2">
            <Download className="w-5 h-5" />
            Export Backup
          </button>
        </div>

        {/* Vault Items */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {vaultItems.map((item) => (
            <div key={item.id} className="bg-chocolate/60 backdrop-blur border-2 border-vegas-gold/20 rounded-xl p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={getTypeColor(item.type)}>
                    {getTypeIcon(item.type)}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-vegas-gold">{item.name}</h3>
                    <p className="text-sm text-desert-sand/80">{item.description}</p>
                  </div>
                </div>
                {item.isExpired && (
                  <div className="bg-red-500/20 border border-red-500/30 text-red-400 px-2 py-1 rounded text-xs font-medium">
                    EXPIRED
                  </div>
                )}
              </div>

              {/* Secret Value */}
              <div className="bg-chocolate/40 border border-vegas-gold/30 rounded-lg p-4 mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-vegas-gold font-medium">Secret Value:</span>
                  <button
                    onClick={() => toggleSecretVisibility(item.id)}
                    className="text-vegas-gold hover:text-vegas-gold/80 transition-colors"
                  >
                    {showSecrets[item.id] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <div className="font-mono text-sm text-desert-sand">
                  {showSecrets[item.id] ? getSecretValue(item) : '••••••••••••••••••••••••••••••••'}
                </div>
              </div>

              {/* Metadata */}
              <div className="grid grid-cols-2 gap-4 text-sm text-desert-sand/80">
                <div>
                  <span className="text-vegas-gold">Type:</span>
                  <div className="capitalize">{item.type.replace('-', ' ')}</div>
                </div>
                <div>
                  <span className="text-vegas-gold">Access Count:</span>
                  <div>{item.accessCount}</div>
                </div>
                <div>
                  <span className="text-vegas-gold">Added:</span>
                  <div>{item.dateAdded.toLocaleDateString()}</div>
                </div>
                <div>
                  <span className="text-vegas-gold">Last Access:</span>
                  <div>{item.lastAccessed.toLocaleDateString()}</div>
                </div>
                {item.expiryDate && (
                  <div className="col-span-2">
                    <span className="text-vegas-gold">Expires:</span>
                    <div className={item.isExpired ? 'text-red-400' : ''}>
                      {item.expiryDate.toLocaleDateString()}
                    </div>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-2 mt-4 pt-4 border-t border-vegas-gold/20">
                <button className="flex-1 bg-vegas-gold/10 hover:bg-vegas-gold/20 border border-vegas-gold/30 text-vegas-gold font-medium py-2 px-4 rounded-lg transition-colors">
                  Copy
                </button>
                <button className="flex-1 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 text-blue-400 font-medium py-2 px-4 rounded-lg transition-colors">
                  Edit
                </button>
                <button className="bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 px-4 py-2 rounded-lg transition-colors">
                  <AlertTriangle className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Security Notice */}
        <div className="mt-12 bg-vegas-gold/10 border-2 border-vegas-gold/30 rounded-xl p-6 text-center">
          <Shield className="w-12 h-12 text-vegas-gold mx-auto mb-4" />
          <h3 className="text-2xl font-bold text-vegas-gold mb-2">Sovereign Security Promise</h3>
          <p className="text-desert-sand">
            All secrets are encrypted at rest and never leave your sovereign domain. 
            Vegas-level security for your most valuable assets.
          </p>
        </div>

        {/* Vegas Footer */}
        <div className="text-center mt-12 py-8 border-t-2 border-vegas-gold/20">
          <p className="text-vegas-gold text-lg font-semibold">
            🔐 What's in the vault, stays in the vault - Vegas rules apply 🔐
          </p>
        </div>
      </div>
    </div>
  )
}