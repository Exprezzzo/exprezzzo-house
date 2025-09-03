"use client"

import { useState } from 'react'
import { Send, Zap, DollarSign } from 'lucide-react'
import { api } from '@/lib/api'

export default function ChatRoom() {
  const [messages, setMessages] = useState<Array<{role: string, content: string, cost?: string, tokens?: number}>>([])
  const [input, setInput] = useState('')
  const [model, setModel] = useState('llama3.2')
  const [loading, setLoading] = useState(false)
  const [sessionId] = useState(() => crypto.randomUUID())

  const sendMessage = async () => {
    if (!input.trim() || loading) return

    const userMessage = input
    setInput('')
    setMessages(prev => [...prev, { role: 'user', content: userMessage }])
    setLoading(true)

    try {
      const data = await api.chat({
        message: userMessage,
        room: 'Chat',
        model,
        sessionId
      })
      
      if (data.error) {
        setMessages(prev => [...prev, { 
          role: 'system', 
          content: `Error: ${data.error}`
        }])
      } else {
        setMessages(prev => [...prev, { 
          role: 'assistant', 
          content: data.response,
          cost: data.cost,
          tokens: data.tokens
        }])
      }
    } catch (error) {
      setMessages(prev => [...prev, { 
        role: 'system', 
        content: 'Error: ' + (error as Error).message 
      }])
    } finally {
      setLoading(false)
    }
  }

  const totalCost = messages.reduce((sum, msg) => 
    sum + (msg.cost ? parseFloat(msg.cost) : 0), 0
  )

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-vegas-gold">Chat Room</h2>
        <div className="flex gap-4">
          <div className="flex items-center gap-2 text-desert-sand">
            <Zap size={18} />
            <span>Sovereign Lane Active</span>
          </div>
          <div className="flex items-center gap-2 text-vegas-gold">
            <DollarSign size={18} />
            <span>Session: ${totalCost.toFixed(6)}</span>
          </div>
        </div>
      </div>
      
      <div className="card-sovereign h-[500px] flex flex-col">
        <div className="flex-grow overflow-y-auto space-y-4 mb-4">
          {messages.map((msg, idx) => (
            <div key={idx} className={`p-3 rounded-lg ${
              msg.role === 'user' ? 'bg-vegas-gold/20 ml-auto max-w-[70%]' : 
              msg.role === 'assistant' ? 'bg-chocolate/30 mr-auto max-w-[70%]' :
              'bg-rose-red/20 text-center'
            }`}>
              <div className="flex justify-between items-center mb-1">
                <span className="font-semibold text-vegas-gold">{msg.role}</span>
                {msg.cost && (
                  <div className="flex gap-2 text-xs">
                    <span className="bg-vegas-gold/30 px-2 py-1 rounded">
                      ${msg.cost}
                    </span>
                    {msg.tokens && (
                      <span className="bg-dust/30 px-2 py-1 rounded">
                        {msg.tokens} tokens
                      </span>
                    )}
                  </div>
                )}
              </div>
              <div className="text-light-sand">{msg.content}</div>
            </div>
          ))}
          {loading && (
            <div className="text-center text-dust animate-pulse">Processing sovereign request...</div>
          )}
        </div>
        
        <div className="flex gap-2">
          <select 
            value={model}
            onChange={(e) => setModel(e.target.value)}
            className="px-3 py-2 bg-chocolate/50 border border-vegas-gold/30 rounded-lg text-light-sand"
          >
            <option value="llama3.2">Llama 3.2 (Sovereign)</option>
            <option value="mistral">Mistral (Sovereign)</option>
            <option value="codellama:7b">CodeLlama (Sovereign)</option>
          </select>
          
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
            placeholder="Enter message..."
            className="flex-grow px-4 py-2 bg-chocolate/50 border border-vegas-gold/30 
                     rounded-lg text-light-sand placeholder-dust"
          />
          
          <button
            onClick={sendMessage}
            disabled={loading}
            className="btn-vegas flex items-center gap-2"
          >
            <Send size={18} />
            Send
          </button>
        </div>
      </div>
    </div>
  )
}