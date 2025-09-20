"""
EXPREZZZO Sovereign Memory System
Learns from every interaction, remembers everything
"""

import json
import asyncio
import numpy as np
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
import asyncpg
import redis.asyncio as redis
from sentence_transformers import SentenceTransformer
import torch
from dataclasses import dataclass, asdict
import hashlib
import pickle

@dataclass
class Memory:
    """Single memory unit"""
    id: str
    content: str
    embedding: np.ndarray
    metadata: Dict[str, Any]
    source: str
    timestamp: datetime
    feedback_score: float = 0.0
    access_count: int = 0
    last_accessed: Optional[datetime] = None
    corrections: List[Dict] = None
    related_memories: List[str] = None
    
    def to_dict(self):
        data = asdict(self)
        data['embedding'] = self.embedding.tolist()
        data['timestamp'] = self.timestamp.isoformat()
        if self.last_accessed:
            data['last_accessed'] = self.last_accessed.isoformat()
        return data

class SovereignMemorySystem:
    """
    The core memory system that learns and improves
    """
    
    def __init__(self):
        self.embedder = SentenceTransformer('all-MiniLM-L6-v2')
        self.db_pool = None
        self.redis = None
        self.learning_rate = 0.1
        self.forgetting_curve = 0.95  # Memory decay rate
        
    async def initialize(self):
        """Initialize all connections"""
        # PostgreSQL connection pool
        self.db_pool = await asyncpg.create_pool(
            "postgresql://exprezzzo:VegasAlwaysWins2025@localhost:5432/sovereign_brain",
            min_size=10,
            max_size=20
        )
        
        # Redis connection
        self.redis = await redis.from_url("redis://localhost:6379")
        
        # Create database schema
        await self._create_schema()
        
        print("✅ Sovereign Memory System initialized")
    
    async def _create_schema(self):
        """Create the database schema with pgvector"""
        async with self.db_pool.acquire() as conn:
            await conn.execute("""
                CREATE EXTENSION IF NOT EXISTS vector;
                
                CREATE TABLE IF NOT EXISTS memories (
                    id TEXT PRIMARY KEY,
                    content TEXT NOT NULL,
                    embedding vector(384),
                    metadata JSONB,
                    source TEXT,
                    timestamp TIMESTAMPTZ DEFAULT NOW(),
                    feedback_score FLOAT DEFAULT 0.0,
                    access_count INTEGER DEFAULT 0,
                    last_accessed TIMESTAMPTZ,
                    corrections JSONB DEFAULT '[]'::JSONB,
                    related_memories TEXT[] DEFAULT ARRAY[]::TEXT[],
                    created_at TIMESTAMPTZ DEFAULT NOW(),
                    updated_at TIMESTAMPTZ DEFAULT NOW()
                );
                
                CREATE INDEX IF NOT EXISTS idx_embedding ON memories 
                USING ivfflat (embedding vector_cosine_ops)
                WITH (lists = 100);
                
                CREATE TABLE IF NOT EXISTS learning_feedback (
                    id SERIAL PRIMARY KEY,
                    memory_id TEXT REFERENCES memories(id),
                    feedback_type TEXT,
                    feedback_value JSONB,
                    timestamp TIMESTAMPTZ DEFAULT NOW()
                );
                
                CREATE TABLE IF NOT EXISTS context_chains (
                    id SERIAL PRIMARY KEY,
                    chain_id TEXT NOT NULL,
                    memory_ids TEXT[],
                    context_type TEXT,
                    metadata JSONB,
                    created_at TIMESTAMPTZ DEFAULT NOW()
                );
            """)
    
    async def store_memory(self, 
                          content: str, 
                          source: str,
                          metadata: Optional[Dict] = None) -> Memory:
        """Store a new memory with embedding"""
        
        # Generate unique ID
        memory_id = hashlib.sha256(
            f"{content}{source}{datetime.now().isoformat()}".encode()
        ).hexdigest()[:16]
        
        # Generate embedding
        embedding = self.embedder.encode(content)
        
        # Create memory object
        memory = Memory(
            id=memory_id,
            content=content,
            embedding=embedding,
            metadata=metadata or {},
            source=source,
            timestamp=datetime.now(),
            corrections=[],
            related_memories=[]
        )
        
        # Store in database
        async with self.db_pool.acquire() as conn:
            await conn.execute("""
                INSERT INTO memories 
                (id, content, embedding, metadata, source, timestamp)
                VALUES ($1, $2, $3, $4, $5, $6)
                ON CONFLICT (id) DO UPDATE
                SET content = $2,
                    embedding = $3,
                    metadata = $4,
                    updated_at = NOW()
            """, memory.id, memory.content, 
                embedding.tolist(), json.dumps(memory.metadata),
                memory.source, memory.timestamp)
        
        # Cache in Redis for fast access
        await self.redis.setex(
            f"memory:{memory.id}",
            86400,  # 24 hour TTL
            pickle.dumps(memory)
        )
        
        # Find and link related memories
        await self._link_related_memories(memory)
        
        return memory
    
    async def recall(self, 
                    query: str, 
                    limit: int = 10,
                    threshold: float = 0.5) -> List[Memory]:
        """Recall memories similar to query"""
        
        # Check Redis cache first
        cache_key = f"recall:{hashlib.md5(query.encode()).hexdigest()}"
        cached = await self.redis.get(cache_key)
        if cached:
            return pickle.loads(cached)
        
        # Generate query embedding
        query_embedding = self.embedder.encode(query)
        
        # Search in pgvector
        async with self.db_pool.acquire() as conn:
            results = await conn.fetch("""
                SELECT *, 
                       1 - (embedding <=> $1::vector) as similarity
                FROM memories
                WHERE 1 - (embedding <=> $1::vector) > $2
                ORDER BY similarity DESC, 
                         feedback_score DESC,
                         access_count DESC
                LIMIT $3
            """, query_embedding.tolist(), threshold, limit)
        
        memories = []
        for row in results:
            memory = Memory(
                id=row['id'],
                content=row['content'],
                embedding=np.array(row['embedding']),
                metadata=json.loads(row['metadata']) if row['metadata'] else {},
                source=row['source'],
                timestamp=row['timestamp'],
                feedback_score=row['feedback_score'],
                access_count=row['access_count'],
                last_accessed=row['last_accessed'],
                corrections=json.loads(row['corrections']) if row['corrections'] else [],
                related_memories=row['related_memories'] or []
            )
            memories.append(memory)
            
            # Update access count
            await self._update_access(memory.id)
        
        # Cache results
        await self.redis.setex(cache_key, 3600, pickle.dumps(memories))
        
        return memories
    
    async def learn_from_feedback(self,
                                 memory_id: str,
                                 feedback_type: str,
                                 feedback_value: Any):
        """Learn from user corrections and feedback"""
        
        async with self.db_pool.acquire() as conn:
            # Store feedback
            await conn.execute("""
                INSERT INTO learning_feedback
                (memory_id, feedback_type, feedback_value)
                VALUES ($1, $2, $3)
            """, memory_id, feedback_type, json.dumps(feedback_value))
            
            # Update memory based on feedback
            if feedback_type == "correction":
                # User corrected this memory
                await conn.execute("""
                    UPDATE memories
                    SET corrections = corrections || $1::JSONB,
                        feedback_score = feedback_score - 0.1,
                        updated_at = NOW()
                    WHERE id = $2
                """, json.dumps([feedback_value]), memory_id)
                
                # Store the corrected version as new memory
                if 'corrected_content' in feedback_value:
                    await self.store_memory(
                        content=feedback_value['corrected_content'],
                        source=f"correction_of_{memory_id}",
                        metadata={
                            'original_memory': memory_id,
                            'correction_type': feedback_type,
                            'timestamp': datetime.now().isoformat()
                        }
                    )
                    
            elif feedback_type == "positive":
                # Memory was helpful
                await conn.execute("""
                    UPDATE memories
                    SET feedback_score = feedback_score + 0.1,
                        updated_at = NOW()
                    WHERE id = $1
                """, memory_id)
                
            elif feedback_type == "negative":
                # Memory was not helpful
                await conn.execute("""
                    UPDATE memories
                    SET feedback_score = feedback_score - 0.2,
                        updated_at = NOW()
                    WHERE id = $1
                """, memory_id)
    
    async def _link_related_memories(self, memory: Memory):
        """Find and link related memories"""
        
        # Find similar memories
        similar = await self.recall(memory.content, limit=5, threshold=0.7)
        
        if similar:
            related_ids = [m.id for m in similar if m.id != memory.id]
            
            async with self.db_pool.acquire() as conn:
                # Update this memory with related ones
                await conn.execute("""
                    UPDATE memories
                    SET related_memories = $1
                    WHERE id = $2
                """, related_ids, memory.id)
                
                # Update related memories to link back
                for related_id in related_ids:
                    await conn.execute("""
                        UPDATE memories
                        SET related_memories = array_append(related_memories, $1)
                        WHERE id = $2 AND NOT ($1 = ANY(related_memories))
                    """, memory.id, related_id)
    
    async def _update_access(self, memory_id: str):
        """Update access count and timestamp"""
        async with self.db_pool.acquire() as conn:
            await conn.execute("""
                UPDATE memories
                SET access_count = access_count + 1,
                    last_accessed = NOW()
                WHERE id = $1
            """, memory_id)
    
    async def consolidate_learning(self):
        """Consolidate memories and apply forgetting curve"""
        async with self.db_pool.acquire() as conn:
            # Apply forgetting curve to old, unused memories
            await conn.execute("""
                UPDATE memories
                SET feedback_score = feedback_score * $1
                WHERE last_accessed < NOW() - INTERVAL '30 days'
                AND feedback_score > -1.0
            """, self.forgetting_curve)
            
            # Boost frequently accessed memories
            await conn.execute("""
                UPDATE memories
                SET feedback_score = feedback_score + 0.01
                WHERE access_count > 10
                AND last_accessed > NOW() - INTERVAL '7 days'
            """)
            
            # Remove very low-scoring memories (optional cleanup)
            # await conn.execute("""
            #     DELETE FROM memories
            #     WHERE feedback_score < -5.0
            #     AND access_count < 2
            #     AND created_at < NOW() - INTERVAL '90 days'
            # """)
    
    async def export_knowledge(self, output_path: str):
        """Export all knowledge for backup/migration"""
        async with self.db_pool.acquire() as conn:
            memories = await conn.fetch("""
                SELECT * FROM memories
                ORDER BY feedback_score DESC, access_count DESC
            """)
            
            feedback = await conn.fetch("""
                SELECT * FROM learning_feedback
                ORDER BY timestamp DESC
            """)
            
            chains = await conn.fetch("""
                SELECT * FROM context_chains
                ORDER BY created_at DESC
            """)
        
        export_data = {
            'export_date': datetime.now().isoformat(),
            'memories': [dict(m) for m in memories],
            'feedback': [dict(f) for f in feedback],
            'context_chains': [dict(c) for c in chains],
            'statistics': {
                'total_memories': len(memories),
                'total_feedback': len(feedback),
                'total_chains': len(chains)
            }
        }
        
        with open(output_path, 'w') as f:
            json.dump(export_data, f, indent=2, default=str)
        
        print(f"✅ Exported {len(memories)} memories to {output_path}")
        
        return export_data

# Initialize the system
memory_system = SovereignMemorySystem()
