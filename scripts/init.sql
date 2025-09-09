-- EXPREZZZO House Database Schema v4.1
-- With complete sovereignty tracking and metrics

\echo 'Creating extensions...'
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

\echo 'Creating tables...'

-- Request logging with sovereignty tracking
CREATE TABLE IF NOT EXISTS request_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  route VARCHAR(255),
  method VARCHAR(10),
  provider VARCHAR(50),
  estimated_cost DECIMAL(10,6),
  actual_cost DECIMAL(10,6),
  latency_ms INTEGER,
  sovereignty_preserved BOOLEAN DEFAULT true,
  degraded BOOLEAN DEFAULT false,
  error_message TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Provider sovereignty scores
CREATE TABLE IF NOT EXISTS providers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) UNIQUE NOT NULL,
  sovereignty_score DECIMAL(3,2) CHECK (sovereignty_score >= 0 AND sovereignty_score <= 1),
  replaceability_hours INTEGER,
  cost_per_1k_tokens DECIMAL(10,6),
  is_active BOOLEAN DEFAULT true,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Vector embeddings for RAG
CREATE TABLE IF NOT EXISTS embeddings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  content TEXT NOT NULL,
  room VARCHAR(255),
  metadata JSONB,
  embedding vector(768),
  embedding_model VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Session management
CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_token VARCHAR(255) UNIQUE NOT NULL,
  user_data JSONB,
  expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Metrics aggregation
CREATE TABLE IF NOT EXISTS metrics (
  id BIGSERIAL PRIMARY KEY,
  metric_type VARCHAR(50),
  metric_name VARCHAR(100),
  metric_value DECIMAL,
  tags JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

\echo 'Creating indexes...'

-- Try HNSW first, fallback to IVFFLAT
DO $$
BEGIN
  BEGIN
    RAISE NOTICE 'Attempting to create HNSW index...';
    CREATE INDEX IF NOT EXISTS embeddings_hnsw_idx
      ON embeddings USING hnsw (embedding vector_cosine_ops)
      WITH (m = 16, ef_construction = 64);
    RAISE NOTICE 'HNSW index created successfully';
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'HNSW failed (%), creating IVFFLAT instead', SQLERRM;
    CREATE INDEX IF NOT EXISTS embeddings_ivfflat_idx
      ON embeddings USING ivfflat (embedding vector_cosine_ops) 
      WITH (lists = 100);
    RAISE NOTICE 'IVFFLAT index created as fallback';
  END;
END$$;

-- Standard B-tree indexes
CREATE INDEX IF NOT EXISTS idx_request_log_created ON request_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_request_log_provider ON request_log(provider);
CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_metrics_created ON metrics(created_at DESC);

-- Insert default providers
INSERT INTO providers (name, sovereignty_score, replaceability_hours, cost_per_1k_tokens) VALUES
  ('ollama', 1.0, 0, 0.0),
  ('openai', 0.3, 24, 0.03),
  ('anthropic', 0.4, 24, 0.025),
  ('gemini', 0.5, 12, 0.001)
ON CONFLICT (name) DO NOTHING;

\echo 'Database initialization complete!'
