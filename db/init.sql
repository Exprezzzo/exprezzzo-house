-- EXPREZZZO Sovereign House Database Schema
-- Vegas-first, sovereignty-always, $0.001/request

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    sovereignty_score INTEGER DEFAULT 10,
    total_cost_usd DECIMAL(10,6) DEFAULT 0.00,
    degraded BOOLEAN DEFAULT FALSE
);

-- Requests table
CREATE TABLE IF NOT EXISTS requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    prompt TEXT NOT NULL,
    response TEXT,
    cost_usd DECIMAL(10,6) NOT NULL,
    model VARCHAR(100) NOT NULL,
    degraded BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW(),
    duration_ms INTEGER
);

-- Rooms table
CREATE TABLE IF NOT EXISTS rooms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    emoji VARCHAR(10),
    color VARCHAR(7),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Insert default rooms
INSERT INTO rooms (name, description, emoji, color) VALUES
('Master', 'Central control and sovereignty status', '🏠', '#C5B358'),
('Chat', 'AI conversation and streaming', '💬', '#EDC9AF'),
('Library', 'Knowledge and documentation', '📚', '#A89F91'),
('Workspace', 'Development and tools', '💼', '#F5F5DC'),
('Vault', 'Secure storage and secrets', '🔒', '#C72C41'),
('Network', 'Connections and integrations', '🌐', '#C5B358'),
('Admin', 'System administration', '⚙️', '#381819')
ON CONFLICT DO NOTHING;

-- Metrics table
CREATE TABLE IF NOT EXISTS metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    metric_type VARCHAR(50) NOT NULL,
    value DECIMAL(10,6) NOT NULL,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_requests_user_id ON requests(user_id);
CREATE INDEX IF NOT EXISTS idx_requests_created_at ON requests(created_at);
CREATE INDEX IF NOT EXISTS idx_requests_degraded ON requests(degraded);
CREATE INDEX IF NOT EXISTS idx_metrics_type ON metrics(metric_type);

-- Insert initial metrics
INSERT INTO metrics (metric_type, value, metadata) VALUES
('sovereignty_score', 10.0, '{"description": "Base sovereignty level"}'),
('target_cost', 0.001, '{"description": "Target cost per request in USD"}'),
('degradation_threshold', 0.001, '{"description": "Cost threshold for degradation"}')
ON CONFLICT DO NOTHING;

COMMENT ON DATABASE exprezzzo IS 'EXPREZZZO Sovereign House - Vegas First, Sovereignty Always';

-- Grant permissions
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO sovereign;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO sovereign;