#!/bin/bash

# EXPREZZZO Phase 2 - Application Deployment Script
# Deploys the EXPREZZZO application stack with all required services

set -e

LOGFILE="/var/log/exprezzzo-app-deploy.log"
APP_VERSION="${EXPREZZZO_VERSION:-latest}"
NODE_ENV="${NODE_ENV:-production}"

log() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" | tee -a "$LOGFILE"
}

error_exit() {
    log "ERROR: $1"
    exit 1
}

log "Starting EXPREZZZO application deployment..."

# Check if running as root
if [[ $EUID -ne 0 ]]; then
   error_exit "This script must be run as root"
fi

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    error_exit "Docker is not running. Please ensure Docker is installed and running"
fi

# Check if PostgreSQL and Redis are running
if ! docker ps | grep -q exprezzzo-postgres; then
    error_exit "PostgreSQL container is not running. Please run 02-postgres-setup.sh first"
fi

if ! docker ps | grep -q exprezzzo-redis; then
    error_exit "Redis container is not running. Please run 03-redis-setup.sh first"
fi

# Create application directories
log "Creating application directories..."
mkdir -p /opt/exprezzzo/{app,config/app,logs/app,uploads,static} || error_exit "Failed to create application directories"

# Create scripts directory if it doesn't exist
mkdir -p /opt/exprezzzo/scripts || error_exit "Failed to create scripts directory"

# Load environment variables
log "Loading environment variables..."
if [ -f "/opt/exprezzzo/config/.env.postgres" ]; then
    source /opt/exprezzzo/config/.env.postgres
else
    error_exit "PostgreSQL environment file not found. Please run 02-postgres-setup.sh first"
fi

if [ -f "/opt/exprezzzo/config/.env.redis" ]; then
    source /opt/exprezzzo/config/.env.redis
else
    error_exit "Redis environment file not found. Please run 03-redis-setup.sh first"
fi

# Create main application environment file
log "Creating application environment configuration..."
cat > /opt/exprezzzo/config/.env.app << EOF
# EXPREZZZO Application Configuration
NODE_ENV=${NODE_ENV}
PORT=3000
HOST=0.0.0.0

# Database Configuration
DATABASE_URL=${DATABASE_URL}
POSTGRES_HOST=${POSTGRES_HOST}
POSTGRES_PORT=${POSTGRES_PORT}
POSTGRES_DB=${POSTGRES_DB}
POSTGRES_USER=${POSTGRES_USER}
POSTGRES_PASSWORD=${POSTGRES_PASSWORD}

# Redis Configuration
REDIS_URL=${REDIS_URL}
REDIS_HOST=${REDIS_HOST}
REDIS_PORT=${REDIS_PORT}
REDIS_PASSWORD=${REDIS_PASSWORD}

# Session Configuration
SESSION_SECRET=$(openssl rand -base64 32)
SESSION_REDIS_DB=${REDIS_SESSION_DB}

# Cache Configuration
CACHE_REDIS_DB=${REDIS_CACHE_DB}
CACHE_TTL=3600

# Rate Limiting
RATE_LIMIT_REDIS_DB=${REDIS_RATELIMIT_DB}
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# File Upload Configuration
UPLOAD_DIR=/opt/exprezzzo/uploads
MAX_FILE_SIZE=10485760
ALLOWED_FILE_TYPES=jpg,jpeg,png,gif,pdf,doc,docx,txt

# Logging Configuration
LOG_LEVEL=info
LOG_FILE=/opt/exprezzzo/logs/app/exprezzzo.log

# Security Configuration
JWT_SECRET=$(openssl rand -base64 32)
BCRYPT_ROUNDS=12
CORS_ORIGIN=*
HELMET_ENABLED=true

# API Configuration
API_PREFIX=/api
API_VERSION=v1
API_RATE_LIMIT=1000

# Queue Configuration
QUEUE_REDIS_DB=${REDIS_QUEUE_DB}
QUEUE_CONCURRENCY=5

# Analytics Configuration
ANALYTICS_ENABLED=true
ANALYTICS_REDIS_DB=${REDIS_ANALYTICS_DB}

# Health Check Configuration
HEALTH_CHECK_INTERVAL=30000
HEALTH_CHECK_TIMEOUT=5000

# Feature Flags
MAINTENANCE_MODE=false
DEBUG_MODE=false
PROFILING_ENABLED=false
EOF

chmod 600 /opt/exprezzzo/config/.env.app || error_exit "Failed to secure app environment file"

