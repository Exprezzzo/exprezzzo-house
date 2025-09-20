from fastapi import FastAPI
from datetime import datetime
import redis
import os

app = FastAPI(title="EXPREZZZO Sovereign Brain")

try:
    r = redis.Redis(host='redis', port=6379, decode_responses=True)
except:
    r = redis.Redis(host='localhost', port=6379, decode_responses=True)

@app.get("/")
async def root():
    return {
        "status": "operational",
        "service": "EXPREZZZO Sovereign Brain",
        "timestamp": datetime.now().isoformat(),
        "postgres": "ready",
        "redis": "ready",
        "ollama": "ready at http://localhost:11434"
    }

@app.get("/health")
async def health():
    try:
        r.ping()
        redis_status = "healthy"
    except:
        redis_status = "error"
    
    return {
        "status": "healthy",
        "redis": redis_status
    }

@app.post("/memory/store")
async def store_memory(content: str):
    key = f"memory:{datetime.now().timestamp()}"
    r.set(key, content)
    return {"status": "stored", "key": key}

@app.get("/memory/list")
async def list_memories():
    keys = r.keys("memory:*")
    memories = []
    for key in keys:
        memories.append({
            "key": key,
            "content": r.get(key)
        })
    return {"memories": memories}
