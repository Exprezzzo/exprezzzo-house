"use client";
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const rooms = [
  { name: 'Master', path: '/rooms/master', icon: '🏠', color: '#C5B358' },
  { name: 'Chat', path: '/rooms/chat', icon: '💬', color: '#EDC9AF' },
  { name: 'Library', path: '/rooms/library', icon: '📚', color: '#A89F91' },
  { name: 'Workspace', path: '/rooms/workspace', icon: '💼', color: '#F5F5DC' },
  { name: 'Vault', path: '/rooms/vault', icon: '🔒', color: '#C72C41' },
  { name: 'Network', path: '/rooms/network', icon: '🌐', color: '#C5B358' },
  { name: 'Admin', path: '/rooms/admin', icon: '⚙️', color: '#381819' }
];

export default function CompactNavigation() {
  const pathname = usePathname();
  
  return (
    <nav className="bg-[#381819] border-b-4 border-[#C5B358] p-4 sticky top-0 z-50">
      <div className="container mx-auto flex justify-between items-center">
        <Link href="/" className="text-3xl font-bold text-[#C5B358] hover:text-[#EDC9AF] transition-colors">
          🎰 EXPREZZZO
        </Link>
        <div className="flex gap-2 md:gap-4">
          {rooms.map(room => (
            <Link 
              key={room.path} 
              href={room.path}
              className={`px-2 py-2 md:px-4 md:py-2 rounded-lg transition-all hover:scale-105 ${
                pathname === room.path 
                  ? 'bg-[#C5B358] text-[#381819] shadow-lg' 
                  : 'text-[#C5B358] hover:bg-[#381819] hover:text-[#EDC9AF]'
              }`}
              title={room.name}
            >
              <span className="flex items-center gap-1 md:gap-2">
                <span className="text-lg">{room.icon}</span>
                <span className="hidden sm:inline text-sm font-medium">{room.name}</span>
              </span>
            </Link>
          ))}
        </div>
        
        {/* Status Badge */}
        <div className="hidden md:flex items-center gap-2 bg-green-500/20 text-green-500 px-3 py-1 rounded-full text-xs">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span>$0.0002/req</span>
        </div>
      </div>
    </nav>
  );
}