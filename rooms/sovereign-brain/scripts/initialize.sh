#!/bin/bash

echo "🚀 Initializing EXPREZZZO Sovereign Brain (CPU Version)..."

# Create directories
echo "📁 Creating directories..."
mkdir -p data/postgres data/redis data/exports 
mkdir -p models logs

# Set permissions
chmod -R 777 data/ models/ logs/

# Pull Ollama models (CPU-friendly)
echo "📥 Pulling CPU models..."
docker-compose up -d ollama
sleep 10
docker-compose exec ollama ollama pull llama3.2:3b
docker-compose exec ollama ollama pull mistral:7b

# Start core services
echo "🐳 Starting services..."
docker-compose up -d postgres redis
sleep 10

# Initialize database
echo "🗄️ Initializing database..."
docker-compose exec postgres psql -U exprezzzo -d sovereign_brain -c "CREATE EXTENSION IF NOT EXISTS vector;"

# Start remaining services
echo "🚀 Starting all services..."
docker-compose up -d

echo "✅ Checking status..."
docker-compose ps

echo "
✨ Sovereign Brain Ready (CPU Mode)!

📍 Endpoints:
   API: http://localhost:3001
   LiteLLM: http://localhost:4000
   Ollama: http://localhost:11434

💡 Note: Using CPU models + external APIs (no GPU required)
"