# Create Dockerfile for EXPREZZZO application
log "Creating Dockerfile..."
cat > /opt/exprezzzo/app/Dockerfile << 'EOF'
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    curl \
    git

# Create non-root user
RUN addgroup -g 1001 -S exprezzzo && \
    adduser -S exprezzzo -u 1001 -G exprezzzo

# Copy package files
COPY package*.json ./
COPY yarn.lock* ./

# Install dependencies
RUN npm ci --only=production && \
    npm cache clean --force

# Copy application code
COPY . .

# Change ownership to non-root user
RUN chown -R exprezzzo:exprezzzo /app

# Switch to non-root user
USER exprezzzo

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3000/health || exit 1

# Start application
CMD ["npm", "start"]
EOF

# Create sample package.json if it doesn't exist
log "Creating sample package.json..."
cat > /opt/exprezzzo/app/package.json << 'EOF'
{
  "name": "exprezzzo-app",
  "version": "2.0.0",
  "description": "EXPREZZZO Phase 2 Application",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js",
    "test": "jest",
    "lint": "eslint .",
    "build": "npm run build:client",
    "build:client": "webpack --mode production"
  },
  "dependencies": {
    "express": "^4.18.2",
    "pg": "^8.11.3",
    "redis": "^4.6.8",
    "bcrypt": "^5.1.1",
    "jsonwebtoken": "^9.0.2",
    "helmet": "^7.0.0",
    "cors": "^2.8.5",
    "express-rate-limit": "^6.10.0",
    "express-session": "^1.17.3",
    "connect-redis": "^7.1.0",
    "multer": "^1.4.5-lts.1",
    "winston": "^3.10.0",
    "compression": "^1.7.4",
    "dotenv": "^16.3.1"
  },
  "devDependencies": {
    "nodemon": "^3.0.1",
    "jest": "^29.6.4",
    "eslint": "^8.47.0"
  },
  "engines": {
    "node": ">=16.0.0",
    "npm": ">=7.0.0"
  },
  "keywords": ["exprezzzo", "enterprise", "platform"],
  "author": "EXPREZZZO Team",
  "license": "PROPRIETARY"
}
EOF

# Create sample server.js
log "Creating sample server.js..."
cat > /opt/exprezzzo/app/server.js << 'EOF'
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const session = require('express-session');
const RedisStore = require('connect-redis').default;
const { createClient } = require('redis');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// Redis client setup
const redisClient = createClient({
    url: process.env.REDIS_URL,
    database: parseInt(process.env.CACHE_REDIS_DB || '0')
});

// PostgreSQL client setup
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
});

// Middleware
app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN }));
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting
const limiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'),
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
    message: 'Too many requests from this IP'
});
app.use(limiter);

