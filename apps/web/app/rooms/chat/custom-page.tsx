"use client";
import { useState } from 'react';

export default function CustomChatRoom() {
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [totalCost, setTotalCost] = useState(0);
  const [degraded, setDegraded] = useState(true); // Always degraded in sovereign mode

  const sendMessage = async () => {
    if (!input.trim() || streaming) return;
    
    const userMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date(),
      cost: 0.001
    };

    setMessages(prev => [...prev, userMessage]);
    const userInput = input;
    setInput('');
    setStreaming(true);
    setTotalCost(prev => prev + 0.001);

    try {
      const response = await fetch('/api/chat/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userInput,
          model: 'llama3.2',
          degrade: true // Enable $0.001 degrade mode
        })
      });

      if (!response.ok) throw new Error('Chat request failed');

      const assistantMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: '',
        timestamp: new Date(),
        cost: 0.001
      };

      setMessages(prev => [...prev, assistantMessage]);

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response stream');

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = new TextDecoder().decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.content) {
                setMessages(prev => 
                  prev.map(msg => 
                    msg.id === assistantMessage.id 
                      ? { ...msg, content: msg.content + data.content }
                      : msg
                  )
                );
              }
              if (data.done) {
                setTotalCost(prev => prev + 0.001);
              }
            } catch (e) {
              // Skip invalid JSON
            }
          }
        }
      }
    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => [...prev, {
        id: (Date.now() + 2).toString(),
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date(),
        cost: 0,
      }]);
    } finally {
      setStreaming(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#381819] text-[#C5B358] p-8">
      <h1 className="text-5xl font-bold mb-4">💬 Custom Chat Room</h1>
      
      {degraded && (
        <div className="bg-[#C72C41] text-white p-2 mb-4 rounded">
          🎰 SOVEREIGN MODE: All requests processed at $0.001 - Vegas-style efficiency!
        </div>
      )}
      
      <div className="border-2 border-[#C5B358] rounded-lg p-6 h-[60vh] overflow-y-auto mb-4">
        {messages.length === 0 ? (
          <div className="text-center text-[#A89F91] mt-20">
            <div className="text-4xl mb-4">🎲</div>
            <p>Welcome to the Sovereign Chat Room</p>
            <p className="text-sm mt-2">Every message costs exactly $0.001</p>
          </div>
        ) : (
          messages.map((msg, i) => (
            <div key={i} className={`mb-4 ${msg.role === 'user' ? 'text-[#EDC9AF]' : 'text-[#F5F5DC]'}`}>
              <div className="flex items-center gap-2 mb-1">
                <strong className="capitalize">{msg.role}:</strong>
                <span className="text-xs bg-green-500/20 text-green-500 px-2 py-1 rounded">
                  ${msg.cost?.toFixed(3) || '0.001'}
                </span>
                <span className="text-xs text-[#A89F91]">
                  {msg.timestamp?.toLocaleTimeString()}
                </span>
              </div>
              <div className="whitespace-pre-wrap pl-4 border-l-2 border-[#C5B358]/30">
                {msg.content}
              </div>
            </div>
          ))
        )}
        
        {streaming && (
          <div className="text-[#A89F91] flex items-center gap-2">
            <div className="flex gap-1">
              <div className="w-2 h-2 bg-[#C5B358] rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-[#C5B358] rounded-full animate-bounce delay-100"></div>
              <div className="w-2 h-2 bg-[#C5B358] rounded-full animate-bounce delay-200"></div>
            </div>
            AI is thinking (Vegas-style)...
          </div>
        )}
      </div>
      
      <div className="flex gap-4">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
          disabled={streaming}
          className="flex-1 bg-[#1a1a1a] border-2 border-[#C5B358] text-[#C5B358] p-3 rounded focus:border-[#EDC9AF] focus:outline-none disabled:opacity-50"
          placeholder="Type your message... (Press Enter to send)"
        />
        <button 
          onClick={sendMessage}
          disabled={streaming || !input.trim()}
          className="bg-[#C5B358] text-[#381819] px-6 py-3 rounded font-bold hover:bg-[#EDC9AF] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {streaming ? 'Sending...' : 'Send'}
        </button>
      </div>
      
      <div className="mt-4 flex justify-between items-center text-sm">
        <div className="text-[#A89F91]">
          Session Cost: <span className="text-[#C5B358] font-mono">${totalCost.toFixed(3)}</span> | 
          Target: <span className="text-green-500">$0.001/message</span>
        </div>
        <div className="text-[#A89F91]">
          Messages: {messages.length} | 
          Mode: <span className="text-[#C5B358]">Sovereign</span>
        </div>
      </div>
      
      <div className="mt-6 text-center text-[#A89F91] text-xs">
        🎰 What happens in Vegas stays in your sovereign house! 🎰
      </div>
    </div>
  );
}