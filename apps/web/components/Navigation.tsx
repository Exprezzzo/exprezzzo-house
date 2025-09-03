'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, MessageSquare, Book, Briefcase, Shield, Network, Settings, Crown } from 'lucide-react'

const navigation = [
  { name: 'Master', href: '/', icon: Home },
  { name: 'Chat', href: '/chat', icon: MessageSquare },
  { name: 'Library', href: '/library', icon: Book },
  { name: 'Workspace', href: '/workspace', icon: Briefcase },
  { name: 'Vault', href: '/vault', icon: Shield },
  { name: 'Network', href: '/network', icon: Network },
  { name: 'Admin', href: '/admin', icon: Crown },
  { name: 'Settings', href: '/settings', icon: Settings },
]

export default function Navigation() {
  const pathname = usePathname()

  return (
    <nav className="bg-chocolate/50 border-b border-vegas-gold/20">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-8">
            <Link href="/" className="text-vegas-gold font-bold text-xl">
              🏠 EXPREZZZO
            </Link>
            
            <div className="flex space-x-1">
              {navigation.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href
                
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-vegas-gold/20 text-vegas-gold border border-vegas-gold/30'
                        : 'text-desert-sand hover:text-vegas-gold hover:bg-vegas-gold/10'
                    }`}
                  >
                    <Icon size={16} />
                    {item.name}
                  </Link>
                )
              })}
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-vegas-gold">Sovereign</span>
            </div>
          </div>
        </div>
      </div>
    </nav>
  )
}