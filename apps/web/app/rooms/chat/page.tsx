'use client'
import { useState, useEffect, useRef } from 'react'
import { MessageSquare, Send, Zap, Crown, User, Bot } from 'lucide-react'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  cost: number
  model?: string
}

export default function ChatRoom() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const [selectedModel, setSelectedModel] = useState('llama3.2')
  const [totalCost, setTotalCost] = useState(0)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const models = [
    { id: 'llama3.2', name: 'Llama 3.2', cost: 0.001 },
    { id: 'mistral', name: 'Mistral', cost: 0.001 },
    { id: 'codellama:7b', name: 'CodeLlama 7B', cost: 0.001 },
  ]

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(scrollToBottom, [messages])

  const handleSend = async () => {
    if (!input.trim() || isStreaming) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date(),
      cost: 0.001,
      model: selectedModel
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsStreaming(true)
    setTotalCost(prev => prev + 0.001)

    try {
      const response = await fetch('/api/chat/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: input,
          model: selectedModel,
          degrade: true // Enable $0.001 degrade mode
        })
      })

      if (!response.ok) throw new Error('Chat request failed')

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: '',
        timestamp: new Date(),
        cost: 0.001,
        model: selectedModel
      }

      setMessages(prev => [...prev, assistantMessage])

      const reader = response.body?.getReader()
      if (!reader) throw new Error('No response stream')

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = new TextDecoder().decode(value)
        const lines = chunk.split('\n')

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6))
              if (data.content) {
                setMessages(prev => 
                  prev.map(msg => 
                    msg.id === assistantMessage.id 
                      ? { ...msg, content: msg.content + data.content }
                      : msg
                  )
                )
              }
            } catch (e) {
              // Skip invalid JSON
            }
          }
        }
      }

      setTotalCost(prev => prev + 0.001)
    } catch (error) {
      console.error('Chat error:', error)
      setMessages(prev => [...prev, {
        id: (Date.now() + 2).toString(),
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date(),
        cost: 0,
      }])
    } finally {
      setIsStreaming(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-chocolate via-vegas-dust to-chocolate">
      <div className="container mx-auto px-6 py-8 max-w-6xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-4 mb-4">
            <MessageSquare className="w-10 h-10 text-vegas-gold" />
            <h1 className="text-4xl font-bold text-vegas-gold">
              CHAT ROOM
            </h1>
          </div>
          <p className="text-xl text-desert-sand mb-4">
            Vegas-Style AI Chat - $0.001 per message
          </p>
          <div className="flex items-center justify-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-yellow-500" />
              <span className="text-vegas-gold">Total Cost: ${totalCost.toFixed(3)}</span>
            </div>
            <div className="flex items-center gap-2">
              <Crown className="w-4 h-4 text-vegas-gold" />
              <span className="text-desert-sand">Sovereign Mode</span>
            </div>
          </div>
        </div>

        {/* Model Selection */}
        <div className="bg-chocolate/60 backdrop-blur border-2 border-vegas-gold/20 rounded-xl p-4 mb-6">
          <div className="flex flex-wrap gap-3">
            <span className="text-vegas-gold font-medium">Model:</span>
            {models.map((model) => (
              <button
                key={model.id}
                onClick={() => setSelectedModel(model.id)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  selectedModel === model.id
                    ? 'bg-vegas-gold text-chocolate'
                    : 'bg-chocolate/40 text-desert-sand hover:bg-vegas-gold/20 hover:text-vegas-gold'
                }`}
              >
                {model.name} (${model.cost.toFixed(3)})
              </button>
            ))}
          </div>
        </div>

        {/* Chat Messages */}
        <div className="bg-chocolate/40 backdrop-blur border-2 border-vegas-gold/20 rounded-xl h-96 overflow-y-auto mb-6 p-4">
          {messages.length === 0 ? (
            <div className="flex items-center justify-center h-full text-vegas-gold/60">
              <div className="text-center">
                <MessageSquare className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p className="text-xl">Welcome to the Chat Room</p>
                <p className="text-sm text-desert-sand mt-2">
                  Start a conversation for just $0.001 per message
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-3 ${
                    message.role === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  <div
                    className={`max-w-2xl rounded-xl p-4 ${
                      message.role === 'user'
                        ? 'bg-vegas-gold/20 border border-vegas-gold/30 text-vegas-gold'
                        : 'bg-chocolate/60 border border-desert-sand/20 text-desert-sand'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      {message.role === 'user' ? (
                        <User className="w-4 h-4" />
                      ) : (
                        <Bot className="w-4 h-4" />
                      )}
                      <span className="font-medium">
                        {message.role === 'user' ? 'You' : message.model || 'AI'}
                      </span>
                      <span className="text-xs opacity-60">
                        {message.timestamp.toLocaleTimeString()}
                      </span>
                      <span className="text-xs bg-green-500/20 text-green-500 px-2 py-1 rounded">
                        ${message.cost.toFixed(3)}
                      </span>
                    </div>
                    <p className="whitespace-pre-wrap">{message.content}</p>
                  </div>
                </div>
              ))}
              {isStreaming && (
                <div className="flex justify-start">
                  <div className="bg-chocolate/60 border border-desert-sand/20 text-desert-sand rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Bot className="w-4 h-4" />
                      <span className="font-medium">{selectedModel}</span>
                      <div className="flex gap-1">
                        <div className="w-2 h-2 bg-vegas-gold rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-vegas-gold rounded-full animate-bounce delay-100"></div>
                        <div className="w-2 h-2 bg-vegas-gold rounded-full animate-bounce delay-200"></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="bg-chocolate/60 backdrop-blur border-2 border-vegas-gold/20 rounded-xl p-4">
          <div className="flex gap-3">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask me anything... (Shift+Enter for new line)"
              disabled={isStreaming}
              className="flex-1 bg-chocolate/40 border border-vegas-gold/30 rounded-lg p-3 text-desert-sand placeholder-desert-sand/60 resize-none focus:outline-none focus:border-vegas-gold/60"
              rows={3}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || isStreaming}
              className="bg-vegas-gold hover:bg-vegas-gold/80 disabled:bg-vegas-gold/30 text-chocolate font-medium px-6 py-3 rounded-lg transition-colors flex items-center gap-2"
            >
              <Send className="w-4 h-4" />
              Send
            </button>
          </div>
          <div className="flex justify-between items-center mt-3 text-sm text-desert-sand/80">
            <span>Press Enter to send, Shift+Enter for new line</span>
            <span className="text-vegas-gold">Cost per message: $0.001</span>
          </div>
        </div>

        {/* Vegas Footer */}
        <div className="text-center mt-8 py-6 border-t-2 border-vegas-gold/20">
          <p className="text-vegas-gold font-medium">
            🎲 Every message is a roll of the dice at $0.001 🎲
          </p>
        </div>
      </div>
    </div>
  )
}