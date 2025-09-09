'use client'
import { useState, useEffect } from 'react'
import { Book, Search, Download, Star, Clock, FileText, Code, Image, Video, Music } from 'lucide-react'

interface LibraryItem {
  id: string
  title: string
  type: 'document' | 'code' | 'image' | 'video' | 'audio'
  description: string
  size: string
  dateAdded: Date
  rating: number
  downloads: number
  tags: string[]
  author: string
}

export default function LibraryRoom() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedType, setSelectedType] = useState<string>('all')
  const [sortBy, setSortBy] = useState<'date' | 'rating' | 'downloads'>('date')
  const [libraryItems, setLibraryItems] = useState<LibraryItem[]>([])

  // Sample library data
  useEffect(() => {
    setLibraryItems([
      {
        id: '1',
        title: 'Sovereign AI Architecture Guide',
        type: 'document',
        description: 'Complete guide to building sovereign AI systems with full data control',
        size: '2.3 MB',
        dateAdded: new Date('2025-01-15'),
        rating: 4.8,
        downloads: 1250,
        tags: ['AI', 'Architecture', 'Sovereign'],
        author: 'EXPREZZZO Labs'
      },
      {
        id: '2',
        title: 'Vegas-Style UI Components',
        type: 'code',
        description: 'React components with Vegas aesthetic - gold, chocolate, and desert themes',
        size: '850 KB',
        dateAdded: new Date('2025-01-12'),
        rating: 4.6,
        downloads: 890,
        tags: ['React', 'UI', 'Vegas', 'Components'],
        author: 'Design Team'
      },
      {
        id: '3',
        title: '$0.0002 Request Optimization',
        type: 'document',
        description: 'Strategies for ultra-low-cost AI request processing and optimization',
        size: '1.8 MB',
        dateAdded: new Date('2025-01-10'),
        rating: 4.9,
        downloads: 2100,
        tags: ['Optimization', 'Cost', 'Performance'],
        author: 'Engineering'
      },
      {
        id: '4',
        title: 'Ollama Integration Scripts',
        type: 'code',
        description: 'Python and Node.js scripts for seamless Ollama model integration',
        size: '420 KB',
        dateAdded: new Date('2025-01-08'),
        rating: 4.7,
        downloads: 675,
        tags: ['Ollama', 'Python', 'Node.js', 'Integration'],
        author: 'Dev Team'
      },
      {
        id: '5',
        title: 'House Architecture Diagram',
        type: 'image',
        description: 'Visual representation of the 7-room EXPREZZZO House structure',
        size: '3.2 MB',
        dateAdded: new Date('2025-01-05'),
        rating: 4.5,
        downloads: 445,
        tags: ['Architecture', 'Diagram', 'House'],
        author: 'Architecture Team'
      }
    ])
  }, [])

  const filteredItems = libraryItems
    .filter(item => {
      const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           item.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      const matchesType = selectedType === 'all' || item.type === selectedType
      return matchesSearch && matchesType
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'rating':
          return b.rating - a.rating
        case 'downloads':
          return b.downloads - a.downloads
        case 'date':
        default:
          return b.dateAdded.getTime() - a.dateAdded.getTime()
      }
    })

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'document': return <FileText className="w-5 h-5" />
      case 'code': return <Code className="w-5 h-5" />
      case 'image': return <Image className="w-5 h-5" />
      case 'video': return <Video className="w-5 h-5" />
      case 'audio': return <Music className="w-5 h-5" />
      default: return <FileText className="w-5 h-5" />
    }
  }

  const handleDownload = (item: LibraryItem) => {
    // Simulate download - would connect to actual file storage
    setLibraryItems(prev => 
      prev.map(i => i.id === item.id ? { ...i, downloads: i.downloads + 1 } : i)
    )
    alert(`Downloading: ${item.title}`)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-chocolate via-vegas-dust to-chocolate">
      <div className="container mx-auto px-6 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-4 mb-4">
            <Book className="w-10 h-10 text-vegas-gold" />
            <h1 className="text-4xl font-bold text-vegas-gold">
              LIBRARY ROOM
            </h1>
          </div>
          <p className="text-xl text-desert-sand">
            Knowledge Vault of the Sovereign House
          </p>
          <div className="text-sm text-vegas-gold/80 mt-2">
            {libraryItems.length} items • All downloads free for Sovereign members
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-chocolate/60 backdrop-blur border-2 border-vegas-gold/20 rounded-xl p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-vegas-gold/60" />
                <input
                  type="text"
                  placeholder="Search library..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-chocolate/40 border border-vegas-gold/30 rounded-lg text-desert-sand placeholder-desert-sand/60 focus:outline-none focus:border-vegas-gold/60"
                />
              </div>
            </div>

            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="bg-chocolate/40 border border-vegas-gold/30 rounded-lg px-4 py-3 text-desert-sand focus:outline-none focus:border-vegas-gold/60"
            >
              <option value="all">All Types</option>
              <option value="document">Documents</option>
              <option value="code">Code</option>
              <option value="image">Images</option>
              <option value="video">Videos</option>
              <option value="audio">Audio</option>
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'date' | 'rating' | 'downloads')}
              className="bg-chocolate/40 border border-vegas-gold/30 rounded-lg px-4 py-3 text-desert-sand focus:outline-none focus:border-vegas-gold/60"
            >
              <option value="date">Latest</option>
              <option value="rating">Top Rated</option>
              <option value="downloads">Most Downloaded</option>
            </select>
          </div>
        </div>

        {/* Library Items Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.map((item) => (
            <div key={item.id} className="bg-chocolate/60 backdrop-blur border-2 border-vegas-gold/20 rounded-xl p-6 hover:border-vegas-gold/40 transition-colors">
              <div className="flex items-start gap-4 mb-4">
                <div className="text-vegas-gold">
                  {getTypeIcon(item.type)}
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-vegas-gold mb-2">{item.title}</h3>
                  <p className="text-desert-sand text-sm mb-3">{item.description}</p>
                </div>
              </div>

              {/* Tags */}
              <div className="flex flex-wrap gap-2 mb-4">
                {item.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-1 bg-vegas-gold/10 border border-vegas-gold/30 rounded-full text-xs text-vegas-gold"
                  >
                    {tag}
                  </span>
                ))}
              </div>

              {/* Meta Information */}
              <div className="space-y-2 mb-4 text-sm text-desert-sand/80">
                <div className="flex items-center justify-between">
                  <span>Size: {item.size}</span>
                  <span>By: {item.author}</span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 text-yellow-500" />
                    <span>{item.rating.toFixed(1)}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Download className="w-4 h-4" />
                    <span>{item.downloads.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    <span>{item.dateAdded.toLocaleDateString()}</span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <button
                  onClick={() => handleDownload(item)}
                  className="flex-1 bg-vegas-gold/10 hover:bg-vegas-gold/20 border border-vegas-gold/30 text-vegas-gold font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Download
                </button>
                <button className="bg-chocolate/40 hover:bg-chocolate/60 border border-vegas-gold/30 text-vegas-gold px-4 py-2 rounded-lg transition-colors">
                  <Star className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {filteredItems.length === 0 && (
          <div className="text-center py-12">
            <Book className="w-16 h-16 text-vegas-gold/30 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-vegas-gold/60 mb-2">No items found</h3>
            <p className="text-desert-sand/60">Try adjusting your search or filters</p>
          </div>
        )}

        {/* Statistics */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-chocolate/40 backdrop-blur border-2 border-vegas-gold/20 rounded-xl p-6 text-center">
            <FileText className="w-8 h-8 text-vegas-gold mx-auto mb-2" />
            <h4 className="text-lg font-semibold text-vegas-gold">Documents</h4>
            <p className="text-2xl font-bold text-desert-sand">
              {libraryItems.filter(i => i.type === 'document').length}
            </p>
          </div>
          
          <div className="bg-chocolate/40 backdrop-blur border-2 border-vegas-gold/20 rounded-xl p-6 text-center">
            <Code className="w-8 h-8 text-vegas-gold mx-auto mb-2" />
            <h4 className="text-lg font-semibold text-vegas-gold">Code</h4>
            <p className="text-2xl font-bold text-desert-sand">
              {libraryItems.filter(i => i.type === 'code').length}
            </p>
          </div>
          
          <div className="bg-chocolate/40 backdrop-blur border-2 border-vegas-gold/20 rounded-xl p-6 text-center">
            <Download className="w-8 h-8 text-vegas-gold mx-auto mb-2" />
            <h4 className="text-lg font-semibold text-vegas-gold">Downloads</h4>
            <p className="text-2xl font-bold text-desert-sand">
              {libraryItems.reduce((sum, item) => sum + item.downloads, 0).toLocaleString()}
            </p>
          </div>
          
          <div className="bg-chocolate/40 backdrop-blur border-2 border-vegas-gold/20 rounded-xl p-6 text-center">
            <Star className="w-8 h-8 text-vegas-gold mx-auto mb-2" />
            <h4 className="text-lg font-semibold text-vegas-gold">Avg Rating</h4>
            <p className="text-2xl font-bold text-desert-sand">
              {(libraryItems.reduce((sum, item) => sum + item.rating, 0) / libraryItems.length).toFixed(1)}
            </p>
          </div>
        </div>

        {/* Vegas Footer */}
        <div className="text-center mt-12 py-8 border-t-2 border-vegas-gold/20">
          <p className="text-vegas-gold text-lg font-semibold">
            📚 Knowledge is power, Vegas makes it profitable 📚
          </p>
        </div>
      </div>
    </div>
  )
}