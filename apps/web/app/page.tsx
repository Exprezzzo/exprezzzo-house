'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Crown, Zap } from 'lucide-react'

export default function Home() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to master room after 2 seconds
    const timer = setTimeout(() => {
      router.push('/rooms/master')
    }, 2000)

    return () => clearTimeout(timer)
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-chocolate via-vegas-dust to-chocolate">
      <div className="text-center space-y-8 p-12">
        <div className="flex items-center justify-center gap-4 mb-8">
          <Crown className="w-20 h-20 text-vegas-gold animate-pulse" />
          <div>
            <h1 className="text-8xl font-bold text-vegas-gold mb-4">
              EXPRE<span className="animate-shimmer">ZZZ</span>O
            </h1>
            <p className="text-2xl text-desert-sand">Sovereign House</p>
          </div>
        </div>
        
        <div className="space-y-4 text-lg text-desert-sand">
          <p className="flex items-center justify-center gap-2">
            <Zap className="w-5 h-5 text-vegas-gold" />
            Vegas-First Architecture
          </p>
          <p className="text-vegas-gold font-bold">$0.0002 per request</p>
          <p className="text-sm">Sovereign • Always • Immutable</p>
        </div>

        <div className="mt-12 space-y-2">
          <div className="flex justify-center gap-2 mb-4">
            <div className="w-3 h-3 bg-vegas-gold rounded-full animate-bounce"></div>
            <div className="w-3 h-3 bg-vegas-gold rounded-full animate-bounce delay-100"></div>
            <div className="w-3 h-3 bg-vegas-gold rounded-full animate-bounce delay-200"></div>
          </div>
          <p className="text-vegas-gold">Entering the House...</p>
        </div>

        <div className="mt-16 text-sm text-desert-sand/60">
          <p>🎰 Welcome to the most sovereign AI house in Vegas 🎰</p>
        </div>
      </div>
    </div>
  )
}