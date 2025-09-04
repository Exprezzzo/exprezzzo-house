import './globals.css'
import { Inter } from 'next/font/google'
import CompactNavigation from '@/components/CompactNavigation'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'EXPREZZZO House - Sovereign AI at $0.001',
  description: 'The Rose Blooms in the Desert 🌹 - Vegas-first, sovereign-always',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-[#381819] text-[#C5B358] min-h-screen`}>
        <CompactNavigation />
        <main className="min-h-[calc(100vh-80px)]">
          {children}
        </main>
        
        {/* Vegas Footer */}
        <footer className="bg-[#381819] border-t-2 border-[#C5B358] py-4 text-center">
          <div className="container mx-auto px-4">
            <div className="flex justify-center items-center gap-6 text-sm text-[#EDC9AF]">
              <span>© 2025 EXPREZZZO Sovereign House</span>
              <span className="text-green-500">● $0.001/req</span>
              <span>🌹 The Rose Blooms in Vegas 🌹</span>
            </div>
          </div>
        </footer>
      </body>
    </html>
  )
}