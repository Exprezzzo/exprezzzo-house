"use client";
import { useState } from 'react';

export default function SSEChatRoom() {
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [totalCost, setTotalCost] = useState(0);
  const [degraded, setDegraded] = useState(false);

  const sendMessage = async () => {
    if (!input.trim() || streaming) return;
    
    setStreaming(true);
    setMessages(prev => [...prev, { role: 'user', content: input, cost: 0.001, timestamp: new Date() }]);
    const userInput = input;
    setInput('');
    setTotalCost(prev => prev + 0.001);
    
    let aiResponse = '';
    // Use the new SSE endpoint
    const eventSource = new EventSource(`/api/chat/sse?prompt=${encodeURIComponent(userInput)}&model=llama3.2`);
    
    // Add initial AI message placeholder
    const aiMessageIndex = messages.length + 1;
    setMessages(prev => [...prev, { role: 'assistant', content: '', cost: 0.001, timestamp: new Date() }]);
    
    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        if (data.text) {
          aiResponse += data.text;
          setMessages(prev => {
            const newMessages = [...prev];
            if (newMessages[aiMessageIndex]?.role === 'assistant') {
              newMessages[aiMessageIndex].content = aiResponse;
            }
            return newMessages;
          });
        }
        
        if (data.cost && !degraded) {
          setTotalCost(prev => prev + data.cost);
        }
        
        if (data.degraded) {
          setDegraded(true);
        }
        
        if (data.done) {
          eventSource.close();
          setStreaming(false);
          setTotalCost(prev => prev + 0.001); // Add AI response cost
        }
      } catch (e) {
        console.error('Error parsing SSE data:', e);
      }
    };
    
    eventSource.onerror = (error) => {
      console.error('SSE connection error:', error);
      eventSource.close();
      setStreaming(false);
      // Add error message
      setMessages(prev => {
        const newMessages = [...prev];
        if (newMessages[aiMessageIndex]?.role === 'assistant' && !newMessages[aiMessageIndex].content) {
          newMessages[aiMessageIndex].content = 'Sorry, I encountered a connection error. Please try again.';
        }
        return newMessages;
      });
    };
    
    eventSource.onopen = () => {
      console.log('SSE connection opened');
    };
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="min-h-screen bg-[#381819] text-[#C5B358] p-8">
      <h1 className="text-5xl font-bold mb-4">💬 SSE Chat Room</h1>
      
      {degraded && (
        <div className="bg-[#C72C41] text-white p-2 mb-4 rounded flex items-center gap-2">
          <span>🎰</span>
          <span>SOVEREIGN MODE: All requests processed at $0.001 - Vegas guarantees!</span>
        </div>
      )}
      
      <div className="border-2 border-[#C5B358] rounded-lg p-6 h-[60vh] overflow-y-auto mb-4 bg-[#2a1415]">
        {messages.length === 0 ? (
          <div className="text-center text-[#A89F91] mt-20">
            <div className="text-4xl mb-4">🎲</div>
            <p className="text-xl mb-2">Welcome to the SSE Chat Room</p>
            <p className="text-sm">Real-time streaming at $0.001 per message</p>
            <p className="text-xs mt-2 text-[#C5B358]">Powered by Server-Sent Events</p>
          </div>
        ) : (
          messages.map((msg, i) => (
            <div key={i} className={`mb-6 ${msg.role === 'user' ? 'text-[#EDC9AF]' : 'text-[#F5F5DC]'}`}>
              <div className="flex items-center gap-3 mb-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                  msg.role === 'user' 
                    ? 'bg-[#C5B358] text-[#381819]' 
                    : 'bg-[#381819] border-2 border-[#C5B358] text-[#C5B358]'
                }`}>
                  {msg.role === 'user' ? 'U' : 'AI'}
                </div>
                <strong className="capitalize text-[#C5B358]">{msg.role}</strong>
                <span className="text-xs bg-green-500/20 text-green-500 px-2 py-1 rounded">
                  ${(msg.cost || 0.001).toFixed(3)}
                </span>
                <span className="text-xs text-[#A89F91]">
                  {msg.timestamp?.toLocaleTimeString()}
                </span>
              </div>
              <div className="whitespace-pre-wrap pl-11 text-[#F5F5DC] leading-relaxed">
                {msg.content}
                {streaming && msg.role === 'assistant' && i === messages.length - 1 && (
                  <span className="inline-block w-2 h-5 bg-[#C5B358] ml-1 animate-pulse"></span>
                )}
              </div>
            </div>
          ))
        )}
        
        {streaming && messages.length > 0 && (
          <div className="text-[#A89F91] text-sm mt-4 flex items-center gap-2">
            <div className="flex gap-1">
              <div className="w-2 h-2 bg-[#C5B358] rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-[#C5B358] rounded-full animate-bounce delay-100"></div>
              <div className="w-2 h-2 bg-[#C5B358] rounded-full animate-bounce delay-200"></div>
            </div>
            Streaming response from sovereign AI...
          </div>
        )}
      </div>
      
      <div className="flex gap-4">
        <div className="flex-1">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={streaming}
            rows={3}
            className="w-full bg-[#1a1a1a] border-2 border-[#C5B358] text-[#C5B358] p-3 rounded focus:border-[#EDC9AF] focus:outline-none disabled:opacity-50 resize-none"
            placeholder="Type your message... (Enter to send, Shift+Enter for new line)"
          />
        </div>
        <button 
          onClick={sendMessage}
          disabled={streaming || !input.trim()}
          className="bg-[#C5B358] text-[#381819] px-8 py-3 rounded font-bold hover:bg-[#EDC9AF] disabled:opacity-50 disabled:cursor-not-allowed transition-colors h-fit"
        >
          {streaming ? (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-[#381819] border-t-transparent rounded-full animate-spin"></div>
              Sending
            </div>
          ) : (
            'Send'
          )}
        </button>
      </div>
      
      <div className="mt-4 flex justify-between items-center text-sm border-t border-[#C5B358]/30 pt-4">
        <div className="text-[#A89F91] space-x-4">
          <span>Session Cost: <span className="text-[#C5B358] font-mono font-bold">${totalCost.toFixed(3)}</span></span>
          <span>Target: <span className="text-green-500">$0.001/msg</span></span>
        </div>
        <div className="text-[#A89F91] space-x-4">
          <span>Messages: <span className="text-[#C5B358]">{messages.length}</span></span>
          <span>Mode: <span className="text-[#C5B358]">SSE Stream</span></span>
          <span>Status: <span className={streaming ? "text-yellow-500" : "text-green-500"}>
            {streaming ? 'Streaming' : 'Ready'}
          </span></span>
        </div>
      </div>
      
      <div className="mt-4 text-center text-[#A89F91] text-xs">
        🎰 Real-time Vegas AI - Where every token counts at $0.001! 🎰
      </div>
    </div>
  );
}