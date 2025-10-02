#!/bin/bash

# EXPREZZZO Phase 2 - Nginx Configuration Script
# Sets up Nginx as reverse proxy and static file server for EXPREZZZO

set -e

LOGFILE="/var/log/exprezzzo-nginx-config.log"
DOMAIN="${EXPREZZZO_DOMAIN:-localhost}"
SSL_ENABLED="${EXPREZZZO_SSL:-false}"

log() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" | tee -a "$LOGFILE"
}

error_exit() {
    log "ERROR: $1"
    exit 1
}

log "Starting EXPREZZZO Nginx configuration..."

# Check if running as root
if [[ $EUID -ne 0 ]]; then
   error_exit "This script must be run as root"
fi

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    error_exit "Docker is not running. Please ensure Docker is installed and running"
fi

# Check if application is running
if ! docker ps | grep -q exprezzzo-app; then
    error_exit "Application container is not running. Please run 04-app-deploy.sh first"
fi

# Create Nginx directories
log "Creating Nginx directories..."
mkdir -p /opt/exprezzzo/config/nginx/{conf.d,ssl,logs} || error_exit "Failed to create Nginx directories"
mkdir -p /opt/exprezzzo/static/{css,js,images,uploads} || error_exit "Failed to create static directories"

# Create main Nginx configuration
log "Creating Nginx configuration..."
cat > /opt/exprezzzo/config/nginx/nginx.conf << 'EOF'
user nginx;
worker_processes auto;
error_log /var/log/nginx/error.log notice;
pid /var/run/nginx.pid;

