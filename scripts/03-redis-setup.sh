#!/bin/bash

# EXPREZZZO Phase 2 - Redis Setup Script
# Sets up Redis with optimized configuration for EXPREZZZO caching and sessions

set -e

LOGFILE="/var/log/exprezzzo-redis-setup.log"
REDIS_PASSWORD="${EXPREZZZO_REDIS_PASSWORD:-$(openssl rand -base64 32)}"

log() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" | tee -a "$LOGFILE"
}

error_exit() {
    log "ERROR: $1"
    exit 1
}

log "Starting EXPREZZZO Redis setup..."

# Check if running as root
if [[ $EUID -ne 0 ]]; then
   error_exit "This script must be run as root"
fi

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    error_exit "Docker is not running. Please run 01-docker-setup.sh first"
fi

# Create Redis data directory
log "Creating Redis data directory..."
mkdir -p /opt/exprezzzo/data/redis || error_exit "Failed to create Redis data directory"
chmod 755 /opt/exprezzzo/data/redis || error_exit "Failed to set Redis data directory permissions"

# Create Redis configuration directory
log "Creating Redis configuration directory..."
mkdir -p /opt/exprezzzo/config/redis || error_exit "Failed to create Redis config directory"

# Create custom Redis configuration
log "Creating Redis configuration..."
cat > /opt/exprezzzo/config/redis/redis.conf << EOF
# Redis Configuration for EXPREZZZO
# Optimized for caching and session management

# Network and Security
bind 0.0.0.0
port 6379
protected-mode yes
requirepass ${REDIS_PASSWORD}

# General Configuration
daemonize no
pidfile /var/run/redis/redis-server.pid
loglevel notice
logfile ""
databases 16

# Persistence Configuration
save 900 1
save 300 10
save 60 10000
stop-writes-on-bgsave-error yes
rdbcompression yes
rdbchecksum yes
dbfilename dump.rdb
dir /data

# AOF Configuration
appendonly yes
appendfilename "appendonly.aof"
appendfsync everysec
no-appendfsync-on-rewrite no
auto-aof-rewrite-percentage 100
auto-aof-rewrite-min-size 64mb
aof-load-truncated yes
aof-use-rdb-preamble yes

# Memory Management
maxmemory 512mb
maxmemory-policy allkeys-lru
maxmemory-samples 5

# Lazy Freeing
lazyfree-lazy-eviction yes
lazyfree-lazy-expire yes
lazyfree-lazy-server-del yes

# Threading
io-threads 2
io-threads-do-reads yes

# Slow Log
slowlog-log-slower-than 10000
slowlog-max-len 128

# Latency Monitoring
latency-monitor-threshold 100

# Client Management
timeout 300
tcp-keepalive 300
tcp-backlog 511

# Advanced Configuration
hash-max-ziplist-entries 512
hash-max-ziplist-value 64
list-max-ziplist-size -2
list-compress-depth 0
set-max-intset-entries 512
zset-max-ziplist-entries 128
zset-max-ziplist-value 64
hll-sparse-max-bytes 3000
stream-node-max-bytes 4096
stream-node-max-entries 100
activerehashing yes

# Client Output Buffer Limits
client-output-buffer-limit normal 0 0 0
client-output-buffer-limit replica 256mb 64mb 60
client-output-buffer-limit pubsub 32mb 8mb 60

# Frequency of rehashing the main dictionary
hz 10

# Enable active rehashing
activerehashing yes

# Jemalloc background thread
jemalloc-bg-thread yes

# EOF
EOF

# Create Docker Compose file for Redis
log "Creating Redis Docker Compose configuration..."
cat > /opt/exprezzzo/config/redis/docker-compose.yml << EOF
version: '3.8'

