#!/bin/bash

# EXPREZZZO Phase 2 - PostgreSQL 17 Setup Script
# Sets up PostgreSQL 17 with optimized configuration for EXPREZZZO

set -e

LOGFILE="/var/log/exprezzzo-postgres-setup.log"
POSTGRES_VERSION="17"
DB_NAME="exprezzzo"
DB_USER="exprezzzo"
DB_PASSWORD="${EXPREZZZO_DB_PASSWORD:-$(openssl rand -base64 32)}"

log() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" | tee -a "$LOGFILE"
}

error_exit() {
    log "ERROR: $1"
    exit 1
}

log "Starting EXPREZZZO PostgreSQL $POSTGRES_VERSION setup..."

# Check if running as root
if [[ $EUID -ne 0 ]]; then
   error_exit "This script must be run as root"
fi

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    error_exit "Docker is not running. Please run 01-docker-setup.sh first"
fi

# Create PostgreSQL data directory
log "Creating PostgreSQL data directory..."
mkdir -p /opt/exprezzzo/data/postgres || error_exit "Failed to create PostgreSQL data directory"
chmod 700 /opt/exprezzzo/data/postgres || error_exit "Failed to set PostgreSQL data directory permissions"

# Create PostgreSQL configuration directory
log "Creating PostgreSQL configuration directory..."
mkdir -p /opt/exprezzzo/config/postgres || error_exit "Failed to create PostgreSQL config directory"

# Create custom PostgreSQL configuration
log "Creating PostgreSQL configuration..."
cat > /opt/exprezzzo/config/postgres/postgresql.conf << EOF
# PostgreSQL 17 Configuration for EXPREZZZO
# Performance and Security Optimizations

# Connection Settings
listen_addresses = '*'
port = 5432
max_connections = 200
superuser_reserved_connections = 3

# Memory Configuration
shared_buffers = 256MB
effective_cache_size = 1GB
work_mem = 4MB
maintenance_work_mem = 64MB

# WAL Configuration
wal_level = replica
max_wal_size = 2GB
min_wal_size = 80MB
checkpoint_completion_target = 0.9

# Query Planner
random_page_cost = 1.1
effective_io_concurrency = 200

# Logging Configuration
logging_collector = on
log_directory = '/var/log/postgresql'
log_filename = 'postgresql-%Y-%m-%d_%H%M%S.log'
log_truncate_on_rotation = off
log_rotation_age = 1d
log_rotation_size = 100MB
log_line_prefix = '%t [%p]: [%l-1] user=%u,db=%d,app=%a,client=%h '
log_checkpoints = on
log_connections = on
log_disconnections = on
log_lock_waits = on
log_temp_files = 0
log_autovacuum_min_duration = 0
log_error_verbosity = default

# Autovacuum Configuration
autovacuum = on
log_autovacuum_min_duration = 0
autovacuum_max_workers = 3
autovacuum_naptime = 1min
autovacuum_vacuum_threshold = 50
autovacuum_analyze_threshold = 50

# Security Settings
ssl = off
password_encryption = scram-sha-256
row_security = on

# Statistics
track_activities = on
track_counts = on
track_io_timing = on
track_functions = all
stats_temp_directory = '/var/run/postgresql/stats_temp'
EOF

# Create pg_hba.conf for authentication
log "Creating PostgreSQL authentication configuration..."
cat > /opt/exprezzzo/config/postgres/pg_hba.conf << EOF
# PostgreSQL Client Authentication Configuration File
# TYPE  DATABASE        USER            ADDRESS                 METHOD

# "local" is for Unix domain socket connections only
local   all             postgres                                peer
local   all             all                                     scram-sha-256

# IPv4 local connections:
host    all             postgres        127.0.0.1/32            reject
host    all             all             127.0.0.1/32            scram-sha-256
host    all             all             172.16.0.0/12           scram-sha-256

# IPv6 local connections:
host    all             all             ::1/128                 scram-sha-256

# Allow connections from Docker network
host    all             all             172.18.0.0/16           scram-sha-256
EOF

# Create Docker Compose file for PostgreSQL
log "Creating PostgreSQL Docker Compose configuration..."
cat > /opt/exprezzzo/config/postgres/docker-compose.yml << EOF
version: '3.8'

services:
  postgres:
    image: postgres:${POSTGRES_VERSION}-alpine
    container_name: exprezzzo-postgres
    restart: unless-stopped
    environment:
      POSTGRES_DB: ${DB_NAME}
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      PGDATA: /var/lib/postgresql/data/pgdata
    ports:
      - "5432:5432"
    volumes:
      - /opt/exprezzzo/data/postgres:/var/lib/postgresql/data
      - /opt/exprezzzo/config/postgres/postgresql.conf:/etc/postgresql/postgresql.conf:ro
      - /opt/exprezzzo/config/postgres/pg_hba.conf:/etc/postgresql/pg_hba.conf:ro
      - /opt/exprezzzo/logs:/var/log/postgresql
    command: >
      postgres
      -c config_file=/etc/postgresql/postgresql.conf
      -c hba_file=/etc/postgresql/pg_hba.conf
    networks:
      - exprezzzo-network
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${DB_USER} -d ${DB_NAME}"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 30s

