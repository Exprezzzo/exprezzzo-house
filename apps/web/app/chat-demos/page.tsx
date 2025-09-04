'use client'
import Link from 'next/link'
import { MessageSquare, Zap, Crown } from 'lucide-react'

export default function ChatDemos() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-chocolate via-vegas-dust to-chocolate">
      <div className="container mx-auto px-6 py-8">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-4 mb-4">
            <MessageSquare className="w-12 h-12 text-vegas-gold" />
            <h1 className="text-5xl font-bold text-vegas-gold">CHAT DEMOS</h1>
          </div>
          <p className="text-xl text-desert-sand">
            Choose your preferred chat interface
          </p>
          <p className="text-sm text-vegas-gold mt-2">
            All powered by sovereign AI at $0.001 per request
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {/* Original EXPREZZZO Chat Room */}
          <div className="bg-chocolate/60 backdrop-blur border-2 border-vegas-gold/20 rounded-xl p-8 hover:border-vegas-gold/40 transition-colors">
            <div className="text-center mb-6">
              <Crown className="w-16 h-16 text-vegas-gold mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-vegas-gold mb-2">Original Chat</h2>
              <p className="text-desert-sand text-sm">
                Full-featured EXPREZZZO chat room with Vegas theming
              </p>
            </div>
            
            <div className="space-y-3 mb-6 text-sm">
              <div className="flex justify-between">
                <span className="text-vegas-gold">Method:</span>
                <span className="text-desert-sand">POST + Stream</span>
              </div>
              <div className="flex justify-between">
                <span className="text-vegas-gold">Features:</span>
                <span className="text-desert-sand">Full UI</span>
              </div>
              <div className="flex justify-between">
                <span className="text-vegas-gold">Cost:</span>
                <span className="text-green-500">$0.001</span>
              </div>
            </div>
            
            <Link 
              href="/rooms/chat" 
              className="block w-full bg-vegas-gold hover:bg-vegas-gold/80 text-chocolate font-bold py-3 px-6 rounded-lg transition-colors text-center"
            >
              Enter Original Chat
            </Link>
          </div>

          {/* SSE Chat Implementation */}
          <div className="bg-chocolate/60 backdrop-blur border-2 border-vegas-gold/20 rounded-xl p-8 hover:border-vegas-gold/40 transition-colors">
            <div className="text-center mb-6">
              <Zap className="w-16 h-16 text-vegas-gold mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-vegas-gold mb-2">SSE Chat</h2>
              <p className="text-desert-sand text-sm">
                Server-Sent Events streaming chat interface
              </p>
            </div>
            
            <div className="space-y-3 mb-6 text-sm">
              <div className="flex justify-between">
                <span className="text-vegas-gold">Method:</span>
                <span className="text-desert-sand">SSE Stream</span>
              </div>
              <div className="flex justify-between">
                <span className="text-vegas-gold">Features:</span>
                <span className="text-desert-sand">Real-time</span>
              </div>
              <div className="flex justify-between">
                <span className="text-vegas-gold">Cost:</span>
                <span className="text-green-500">$0.001</span>
              </div>
            </div>
            
            <div className="space-y-2">
              <Link 
                href="/rooms/chat/sse-page" 
                className="block w-full bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 text-blue-400 font-bold py-3 px-6 rounded-lg transition-colors text-center"
              >
                Try SSE Chat
              </Link>
              <p className="text-xs text-vegas-gold/60 text-center">
                Uses your preferred EventSource API
              </p>
            </div>
          </div>

          {/* Custom Implementation */}
          <div className="bg-chocolate/60 backdrop-blur border-2 border-vegas-gold/20 rounded-xl p-8 hover:border-vegas-gold/40 transition-colors">
            <div className="text-center mb-6">
              <MessageSquare className="w-16 h-16 text-vegas-gold mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-vegas-gold mb-2">Custom Chat</h2>
              <p className="text-desert-sand text-sm">
                Adapted version of your original implementation
              </p>
            </div>
            
            <div className="space-y-3 mb-6 text-sm">
              <div className="flex justify-between">
                <span className="text-vegas-gold">Method:</span>
                <span className="text-desert-sand">POST + Fetch</span>
              </div>
              <div className="flex justify-between">
                <span className="text-vegas-gold">Features:</span>
                <span className="text-desert-sand">Custom UI</span>
              </div>
              <div className="flex justify-between">
                <span className="text-vegas-gold">Cost:</span>
                <span className="text-green-500">$0.001</span>
              </div>
            </div>
            
            <Link 
              href="/rooms/chat/custom-page" 
              className="block w-full bg-green-500/20 hover:bg-green-500/30 border border-green-500/30 text-green-400 font-bold py-3 px-6 rounded-lg transition-colors text-center"
            >
              Try Custom Chat
            </Link>
          </div>
        </div>

        <div className="text-center mt-12 py-8 border-t-2 border-vegas-gold/20">
          <p className="text-vegas-gold text-lg font-semibold mb-4">
            🎰 All Chat Interfaces Guarantee $0.001 per Request 🎰
          </p>
          <div className="flex justify-center gap-8 text-sm text-desert-sand">
            <span>✓ Sovereign AI Models</span>
            <span>✓ Local Processing</span>
            <span>✓ Vegas-Style Efficiency</span>
            <span>✓ No Vendor Lock-in</span>
          </div>
        </div>
      </div>
    </div>
  )
}