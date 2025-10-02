"use client"

import { useState, useEffect } from 'react'
import { Search, Plus, Database } from 'lucide-react'
import { api } from '@/lib/api'

export default function LibraryRoom() {
  const [content, setContent] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [sessions, setSessions] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // Mock sessions data for now
    setSessions([
      { id: 1, updated_at: new Date().toISOString(), total_tokens: 1500, total_cost: '0.003' },
      { id: 2, updated_at: new Date(Date.now() - 86400000).toISOString(), total_tokens: 800, total_cost: '0.0016' }
    ])
  }, [])

  const addToLibrary = async () => {
    if (!content.trim()) return
    setLoading(true)

    try {
      const data = await api.embed({
        content,
        room: 'Library'
      })
      alert(`Added to library with ID: ${data.id}`)
      setContent('')
    } catch (error) {
      alert('Failed to add to library')
    } finally {
      setLoading(false)
    }
  }

  const searchLibrary = async () => {
    if (!searchQuery.trim()) return
    setLoading(true)

    try {
      const data = await api.search({
        query: searchQuery,
        limit: 10
      })
      setSearchResults(data.results || [])
    } catch (error) {
      alert('Search failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-vegas-gold">Library - Knowledge Base</h2>
        <div className="flex items-center gap-2 text-desert-sand">
          <Database size={18} />
          <span>pgvector HNSW Active</span>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card-sovereign">
          <h3 className="text-xl font-semibold mb-4 text-vegas-gold flex items-center gap-2">
            <Plus size={20} />
            Add to Library
          </h3>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Enter content to store with embeddings..."
            className="w-full h-32 px-4 py-2 bg-chocolate/50 border border-vegas-gold/30 
                     rounded-lg text-light-sand placeholder-dust"
          />
          <button 
            onClick={addToLibrary} 
            disabled={loading}
            className="btn-vegas mt-2 w-full"
          >
            Generate Embedding & Store
          </button>
        </div>

        <div className="card-sovereign">
          <h3 className="text-xl font-semibold mb-4 text-vegas-gold flex items-center gap-2">
            <Search size={20} />
            Semantic Search
          </h3>
          <div className="flex gap-2">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && searchLibrary()}
              placeholder="Search query..."
              className="flex-grow px-4 py-2 bg-chocolate/50 border border-vegas-gold/30 
                       rounded-lg text-light-sand placeholder-dust"
            />
            <button 
              onClick={searchLibrary}
              disabled={loading}
              className="btn-vegas"
            >
              Search
            </button>
          </div>
          
          {searchResults.length > 0 && (
            <div className="mt-4 space-y-2 max-h-64 overflow-y-auto">
              {searchResults.map((result) => (
                <div key={result.id} className="p-3 bg-chocolate/30 rounded-lg">
                  <div className="text-sm text-vegas-gold mb-1">
                    Distance: {result.distance?.toFixed(4)}
                  </div>
                  <div className="text-light-sand text-sm">{result.content}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="card-sovereign">
        <h3 className="text-xl font-semibold mb-4 text-vegas-gold">Recent Sessions</h3>
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {sessions.map((session) => (
            <div key={session.id} className="p-3 bg-chocolate/30 rounded-lg">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-vegas-gold">
                  {new Date(session.updated_at).toLocaleString()}
                </span>
                <div className="flex gap-2 text-xs">
                  <span className="bg-vegas-gold/30 px-2 py-1 rounded">
                    {session.total_tokens || 0} tokens
                  </span>
                  <span className="bg-dust/30 px-2 py-1 rounded">
                    ${parseFloat(session.total_cost || 0).toFixed(6)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}