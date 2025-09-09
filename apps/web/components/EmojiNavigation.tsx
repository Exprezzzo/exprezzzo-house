"use client";
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const rooms = [
  { name: 'Master', path: '/rooms/master', icon: '🏠', color: '#C5B358', bgColor: 'bg-vegas-gold' },
  { name: 'Chat', path: '/rooms/chat', icon: '💬', color: '#EDC9AF', bgColor: 'bg-desert-sand' },
  { name: 'Library', path: '/rooms/library', icon: '📚', color: '#A89F91', bgColor: 'bg-vegas-dust' },
  { name: 'Workspace', path: '/rooms/workspace', icon: '💼', color: '#F5F5DC', bgColor: 'bg-light-sand' },
  { name: 'Vault', path: '/rooms/vault', icon: '🔒', color: '#C72C41', bgColor: 'bg-rose-red' },
  { name: 'Network', path: '/rooms/network', icon: '🌐', color: '#C5B358', bgColor: 'bg-vegas-gold' },
  { name: 'Admin', path: '/rooms/admin', icon: '⚙️', color: '#381819', bgColor: 'bg-chocolate' }
];

export default function EmojiNavigation() {
  const pathname = usePathname();
  
  return (
    <nav className="bg-chocolate/95 backdrop-blur-sm border-b-4 border-vegas-gold shadow-2xl sticky top-0 z-50">
      <div className="container mx-auto px-6 py-4">
        <div className="flex justify-between items-center">
          {/* Logo */}
          <Link href="/" className="group flex items-center gap-3">
            <div className="text-4xl animate-pulse">🎰</div>
            <div>
              <h1 className="text-3xl font-bold text-vegas-gold group-hover:text-desert-sand transition-colors">
                EXPRE<span className="animate-shimmer">ZZZ</span>O
              </h1>
              <p className="text-xs text-desert-sand/80">Sovereign House v4.1</p>
            </div>
          </Link>
          
          {/* Room Navigation */}
          <div className="flex gap-2">
            {rooms.map(room => {
              const isActive = pathname === room.path;
              
              return (
                <Link 
                  key={room.path} 
                  href={room.path}
                  className={`group relative px-4 py-3 rounded-xl transition-all duration-300 hover:scale-105 ${
                    isActive 
                      ? 'bg-vegas-gold text-chocolate shadow-lg shadow-vegas-gold/30' 
                      : 'text-vegas-gold hover:bg-vegas-gold/20 hover:text-desert-sand'
                  }`}
                  style={{
                    borderColor: isActive ? room.color : 'transparent',
                    borderWidth: isActive ? '2px' : '1px',
                  }}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-lg group-hover:scale-110 transition-transform">
                      {room.icon}
                    </span>
                    <span className="font-medium hidden md:inline">
                      {room.name}
                    </span>
                  </div>
                  
                  {/* Active indicator */}
                  {isActive && (
                    <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-8 h-1 bg-vegas-gold rounded-full animate-pulse"></div>
                  )}
                  
                  {/* Hover glow effect */}
                  <div 
                    className={`absolute inset-0 rounded-xl opacity-0 group-hover:opacity-20 transition-opacity duration-300`}
                    style={{ backgroundColor: room.color }}
                  ></div>
                </Link>
              )
            })}
          </div>
          
          {/* Status Indicator */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm bg-chocolate/60 px-3 py-2 rounded-full border border-vegas-gold/30">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-vegas-gold font-medium">Sovereign</span>
            </div>
            <div className="text-xs text-desert-sand/80 hidden lg:block">
              <div>$0.0002/request</div>
              <div className="text-green-500">Vegas Ready</div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Bottom gradient effect */}
      <div className="h-1 bg-gradient-to-r from-transparent via-vegas-gold to-transparent opacity-60"></div>
    </nav>
  );
}