networks:
  exprezzzo-network:
    external: true
EOF

# Start PostgreSQL container
log "Starting PostgreSQL container..."
cd /opt/exprezzzo/config/postgres
docker-compose up -d || error_exit "Failed to start PostgreSQL container"

# Wait for PostgreSQL to be ready
log "Waiting for PostgreSQL to be ready..."
for i in {1..30}; do
    if docker exec exprezzzo-postgres pg_isready -U "$DB_USER" -d "$DB_NAME" > /dev/null 2>&1; then
        log "PostgreSQL is ready!"
        break
    fi
    if [ $i -eq 30 ]; then
        error_exit "PostgreSQL failed to start within 150 seconds"
    fi
    log "Waiting for PostgreSQL... ($i/30)"
    sleep 5
done

# Create database schema and initial setup
log "Setting up database schema..."
docker exec exprezzzo-postgres psql -U "$DB_USER" -d "$DB_NAME" -c "
-- Create extensions
CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\";
CREATE EXTENSION IF NOT EXISTS \"pg_stat_statements\";
CREATE EXTENSION IF NOT EXISTS \"pg_trgm\";

-- Create basic schema structure
CREATE SCHEMA IF NOT EXISTS exprezzzo;
CREATE SCHEMA IF NOT EXISTS logs;
CREATE SCHEMA IF NOT EXISTS analytics;

-- Set default search path
ALTER DATABASE $DB_NAME SET search_path TO exprezzzo, public;

-- Create basic tables
CREATE TABLE IF NOT EXISTS exprezzzo.deployment_info (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    version VARCHAR(50) NOT NULL,
    deployed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deployed_by VARCHAR(100),
    environment VARCHAR(20) DEFAULT 'production',
    notes TEXT
);

-- Insert deployment record
INSERT INTO exprezzzo.deployment_info (version, deployed_by, notes) 
VALUES ('Phase-2', 'system', 'Initial PostgreSQL 17 setup');
" || error_exit "Failed to setup database schema"

# Create backup script
log "Creating database backup script..."
cat > /opt/exprezzzo/scripts/backup-postgres.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/opt/exprezzzo/backups/postgres"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="exprezzzo_backup_${TIMESTAMP}.sql"

mkdir -p "$BACKUP_DIR"

docker exec exprezzzo-postgres pg_dump -U exprezzzo -d exprezzzo --verbose --clean --if-exists > "${BACKUP_DIR}/${BACKUP_FILE}"

# Compress backup
gzip "${BACKUP_DIR}/${BACKUP_FILE}"

# Remove backups older than 7 days
find "$BACKUP_DIR" -name "*.sql.gz" -mtime +7 -delete

echo "Backup completed: ${BACKUP_FILE}.gz"
EOF

chmod +x /opt/exprezzzo/scripts/backup-postgres.sh || error_exit "Failed to make backup script executable"

# Create restore script
log "Creating database restore script..."
cat > /opt/exprezzzo/scripts/restore-postgres.sh << 'EOF'
#!/bin/bash
if [ -z "$1" ]; then
    echo "Usage: $0 <backup_file.sql.gz>"
    exit 1
fi

BACKUP_FILE="$1"
if [ ! -f "$BACKUP_FILE" ]; then
    echo "Backup file not found: $BACKUP_FILE"
    exit 1
fi

echo "Restoring database from: $BACKUP_FILE"
gunzip -c "$BACKUP_FILE" | docker exec -i exprezzzo-postgres psql -U exprezzzo -d exprezzzo
echo "Restore completed"
EOF

chmod +x /opt/exprezzzo/scripts/restore-postgres.sh || error_exit "Failed to make restore script executable"

# Save database credentials
log "Saving database credentials..."
cat > /opt/exprezzzo/config/.env.postgres << EOF
# PostgreSQL Configuration
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=${DB_NAME}
POSTGRES_USER=${DB_USER}
POSTGRES_PASSWORD=${DB_PASSWORD}
DATABASE_URL=postgresql://${DB_USER}:${DB_PASSWORD}@localhost:5432/${DB_NAME}
EOF

chmod 600 /opt/exprezzzo/config/.env.postgres || error_exit "Failed to secure credentials file"

log "PostgreSQL $POSTGRES_VERSION setup completed successfully!"
log "Database: $DB_NAME"
log "User: $DB_USER"
log "Password saved in: /opt/exprezzzo/config/.env.postgres"
log "Backup script: /opt/exprezzzo/scripts/backup-postgres.sh"
log "Restore script: /opt/exprezzzo/scripts/restore-postgres.sh"