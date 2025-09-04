'use client'
import { useState } from 'react'
import Link from 'next/link'
import { Settings, Eye, Code } from 'lucide-react'

// Import all navigation components
import Navigation from '@/components/Navigation'
import EmojiNavigation from '@/components/EmojiNavigation'
import CompactNavigation from '@/components/CompactNavigation'

export default function NavigationDemos() {
  const [currentNav, setCurrentNav] = useState<'original' | 'emoji' | 'compact'>('original')

  const navComponents = {
    original: <Navigation />,
    emoji: <EmojiNavigation />,
    compact: <CompactNavigation />
  }

  const navDescriptions = {
    original: {
      title: 'Original EXPREZZZO Navigation',
      description: 'Full-featured navigation with Lucide React icons and Vegas theming',
      features: ['Lucide React icons', 'Backdrop blur effects', 'Sovereignty indicator', 'Responsive design'],
      pros: ['Professional look', 'Consistent iconography', 'Full feature set'],
      cons: ['More complex', 'Larger bundle size']
    },
    emoji: {
      title: 'Enhanced Emoji Navigation',
      description: 'Your emoji approach enhanced with Vegas luxury styling',
      features: ['Emoji icons', 'Individual room colors', 'Hover animations', 'Gradient effects'],
      pros: ['Visual appeal', 'Unique personality', 'Great animations'],
      cons: ['Emoji inconsistency across devices', 'More visual weight']
    },
    compact: {
      title: 'Compact Navigation (Your Style)',
      description: 'Clean, compact version based on your original design',
      features: ['Simple emoji icons', 'Mobile-first design', 'Lightweight', 'Fast loading'],
      pros: ['Clean and simple', 'Mobile-friendly', 'Fast performance'],
      cons: ['Less visual flair', 'Simpler aesthetics']
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-chocolate via-vegas-dust to-chocolate">
      {/* Demo Navigation */}
      <div className="relative">
        {navComponents[currentNav]}
      </div>

      {/* Demo Content */}
      <div className="container mx-auto px-6 py-8">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-4 mb-4">
            <Settings className="w-12 h-12 text-vegas-gold" />
            <h1 className="text-5xl font-bold text-vegas-gold">NAVIGATION DEMOS</h1>
          </div>
          <p className="text-xl text-desert-sand">
            Choose your preferred navigation style for the EXPREZZZO Sovereign House
          </p>
        </div>

        {/* Navigation Selector */}
        <div className="bg-chocolate/60 backdrop-blur border-2 border-vegas-gold/20 rounded-xl p-6 mb-8">
          <h2 className="text-2xl font-bold text-vegas-gold mb-4 text-center">
            Switch Navigation Style
          </h2>
          <div className="flex justify-center gap-4">
            {Object.entries(navDescriptions).map(([key, nav]) => (
              <button
                key={key}
                onClick={() => setCurrentNav(key as typeof currentNav)}
                className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                  currentNav === key
                    ? 'bg-vegas-gold text-chocolate'
                    : 'bg-chocolate/40 text-vegas-gold hover:bg-vegas-gold/20'
                }`}
              >
                {nav.title.split(' ')[0]}
              </button>
            ))}
          </div>
        </div>

        {/* Current Navigation Info */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <div className="bg-chocolate/60 backdrop-blur border-2 border-vegas-gold/20 rounded-xl p-8">
            <div className="flex items-center gap-3 mb-6">
              <Eye className="w-8 h-8 text-vegas-gold" />
              <h2 className="text-2xl font-bold text-vegas-gold">
                {navDescriptions[currentNav].title}
              </h2>
            </div>
            
            <p className="text-desert-sand mb-6">
              {navDescriptions[currentNav].description}
            </p>

            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-vegas-gold mb-2">Features:</h3>
                <ul className="space-y-1">
                  {navDescriptions[currentNav].features.map((feature, index) => (
                    <li key={index} className="text-desert-sand text-sm flex items-center gap-2">
                      <span className="text-green-500">✓</span>
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          <div className="bg-chocolate/60 backdrop-blur border-2 border-vegas-gold/20 rounded-xl p-8">
            <div className="flex items-center gap-3 mb-6">
              <Code className="w-8 h-8 text-vegas-gold" />
              <h2 className="text-2xl font-bold text-vegas-gold">Pros & Cons</h2>
            </div>

            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-green-500 mb-3">Advantages:</h3>
                <ul className="space-y-2">
                  {navDescriptions[currentNav].pros.map((pro, index) => (
                    <li key={index} className="text-desert-sand text-sm flex items-center gap-2">
                      <span className="text-green-500">+</span>
                      {pro}
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-yellow-500 mb-3">Considerations:</h3>
                <ul className="space-y-2">
                  {navDescriptions[currentNav].cons.map((con, index) => (
                    <li key={index} className="text-desert-sand text-sm flex items-center gap-2">
                      <span className="text-yellow-500">•</span>
                      {con}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Implementation Guide */}
        <div className="bg-chocolate/60 backdrop-blur border-2 border-vegas-gold/20 rounded-xl p-8">
          <h2 className="text-2xl font-bold text-vegas-gold mb-6 text-center">
            How to Use Your Preferred Navigation
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-chocolate/40 rounded-xl p-6">
              <h3 className="text-lg font-bold text-vegas-gold mb-3">Option 1: Replace Current</h3>
              <div className="text-sm text-desert-sand space-y-2">
                <p>Replace the existing Navigation component:</p>
                <code className="block bg-chocolate/60 p-2 rounded text-xs text-vegas-gold">
                  cp components/{currentNav === 'emoji' ? 'EmojiNavigation' : 'CompactNavigation'}.tsx components/Navigation.tsx
                </code>
              </div>
            </div>

            <div className="bg-chocolate/40 rounded-xl p-6">
              <h3 className="text-lg font-bold text-vegas-gold mb-3">Option 2: Update Layout</h3>
              <div className="text-sm text-desert-sand space-y-2">
                <p>Import your preferred nav in layout.tsx:</p>
                <code className="block bg-chocolate/60 p-2 rounded text-xs text-vegas-gold">
                  import {currentNav === 'emoji' ? 'EmojiNavigation' : 'CompactNavigation'} from '@/components/{currentNav === 'emoji' ? 'EmojiNavigation' : 'CompactNavigation'}'
                </code>
              </div>
            </div>

            <div className="bg-chocolate/40 rounded-xl p-6">
              <h3 className="text-lg font-bold text-vegas-gold mb-3">Option 3: Theme Toggle</h3>
              <div className="text-sm text-desert-sand space-y-2">
                <p>Add a theme switcher to toggle between styles:</p>
                <code className="block bg-chocolate/60 p-2 rounded text-xs text-vegas-gold">
                  useNavigationTheme()
                </code>
              </div>
            </div>
          </div>
        </div>

        {/* Demo Links */}
        <div className="text-center mt-12 py-8 border-t-2 border-vegas-gold/20">
          <p className="text-vegas-gold text-lg font-semibold mb-6">
            🎰 Test Navigation with Different Pages 🎰
          </p>
          <div className="flex justify-center gap-4 flex-wrap">
            <Link 
              href="/rooms/master" 
              className="bg-vegas-gold/10 hover:bg-vegas-gold/20 border border-vegas-gold/30 text-vegas-gold font-medium py-2 px-4 rounded-lg transition-colors"
            >
              Master Room
            </Link>
            <Link 
              href="/rooms/chat" 
              className="bg-vegas-gold/10 hover:bg-vegas-gold/20 border border-vegas-gold/30 text-vegas-gold font-medium py-2 px-4 rounded-lg transition-colors"
            >
              Chat Room
            </Link>
            <Link 
              href="/rooms/vault" 
              className="bg-vegas-gold/10 hover:bg-vegas-gold/20 border border-vegas-gold/30 text-vegas-gold font-medium py-2 px-4 rounded-lg transition-colors"
            >
              Vault Room
            </Link>
            <Link 
              href="/chat-demos" 
              className="bg-vegas-gold/10 hover:bg-vegas-gold/20 border border-vegas-gold/30 text-vegas-gold font-medium py-2 px-4 rounded-lg transition-colors"
            >
              Chat Demos
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}