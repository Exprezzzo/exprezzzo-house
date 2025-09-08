CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS sovereignty_scores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vendor_name VARCHAR(255) NOT NULL UNIQUE,
    sovereignty_score DECIMAL(3,2) CHECK (sovereignty_score >= 0 AND sovereignty_score <= 1),
    lock_in_risk VARCHAR(50),
    escape_difficulty VARCHAR(50),
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    notes TEXT
);

CREATE TABLE IF NOT EXISTS request_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    room VARCHAR(100),
    model_used VARCHAR(100),
    tokens_used INTEGER,
    estimated_cost DECIMAL(10,6),
    sovereignty_preserved BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS house_rooms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    room_name VARCHAR(100) NOT NULL UNIQUE,
    room_type VARCHAR(50),
    sovereignty_level VARCHAR(20) DEFAULT 'enforced',
    brand_tokens JSONB,
    config JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS embeddings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    content TEXT NOT NULL,
    embedding vector(4096),
    metadata JSONB,
    room VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

DO $$
BEGIN
    BEGIN
        CREATE INDEX IF NOT EXISTS embeddings_vector_hnsw_idx ON embeddings 
        USING hnsw (embedding vector_cosine_ops) WITH (m = 16, ef_construction = 64);
        RAISE NOTICE 'HNSW index created successfully';
    EXCEPTION
        WHEN OTHERS THEN
            RAISE NOTICE 'HNSW failed, falling back to ivfflat: %', SQLERRM;
            CREATE INDEX IF NOT EXISTS embeddings_vector_idx ON embeddings 
            USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
    END;
END $$;

CREATE TABLE IF NOT EXISTS sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID,
    messages JSONB,
    total_tokens INTEGER DEFAULT 0,
    total_cost DECIMAL(10,6) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS providers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL UNIQUE,
    type VARCHAR(50),
    enabled BOOLEAN DEFAULT false,
    api_key TEXT,
    config JSONB,
    sovereignty_score DECIMAL(3,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO sovereignty_scores (vendor_name, sovereignty_score, lock_in_risk, escape_difficulty) VALUES
('Ollama', 1.00, 'None', 'Trivial'),
('PostgreSQL', 1.00, 'None', 'Easy'),
('Redis', 0.95, 'Minimal', 'Easy'),
('DragonflyDB', 0.92, 'Minimal', 'Easy'),
('Groq', 0.75, 'Low', 'Easy'),
('Together', 0.70, 'Low', 'Easy'),
('Fireworks', 0.68, 'Medium', 'Medium'),
('OpenAI', 0.30, 'High', 'Hard'),
('Firebase', 0.25, 'Very High', 'Very Hard')
ON CONFLICT (vendor_name) DO UPDATE 
SET sovereignty_score = EXCLUDED.sovereignty_score, last_updated = CURRENT_TIMESTAMP;

INSERT INTO house_rooms (room_name, room_type, brand_tokens) VALUES
('Master', 'orchestrator', '{"primary": "#C5B358", "secondary": "#381819"}'),
('Chat', 'interaction', '{"primary": "#C5B358", "secondary": "#381819"}'),
('Library', 'knowledge', '{"primary": "#EDC9AF", "secondary": "#381819"}'),
('Workspace', 'productivity', '{"primary": "#C5B358", "secondary": "#A89F91"}'),
('Vault', 'security', '{"primary": "#C72C41", "secondary": "#381819"}'),
('Network', 'connections', '{"primary": "#C5B358", "secondary": "#F5F5DC"}'),
('Admin', 'control', '{"primary": "#381819", "secondary": "#C5B358"}')
ON CONFLICT (room_name) DO NOTHING;

INSERT INTO providers (name, type, enabled, sovereignty_score) VALUES
('Ollama', 'sovereign', true, 1.00),
('Groq', 'flash', false, 0.75),
('Together', 'flash', false, 0.70),
('Fireworks', 'flash', false, 0.68),
('OpenAI', 'premium', false, 0.30)
ON CONFLICT (name) DO NOTHING;