// Session middleware
app.use(session({
    store: new RedisStore({ 
        client: redisClient,
        prefix: 'exprezzzo:sess:',
        db: parseInt(process.env.SESSION_REDIS_DB || '1')
    }),
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));

// Health check endpoint
app.get('/health', async (req, res) => {
    try {
        // Check database connection
        await pool.query('SELECT 1');
        
        // Check Redis connection
        await redisClient.ping();
        
        res.json({
            status: 'healthy',
            timestamp: new Date().toISOString(),
            version: process.env.npm_package_version || '2.0.0',
            environment: process.env.NODE_ENV,
            uptime: process.uptime()
        });
    } catch (error) {
        res.status(503).json({
            status: 'unhealthy',
            timestamp: new Date().toISOString(),
            error: error.message
        });
    }
});

// API routes
app.get('/api/status', (req, res) => {
    res.json({
        message: 'EXPREZZZO Phase 2 API is running',
        timestamp: new Date().toISOString(),
        version: '2.0.0'
    });
});

// Root endpoint
app.get('/', (req, res) => {
    res.json({
        message: 'Welcome to EXPREZZZO Phase 2',
        version: '2.0.0',
        status: 'running'
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        error: 'Something went wrong!',
        message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        error: 'Not Found',
        message: 'The requested resource was not found'
    });
});

// Initialize connections and start server
async function startServer() {
    try {
        // Connect to Redis
        await redisClient.connect();
        console.log('Connected to Redis');
        
        // Test database connection
        await pool.query('SELECT NOW()');
        console.log('Connected to PostgreSQL');
        
        // Start server
        app.listen(port, '0.0.0.0', () => {
            console.log(`EXPREZZZO Phase 2 server running on port ${port}`);
            console.log(`Environment: ${process.env.NODE_ENV}`);
            console.log(`Health check: http://localhost:${port}/health`);
        });
        
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
}

// Graceful shutdown
process.on('SIGINT', async () => {
    console.log('Shutting down gracefully...');
    await redisClient.quit();
    await pool.end();
    process.exit(0);
});

process.on('SIGTERM', async () => {
    console.log('SIGTERM received, shutting down gracefully...');
    await redisClient.quit();
    await pool.end();
    process.exit(0);
});

startServer();
EOF

# Create Docker Compose file for the application
log "Creating application Docker Compose configuration..."
cat > /opt/exprezzzo/config/app/docker-compose.yml << EOF
version: '3.8'

services:
  exprezzzo-app:
    build: 
      context: /opt/exprezzzo/app
      dockerfile: Dockerfile
    container_name: exprezzzo-app
    restart: unless-stopped
    environment:
      - NODE_ENV=${NODE_ENV}
    env_file:
      - /opt/exprezzzo/config/.env.app
    ports:
      - "3000:3000"
    volumes:
      - /opt/exprezzzo/uploads:/app/uploads
      - /opt/exprezzzo/logs/app:/app/logs
      - /opt/exprezzzo/static:/app/static
    networks:
      - exprezzzo-network
    depends_on:
      - exprezzzo-postgres
      - exprezzzo-redis
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 30s

networks:
  exprezzzo-network:
    external: true
EOF

# Install Node.js and npm if not present
log "Checking Node.js installation..."
if ! command -v node &> /dev/null; then
    log "Installing Node.js..."
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash - || error_exit "Failed to add Node.js repository"
    apt-get install -y nodejs || error_exit "Failed to install Node.js"
fi

# Build and start the application
log "Building application Docker image..."
cd /opt/exprezzzo/config/app
docker-compose build || error_exit "Failed to build application image"

log "Starting application container..."
docker-compose up -d || error_exit "Failed to start application container"

# Wait for application to be ready
log "Waiting for application to be ready..."
for i in {1..30}; do
    if curl -f http://localhost:3000/health > /dev/null 2>&1; then
        log "Application is ready!"
        break
    fi
    if [ $i -eq 30 ]; then
        error_exit "Application failed to start within 150 seconds"
    fi
    log "Waiting for application... ($i/30)"
    sleep 5
done

# Create application management scripts
log "Creating application management scripts..."

# Application restart script
cat > /opt/exprezzzo/scripts/restart-app.sh << 'EOF'
#!/bin/bash
cd /opt/exprezzzo/config/app
docker-compose down
docker-compose up -d
echo "Application restarted"
EOF

# Application logs script
cat > /opt/exprezzzo/scripts/app-logs.sh << 'EOF'
#!/bin/bash
if [ "$1" = "follow" ] || [ "$1" = "-f" ]; then
    docker logs -f exprezzzo-app
else
    docker logs exprezzzo-app --tail 100
fi
EOF

# Application status script
cat > /opt/exprezzzo/scripts/app-status.sh << 'EOF'
#!/bin/bash
echo "=== EXPREZZZO Application Status ==="
echo "Timestamp: $(date)"
echo ""

echo "=== Container Status ==="
docker ps --filter name=exprezzzo-app --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

echo ""
echo "=== Health Check ==="
curl -s http://localhost:3000/health | python3 -m json.tool || echo "Health check failed"

echo ""
echo "=== Resource Usage ==="
docker stats exprezzzo-app --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}"
EOF

# Make scripts executable
chmod +x /opt/exprezzzo/scripts/restart-app.sh || error_exit "Failed to make restart script executable"
chmod +x /opt/exprezzzo/scripts/app-logs.sh || error_exit "Failed to make logs script executable"
chmod +x /opt/exprezzzo/scripts/app-status.sh || error_exit "Failed to make status script executable"

# Test the application
log "Testing application endpoints..."
curl -f http://localhost:3000/ > /dev/null || error_exit "Application root endpoint test failed"
curl -f http://localhost:3000/health > /dev/null || error_exit "Application health check test failed"
curl -f http://localhost:3000/api/status > /dev/null || error_exit "Application API status test failed"

log "Application deployment completed successfully!"
log "Application URL: http://localhost:3000"
log "Health check: http://localhost:3000/health"
log "API status: http://localhost:3000/api/status"
log "Management scripts:"
log "  - Restart: /opt/exprezzzo/scripts/restart-app.sh"
log "  - Logs: /opt/exprezzzo/scripts/app-logs.sh"
log "  - Status: /opt/exprezzzo/scripts/app-status.sh"