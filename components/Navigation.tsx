"use client"

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, MessageSquare, BookOpen, Briefcase, Lock, Network, Settings } from 'lucide-react'

const rooms = [
  { name: 'Master', href: '/', icon: Home },
  { name: 'Chat', href: '/chat', icon: MessageSquare },
  { name: 'Library', href: '/library', icon: BookOpen },
  { name: 'Workspace', href: '/workspace', icon: Briefcase },
  { name: 'Vault', href: '/vault', icon: Lock },
  { name: 'Network', href: '/network', icon: Network },
  { name: 'Admin', href: '/admin', icon: Settings },
]

export default function Navigation() {
  const pathname = usePathname()

  return (
    <nav className="bg-black/30 backdrop-blur-sm px-4 py-3 overflow-x-auto">
      <div className="flex gap-2">
        {rooms.map((room) => {
          const Icon = room.icon
          return (
            <Link
              key={room.name}
              href={room.href}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg border border-vegas-gold/30 
                         hover:bg-vegas-gold/20 transition-all whitespace-nowrap
                         ${pathname === room.href ? 'room-active' : 'text-desert-sand'}`}
            >
              <Icon size={18} />
              {room.name}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}