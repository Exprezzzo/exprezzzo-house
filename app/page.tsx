export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-amber-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-amber-900 mb-8">
          🏠 EXPREZZZO Sovereign House
        </h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <a href="/chat" className="p-6 bg-white rounded-lg shadow hover:shadow-lg">
            <h2 className="text-2xl mb-2">💬 Chat</h2>
            <p>AI Conversations</p>
          </a>
          <a href="/library" className="p-6 bg-white rounded-lg shadow hover:shadow-lg">
            <h2 className="text-2xl mb-2">📚 Library</h2>
            <p>Knowledge Base</p>
          </a>
          <a href="/workspace" className="p-6 bg-white rounded-lg shadow hover:shadow-lg">
            <h2 className="text-2xl mb-2">💼 Workspace</h2>
            <p>Projects</p>
          </a>
          <a href="/vault" className="p-6 bg-white rounded-lg shadow hover:shadow-lg">
            <h2 className="text-2xl mb-2">🔐 Vault</h2>
            <p>Security</p>
          </a>
        </div>
        <div className="mt-8 p-4 bg-amber-900 text-white rounded">
          <p>EXPREZZZO = 3 Z's | Sovereign AI | $0.001/request</p>
        </div>
      </div>
    </div>
  )
}