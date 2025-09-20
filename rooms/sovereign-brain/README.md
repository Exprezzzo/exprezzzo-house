# Sovereign Brain - EXPREZZZO House Room

## Status: 100% Operational

### Services Running:
- PostgreSQL 17 with pgvector (port 5432)
- Redis 7 (port 6379)
- Ollama with llama3.2 (port 11434)
- FastAPI (port 3001)

### Commands:
Start everything: /usr/local/bin/docker-compose up -d
Stop everything: /usr/local/bin/docker-compose down
Check status: docker ps

### Import Data Later:
1. Export data from ChatGPT/Claude/etc
2. Place in ~/exprezzzo-house/data/imports/
3. Run: python3 universal_importer.py

### Current Memories: 6
- EXPREZZZO House contains 800 vendors in Las Vegas
- The House Always Wins through sovereignty
- LVGT PWA is the public face of EXPREZZZO
- Gray Panthers senior initiative in the House
- 23 years Vegas experience casino connections
- My first memory

### Access Points:
- API: http://localhost:3001
- Memory List: http://localhost:3001/memory/list
- Ollama: http://localhost:11434

The House Always Wins Through Sovereignty