# Load dynamic modules
include /usr/share/nginx/modules/*.conf;

events {
    worker_connections 1024;
    use epoll;
    multi_accept on;
}

http {
    # Basic Settings
    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent" "$http_x_forwarded_for" '
                    'rt=$request_time uct="$upstream_connect_time" '
                    'uht="$upstream_header_time" urt="$upstream_response_time"';

    access_log /var/log/nginx/access.log main;
    error_log /var/log/nginx/error.log warn;

    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 4096;
    server_tokens off;

    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    # Gzip Compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types
        text/plain
        text/css
        text/xml
        text/javascript
        application/json
        application/javascript
        application/xml+rss
        application/atom+xml
        image/svg+xml;

    # Rate Limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req_zone $binary_remote_addr zone=login:10m rate=1r/s;
    limit_conn_zone $binary_remote_addr zone=conn_limit_per_ip:10m;

    # Proxy Settings
    proxy_cache_path /var/cache/nginx/proxy levels=1:2 keys_zone=proxy_cache:10m 
                     max_size=500m inactive=60m use_temp_path=off;
    
    proxy_set_header Host $http_host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header X-NginX-Proxy true;
    
    proxy_redirect off;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_cache_bypass $http_upgrade;
    proxy_connect_timeout 5s;
    proxy_send_timeout 60s;
    proxy_read_timeout 60s;

    # Security Headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;

    # File Upload Settings
    client_max_body_size 100M;
    client_body_buffer_size 128k;
    client_header_buffer_size 3m;
    large_client_header_buffers 4 256k;

    # Include server configurations
    include /etc/nginx/conf.d/*.conf;
}
EOF

# Create EXPREZZZO server configuration
log "Creating EXPREZZZO server configuration..."
if [ "$SSL_ENABLED" = "true" ]; then
    # HTTPS configuration
    cat > /opt/exprezzzo/config/nginx/conf.d/exprezzzo.conf << EOF
# EXPREZZZO Phase 2 - HTTPS Configuration
server {
    listen 80;
    server_name ${DOMAIN};
    return 301 https://\$server_name\$request_uri;
}

server {
    listen 443 ssl http2;
    server_name ${DOMAIN};

    # SSL Configuration
    ssl_certificate /etc/nginx/ssl/exprezzzo.crt;
    ssl_certificate_key /etc/nginx/ssl/exprezzzo.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    ssl_stapling on;
    ssl_stapling_verify on;

    # Security headers for HTTPS
    add_header Strict-Transport-Security "max-age=63072000" always;

    # Root and index
    root /usr/share/nginx/html;
    index index.html index.htm;

    # Rate limiting
    limit_req zone=api burst=20 nodelay;
    limit_conn conn_limit_per_ip 20;

    # Static files
    location /static/ {
        alias /var/www/static/;
        expires 30d;
        add_header Cache-Control "public, no-transform";
        access_log off;
    }

    # File uploads
    location /uploads/ {
        alias /var/www/uploads/;
        expires 1d;
        add_header Cache-Control "public, no-transform";
    }

    # API endpoints with stricter rate limiting
    location /api/ {
        limit_req zone=api burst=5 nodelay;
        proxy_pass http://exprezzzo-app:3000;
        proxy_cache proxy_cache;
        proxy_cache_valid 200 302 10m;
        proxy_cache_valid 404 1m;
    }

    # Authentication endpoints with very strict rate limiting
    location ~ ^/(login|register|forgot-password) {
        limit_req zone=login burst=3 nodelay;
        proxy_pass http://exprezzzo-app:3000;
    }

    # Health check endpoint (no caching)
    location /health {
        proxy_pass http://exprezzzo-app:3000;
        proxy_cache off;
        access_log off;
    }

    # Main application
    location / {
        proxy_pass http://exprezzzo-app:3000;
        proxy_cache proxy_cache;
        proxy_cache_valid 200 302 5m;
        proxy_cache_valid 404 1m;
    }

    # Error pages
    error_page 404 /404.html;
    error_page 500 502 503 504 /50x.html;
    location = /50x.html {
        root /usr/share/nginx/html;
    }
}
EOF
else
    # HTTP configuration
    cat > /opt/exprezzzo/config/nginx/conf.d/exprezzzo.conf << EOF
# EXPREZZZO Phase 2 - HTTP Configuration
server {
    listen 80;
    server_name ${DOMAIN};

    # Root and index
    root /usr/share/nginx/html;
    index index.html index.htm;

    # Rate limiting
    limit_req zone=api burst=20 nodelay;
    limit_conn conn_limit_per_ip 20;

    # Static files
    location /static/ {
        alias /var/www/static/;
        expires 30d;
        add_header Cache-Control "public, no-transform";
        access_log off;
    }

    # File uploads
    location /uploads/ {
        alias /var/www/uploads/;
        expires 1d;
        add_header Cache-Control "public, no-transform";
    }

    # API endpoints with stricter rate limiting
    location /api/ {
        limit_req zone=api burst=5 nodelay;
        proxy_pass http://exprezzzo-app:3000;
        proxy_cache proxy_cache;
        proxy_cache_valid 200 302 10m;
        proxy_cache_valid 404 1m;
    }

    # Authentication endpoints with very strict rate limiting
    location ~ ^/(login|register|forgot-password) {
        limit_req zone=login burst=3 nodelay;
        proxy_pass http://exprezzzo-app:3000;
    }

    # Health check endpoint (no caching)
    location /health {
        proxy_pass http://exprezzzo-app:3000;
        proxy_cache off;
        access_log off;
    }

    # Main application
    location / {
        proxy_pass http://exprezzzo-app:3000;
        proxy_cache proxy_cache;
        proxy_cache_valid 200 302 5m;
        proxy_cache_valid 404 1m;
    }

    # Error pages
    error_page 404 /404.html;
    error_page 500 502 503 504 /50x.html;
    location = /50x.html {
        root /usr/share/nginx/html;
    }
}
EOF
fi

# Create default error pages
log "Creating error pages..."
mkdir -p /opt/exprezzzo/static/html
cat > /opt/exprezzzo/static/html/50x.html << 'EOF'
<!DOCTYPE html>
<html>
<head>
    <title>EXPREZZZO - Service Unavailable</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            text-align: center;
            padding: 50px;
            background-color: #f5f5f5;
        }
        .error-container {
            max-width: 500px;
            margin: 0 auto;
            background: white;
            padding: 40px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        h1 { color: #e74c3c; }
        p { color: #7f8c8d; }
    </style>
</head>
<body>
    <div class="error-container">
        <h1>Service Temporarily Unavailable</h1>
        <p>EXPREZZZO is currently undergoing maintenance. Please try again in a few moments.</p>
        <p><a href="/">Return to Home</a></p>
    </div>
</body>
</html>
EOF

cat > /opt/exprezzzo/static/html/404.html << 'EOF'
<!DOCTYPE html>
<html>
<head>
    <title>EXPREZZZO - Page Not Found</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            text-align: center;
            padding: 50px;
            background-color: #f5f5f5;
        }
        .error-container {
            max-width: 500px;
            margin: 0 auto;
            background: white;
            padding: 40px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        h1 { color: #3498db; }
        p { color: #7f8c8d; }
    </style>
</head>
<body>
    <div class="error-container">
        <h1>Page Not Found</h1>
        <p>The requested page could not be found on EXPREZZZO.</p>
        <p><a href="/">Return to Home</a></p>
    </div>
</body>
</html>
EOF

# Generate self-signed SSL certificate if SSL is enabled
if [ "$SSL_ENABLED" = "true" ]; then
    log "Generating self-signed SSL certificate..."
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
        -keyout /opt/exprezzzo/config/nginx/ssl/exprezzzo.key \
        -out /opt/exprezzzo/config/nginx/ssl/exprezzzo.crt \
        -subj "/C=US/ST=State/L=City/O=EXPREZZZO/OU=IT/CN=${DOMAIN}" || error_exit "Failed to generate SSL certificate"
    
    chmod 600 /opt/exprezzzo/config/nginx/ssl/exprezzzo.key
    chmod 644 /opt/exprezzzo/config/nginx/ssl/exprezzzo.crt
fi

# Create Docker Compose file for Nginx
log "Creating Nginx Docker Compose configuration..."
if [ "$SSL_ENABLED" = "true" ]; then
    NGINX_PORTS="- \"80:80\"\n      - \"443:443\""
    SSL_VOLUME="- /opt/exprezzzo/config/nginx/ssl:/etc/nginx/ssl:ro"
else
    NGINX_PORTS="- \"80:80\""
    SSL_VOLUME=""
fi

cat > /opt/exprezzzo/config/nginx/docker-compose.yml << EOF
version: '3.8'

services:
  nginx:
    image: nginx:alpine
    container_name: exprezzzo-nginx
    restart: unless-stopped
    ports:
      ${NGINX_PORTS}
    volumes:
      - /opt/exprezzzo/config/nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - /opt/exprezzzo/config/nginx/conf.d:/etc/nginx/conf.d:ro
      - /opt/exprezzzo/static:/var/www/static:ro
      - /opt/exprezzzo/uploads:/var/www/uploads:ro
      - /opt/exprezzzo/static/html:/usr/share/nginx/html:ro
      - /opt/exprezzzo/logs/nginx:/var/log/nginx
      ${SSL_VOLUME}
    networks:
      - exprezzzo-network
    depends_on:
      - exprezzzo-app
    healthcheck:
      test: ["CMD", "nginx", "-t"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 30s

networks:
  exprezzzo-network:
    external: true
EOF

# Start Nginx container
log "Starting Nginx container..."
cd /opt/exprezzzo/config/nginx
docker-compose up -d || error_exit "Failed to start Nginx container"

# Wait for Nginx to be ready
log "Waiting for Nginx to be ready..."
for i in {1..30}; do
    if curl -f http://localhost/health > /dev/null 2>&1; then
        log "Nginx is ready!"
        break
    fi
    if [ $i -eq 30 ]; then
        error_exit "Nginx failed to start within 150 seconds"
    fi
    log "Waiting for Nginx... ($i/30)"
    sleep 5
done

# Create Nginx management scripts
log "Creating Nginx management scripts..."

# Nginx reload script
cat > /opt/exprezzzo/scripts/reload-nginx.sh << 'EOF'
#!/bin/bash
echo "Testing Nginx configuration..."
docker exec exprezzzo-nginx nginx -t
if [ $? -eq 0 ]; then
    echo "Configuration is valid. Reloading Nginx..."
    docker exec exprezzzo-nginx nginx -s reload
    echo "Nginx reloaded successfully"
else
    echo "Configuration test failed. Not reloading."
    exit 1
fi
EOF

# Nginx logs script
cat > /opt/exprezzzo/scripts/nginx-logs.sh << 'EOF'
#!/bin/bash
case "$1" in
    access)
        if [ "$2" = "follow" ] || [ "$2" = "-f" ]; then
            tail -f /opt/exprezzzo/logs/nginx/access.log
        else
            tail -100 /opt/exprezzzo/logs/nginx/access.log
        fi
        ;;
    error)
        if [ "$2" = "follow" ] || [ "$2" = "-f" ]; then
            tail -f /opt/exprezzzo/logs/nginx/error.log
        else
            tail -100 /opt/exprezzzo/logs/nginx/error.log
        fi
        ;;
    *)
        echo "Usage: $0 {access|error} [follow|-f]"
        echo "Examples:"
        echo "  $0 access          - Show last 100 access log entries"
        echo "  $0 access follow   - Follow access log"
        echo "  $0 error           - Show last 100 error log entries"
        echo "  $0 error follow    - Follow error log"
        ;;
esac
EOF

# Nginx status script
cat > /opt/exprezzzo/scripts/nginx-status.sh << 'EOF'
#!/bin/bash
echo "=== EXPREZZZO Nginx Status ==="
echo "Timestamp: $(date)"
echo ""

echo "=== Container Status ==="
docker ps --filter name=exprezzzo-nginx --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

echo ""
echo "=== Configuration Test ==="
docker exec exprezzzo-nginx nginx -t

echo ""
echo "=== Active Connections ==="
curl -s http://localhost/nginx_status 2>/dev/null || echo "Status page not configured"

echo ""
echo "=== Recent Access Log (Last 10 entries) ==="
tail -10 /opt/exprezzzo/logs/nginx/access.log 2>/dev/null || echo "No access log found"

echo ""
echo "=== Recent Error Log (Last 5 entries) ==="
tail -5 /opt/exprezzzo/logs/nginx/error.log 2>/dev/null || echo "No error log found"
EOF

# Make scripts executable
chmod +x /opt/exprezzzo/scripts/reload-nginx.sh || error_exit "Failed to make reload script executable"
chmod +x /opt/exprezzzo/scripts/nginx-logs.sh || error_exit "Failed to make logs script executable"
chmod +x /opt/exprezzzo/scripts/nginx-status.sh || error_exit "Failed to make status script executable"

# Create log rotation configuration
log "Creating log rotation configuration..."
cat > /etc/logrotate.d/exprezzzo-nginx << 'EOF'
/opt/exprezzzo/logs/nginx/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    copytruncate
    postrotate
        docker exec exprezzzo-nginx nginx -s reopen
    endscript
}
EOF

# Test the full setup
log "Testing full setup..."
if [ "$SSL_ENABLED" = "true" ]; then
    curl -k -f https://localhost/health > /dev/null || error_exit "HTTPS health check failed"
    log "HTTPS setup verified"
else
    curl -f http://localhost/health > /dev/null || error_exit "HTTP health check failed"
    log "HTTP setup verified"
fi

curl -f http://localhost/api/status > /dev/null || error_exit "API proxy test failed"
log "API proxy verified"

log "Nginx configuration completed successfully!"
log "Domain: ${DOMAIN}"
if [ "$SSL_ENABLED" = "true" ]; then
    log "HTTPS URL: https://${DOMAIN}"
    log "HTTP redirects to HTTPS"
else
    log "HTTP URL: http://${DOMAIN}"
fi
log "Management scripts:"
log "  - Reload: /opt/exprezzzo/scripts/reload-nginx.sh"
log "  - Logs: /opt/exprezzzo/scripts/nginx-logs.sh"
log "  - Status: /opt/exprezzzo/scripts/nginx-status.sh"