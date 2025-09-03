import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Navigation from '@/components/Navigation'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'EXPREZZZO Sovereign House',
  description: 'Vegas-first, sovereign-always, $0.001/request immutable',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body className={inter.className}>
        <div className="min-h-screen flex flex-col">
          <header className="bg-chocolate/95 backdrop-blur-sm border-b-2 border-vegas-gold">
            <div className="container mx-auto px-4 py-4 flex justify-between items-center">
              <div className="flex flex-col">
                <h1 className="text-3xl font-bold text-vegas-gold">
                  EXPRE<span className="animate-shimmer">ZZZ</span>O
                </h1>
                <span className="text-desert-sand text-sm">Sovereign LLM House</span>
              </div>
              <div className="flex gap-4 items-center">
                <span className="text-green-500">● Sovereign</span>
                <span className="bg-vegas-gold text-chocolate px-3 py-1 rounded-full font-bold">
                  $0.001/req
                </span>
              </div>
            </div>
          </header>
          
          <Navigation />
          
          <main className="flex-grow container mx-auto px-4 py-8">
            {children}
          </main>
          
          <footer className="bg-chocolate/95 border-t-2 border-vegas-gold py-4">
            <div className="container mx-auto px-4 flex justify-between text-desert-sand">
              <span>© 2025 EXPREZZZO Sovereign House</span>
              <span>Escape Protocol: Ready</span>
              <span>Vegas First™</span>
            </div>
          </footer>
        </div>
      </body>
    </html>
  )
}