services:
  redis:
    image: redis:7-alpine
    container_name: exprezzzo-redis
    restart: unless-stopped
    ports:
      - "6379:6379"
    volumes:
      - /opt/exprezzzo/data/redis:/data
      - /opt/exprezzzo/config/redis/redis.conf:/etc/redis/redis.conf:ro
      - /opt/exprezzzo/logs:/var/log/redis
    command: redis-server /etc/redis/redis.conf
    networks:
      - exprezzzo-network
    healthcheck:
      test: ["CMD", "redis-cli", "--raw", "incr", "ping"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 30s
    sysctls:
      - net.core.somaxconn=1024
    ulimits:
      memlock:
        soft: -1
        hard: -1

networks:
  exprezzzo-network:
    external: true
EOF

# Start Redis container
log "Starting Redis container..."
cd /opt/exprezzzo/config/redis
docker-compose up -d || error_exit "Failed to start Redis container"

# Wait for Redis to be ready
log "Waiting for Redis to be ready..."
for i in {1..30}; do
    if docker exec exprezzzo-redis redis-cli -a "$REDIS_PASSWORD" ping > /dev/null 2>&1; then
        log "Redis is ready!"
        break
    fi
    if [ $i -eq 30 ]; then
        error_exit "Redis failed to start within 150 seconds"
    fi
    log "Waiting for Redis... ($i/30)"
    sleep 5
done

# Configure Redis for EXPREZZZO use cases
log "Configuring Redis for EXPREZZZO..."
docker exec exprezzzo-redis redis-cli -a "$REDIS_PASSWORD" << EOF
# Set up database assignments
# DB 0: General cache
# DB 1: Session store
# DB 2: Rate limiting
# DB 3: Queue system
# DB 4: Analytics cache
# DB 5: Temporary data

# Configure some initial settings
CONFIG SET maxmemory-policy allkeys-lru
CONFIG SET save "900 1 300 10 60 10000"

# Test basic functionality
SET exprezzzo:setup:timestamp "$(date -Iseconds)"
SET exprezzzo:setup:version "Phase-2"
EXPIRE exprezzzo:setup:timestamp 3600

# Set up initial counters
SET exprezzzo:stats:deployments 1
EOF

# Create Redis monitoring script
log "Creating Redis monitoring script..."
cat > /opt/exprezzzo/scripts/redis-monitor.sh << EOF
#!/bin/bash

REDIS_PASSWORD="$REDIS_PASSWORD"

echo "=== EXPREZZZO Redis Status ==="
echo "Timestamp: \$(date)"
echo ""

# Basic info
echo "=== Redis Info ==="
docker exec exprezzzo-redis redis-cli -a "\$REDIS_PASSWORD" info server | head -10

echo ""
echo "=== Memory Usage ==="
docker exec exprezzzo-redis redis-cli -a "\$REDIS_PASSWORD" info memory | grep -E "(used_memory_human|maxmemory_human|used_memory_peak_human)"

echo ""
echo "=== Connected Clients ==="
docker exec exprezzzo-redis redis-cli -a "\$REDIS_PASSWORD" info clients | grep connected_clients

echo ""
echo "=== Keyspace ==="
docker exec exprezzzo-redis redis-cli -a "\$REDIS_PASSWORD" info keyspace

echo ""
echo "=== Stats ==="
docker exec exprezzzo-redis redis-cli -a "\$REDIS_PASSWORD" info stats | grep -E "(total_commands_processed|instantaneous_ops_per_sec|keyspace_hits|keyspace_misses)"

echo ""
echo "=== Slow Log (Last 10) ==="
docker exec exprezzzo-redis redis-cli -a "\$REDIS_PASSWORD" slowlog get 10
EOF

chmod +x /opt/exprezzzo/scripts/redis-monitor.sh || error_exit "Failed to make Redis monitor script executable"

# Create Redis backup script
log "Creating Redis backup script..."
cat > /opt/exprezzzo/scripts/backup-redis.sh << EOF
#!/bin/bash

BACKUP_DIR="/opt/exprezzzo/backups/redis"
TIMESTAMP=\$(date +%Y%m%d_%H%M%S)
REDIS_PASSWORD="$REDIS_PASSWORD"

mkdir -p "\$BACKUP_DIR"

# Force a background save
docker exec exprezzzo-redis redis-cli -a "\$REDIS_PASSWORD" BGSAVE

# Wait for save to complete
while [ \$(docker exec exprezzzo-redis redis-cli -a "\$REDIS_PASSWORD" LASTSAVE) -eq \$(docker exec exprezzzo-redis redis-cli -a "\$REDIS_PASSWORD" LASTSAVE) ]; do
    sleep 1
done

# Copy the dump file
docker cp exprezzzo-redis:/data/dump.rdb "\${BACKUP_DIR}/redis_dump_\${TIMESTAMP}.rdb"

# Compress backup
gzip "\${BACKUP_DIR}/redis_dump_\${TIMESTAMP}.rdb"

# Remove backups older than 7 days
find "\$BACKUP_DIR" -name "*.rdb.gz" -mtime +7 -delete

echo "Redis backup completed: redis_dump_\${TIMESTAMP}.rdb.gz"
EOF

chmod +x /opt/exprezzzo/scripts/backup-redis.sh || error_exit "Failed to make Redis backup script executable"

# Create Redis flush script (for development/testing)
log "Creating Redis flush script..."
cat > /opt/exprezzzo/scripts/flush-redis.sh << EOF
#!/bin/bash

REDIS_PASSWORD="$REDIS_PASSWORD"

echo "WARNING: This will delete ALL Redis data!"
read -p "Are you sure? (type 'yes' to continue): " confirm

if [ "\$confirm" = "yes" ]; then
    docker exec exprezzzo-redis redis-cli -a "\$REDIS_PASSWORD" FLUSHALL
    echo "All Redis databases have been flushed"
else
    echo "Operation cancelled"
fi
EOF

chmod +x /opt/exprezzzo/scripts/flush-redis.sh || error_exit "Failed to make Redis flush script executable"

# Save Redis credentials
log "Saving Redis credentials..."
cat > /opt/exprezzzo/config/.env.redis << EOF
# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=${REDIS_PASSWORD}
REDIS_URL=redis://:${REDIS_PASSWORD}@localhost:6379

# Database assignments
REDIS_CACHE_DB=0
REDIS_SESSION_DB=1
REDIS_RATELIMIT_DB=2
REDIS_QUEUE_DB=3
REDIS_ANALYTICS_DB=4
REDIS_TEMP_DB=5
EOF

chmod 600 /opt/exprezzzo/config/.env.redis || error_exit "Failed to secure Redis credentials file"

# Test Redis functionality
log "Testing Redis functionality..."
docker exec exprezzzo-redis redis-cli -a "$REDIS_PASSWORD" << EOF
PING
SET test:key "EXPREZZZO Redis Setup Complete"
GET test:key
DEL test:key
EOF

log "Redis setup completed successfully!"
log "Password saved in: /opt/exprezzzo/config/.env.redis"
log "Monitor script: /opt/exprezzzo/scripts/redis-monitor.sh"
log "Backup script: /opt/exprezzzo/scripts/backup-redis.sh"
log "Flush script: /opt/exprezzzo/scripts/flush-redis.sh"