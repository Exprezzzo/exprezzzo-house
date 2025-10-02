#!/bin/bash

# EXPREZZZO Phase 2 - Deployment Validation Script
# Comprehensive validation of the complete EXPREZZZO deployment

set -e

LOGFILE="/var/log/exprezzzo-validation.log"
VALIDATION_ID="validation-$(date +%Y%m%d_%H%M%S)"
ERRORS=0
WARNINGS=0

log() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') [$VALIDATION_ID] - $1" | tee -a "$LOGFILE"
}

error() {
    log "❌ ERROR: $1"
    ((ERRORS++))
}

warning() {
    log "⚠️  WARNING: $1"
    ((WARNINGS++))
}

success() {
    log "✅ SUCCESS: $1"
}

info() {
    log "ℹ️  INFO: $1"
}

test_command() {
    local cmd="$1"
    local description="$2"
    local timeout="${3:-30}"
    
    info "Testing: $description"
    if timeout "$timeout" bash -c "$cmd" > /dev/null 2>&1; then
        success "$description"
        return 0
    else
        error "$description"
        return 1
    fi
}

test_http_endpoint() {
    local url="$1"
    local description="$2"
    local expected_status="${3:-200}"
    local timeout="${4:-10}"
    
    info "Testing HTTP endpoint: $description ($url)"
    local status_code
    status_code=$(curl -s -o /dev/null -w "%{http_code}" --max-time "$timeout" "$url" 2>/dev/null || echo "000")
    
    if [ "$status_code" = "$expected_status" ]; then
        success "HTTP endpoint $description (Status: $status_code)"
        return 0
    else
        error "HTTP endpoint $description (Expected: $expected_status, Got: $status_code)"
        return 1
    fi
}

check_service_health() {
    local service="$1"
    local health_command="$2"
    local description="$3"
    
    info "Checking service health: $description"
    if eval "$health_command" > /dev/null 2>&1; then
        success "Service health check: $description"
        return 0
    else
        error "Service health check: $description"
        return 1
    fi
}

# Banner
log "================================================================"
log "  EXPREZZZO Phase 2 Deployment Validation"
log "================================================================"
log "Validation ID: $VALIDATION_ID"
log "Hostname: $(hostname)"
log "Timestamp: $(date)"
log "================================================================"

# 1. System Prerequisites Validation
log ""
log "🔍 STEP 1: System Prerequisites Validation"
log "================================================================"

# Check if running as root
if [[ $EUID -eq 0 ]]; then
    success "Running with root privileges"
else
    warning "Not running as root - some checks may fail"
fi

# Check system resources
RAM_MB=$(free -m | awk '/^Mem:/{print $2}')
DISK_GB=$(($(df / | tail -1 | awk '{print $4}') / 1024 / 1024))

info "System resources: ${RAM_MB}MB RAM, ${DISK_GB}GB free disk"
if [ "$RAM_MB" -ge 2048 ]; then
    success "RAM check (${RAM_MB}MB >= 2048MB)"
else
    warning "RAM check (${RAM_MB}MB < 2048MB) - May impact performance"
fi

if [ "$DISK_GB" -ge 5 ]; then
    success "Disk space check (${DISK_GB}GB >= 5GB)"
else
    warning "Disk space check (${DISK_GB}GB < 5GB) - May run out of space"
fi

# Check network connectivity
if ping -c 1 google.com > /dev/null 2>&1; then
    success "Internet connectivity"
else
    warning "Internet connectivity test failed"
fi

# 2. Docker Environment Validation
log ""
log "🐳 STEP 2: Docker Environment Validation"
log "================================================================"

# Check Docker installation
if command -v docker >/dev/null 2>&1; then
    success "Docker is installed ($(docker --version | cut -d' ' -f3 | cut -d',' -f1))"
else
    error "Docker is not installed"
fi

# Check Docker service
if systemctl is-active docker > /dev/null 2>&1; then
    success "Docker service is running"
else
    error "Docker service is not running"
fi

# Check Docker Compose
if command -v docker-compose >/dev/null 2>&1; then
    success "Docker Compose is installed ($(docker-compose --version | cut -d' ' -f3 | cut -d',' -f1))"
else
    error "Docker Compose is not installed"
fi

# Check Docker network
if docker network ls | grep -q exprezzzo-network; then
    success "EXPREZZZO Docker network exists"
else
    error "EXPREZZZO Docker network not found"
fi

# 3. Container Status Validation
log ""
log "📦 STEP 3: Container Status Validation"
log "================================================================"

CONTAINERS=("exprezzzo-postgres" "exprezzzo-redis" "exprezzzo-app" "exprezzzo-nginx")

for container in "${CONTAINERS[@]}"; do
    if docker ps | grep -q "$container"; then
        success "Container $container is running"
        
        # Check container health if health check is available
        health_status=$(docker inspect --format='{{.State.Health.Status}}' "$container" 2>/dev/null || echo "no-health-check")
        if [ "$health_status" = "healthy" ]; then
            success "Container $container is healthy"
        elif [ "$health_status" = "unhealthy" ]; then
            error "Container $container is unhealthy"
        else
            info "Container $container has no health check or status unknown"
        fi
    else
        error "Container $container is not running"
    fi
done

# 4. Service Connectivity Validation
log ""
log "🔌 STEP 4: Service Connectivity Validation"
log "================================================================"

# PostgreSQL connectivity
check_service_health "PostgreSQL" \
    "docker exec exprezzzo-postgres pg_isready -U exprezzzo -d exprezzzo" \
    "PostgreSQL database connectivity"

# Redis connectivity
check_service_health "Redis" \
    "docker exec exprezzzo-redis redis-cli ping | grep -q PONG" \
    "Redis cache connectivity"

# Application internal port
test_command "curl -f http://localhost:3000/health" \
    "Application health endpoint (port 3000)"

# Nginx proxy
test_command "curl -f http://localhost/health" \
    "Nginx proxy health endpoint (port 80)"

# 5. HTTP Endpoint Validation
log ""
log "🌐 STEP 5: HTTP Endpoint Validation"
log "================================================================"

# Test main endpoints
test_http_endpoint "http://localhost/" "Root endpoint" 200
test_http_endpoint "http://localhost/health" "Health check endpoint" 200
test_http_endpoint "http://localhost/api/status" "API status endpoint" 200

# Test 404 handling
test_http_endpoint "http://localhost/nonexistent" "404 error handling" 404

# 6. Database Validation
log ""
log "🗄️  STEP 6: Database Validation"
log "================================================================"

# Test PostgreSQL queries
if docker exec exprezzzo-postgres psql -U exprezzzo -d exprezzzo -c "SELECT version();" > /dev/null 2>&1; then
    success "PostgreSQL query execution"
    
    # Check PostgreSQL version
    PG_VERSION=$(docker exec exprezzzo-postgres psql -U exprezzzo -d exprezzzo -t -c "SHOW server_version;" | head -1 | awk '{print $1}')
    if [[ "$PG_VERSION" == 17* ]]; then
        success "PostgreSQL version 17 confirmed ($PG_VERSION)"
    else
        warning "PostgreSQL version unexpected ($PG_VERSION)"
    fi
    
    # Check database schema
    if docker exec exprezzzo-postgres psql -U exprezzzo -d exprezzzo -c "SELECT COUNT(*) FROM information_schema.schemata WHERE schema_name = 'exprezzzo';" | grep -q "1"; then
        success "EXPREZZZO database schema exists"
    else
        warning "EXPREZZZO database schema not found"
    fi
else
    error "PostgreSQL query execution failed"
fi

# Test Redis operations
if docker exec exprezzzo-redis redis-cli SET test_key "test_value" > /dev/null 2>&1; then
    if docker exec exprezzzo-redis redis-cli GET test_key | grep -q "test_value"; then
        success "Redis read/write operations"
        docker exec exprezzzo-redis redis-cli DEL test_key > /dev/null 2>&1
    else
        error "Redis read operation failed"
    fi
else
    error "Redis write operation failed"
fi

# 7. File System Validation
log ""
log "📁 STEP 7: File System Validation"
log "================================================================"

# Check directory structure
DIRECTORIES=(
    "/opt/exprezzzo/data"
    "/opt/exprezzzo/config"
    "/opt/exprezzzo/logs"
    "/opt/exprezzzo/backups"
    "/opt/exprezzzo/scripts"
    "/opt/exprezzzo/uploads"
    "/opt/exprezzzo/static"
)

for dir in "${DIRECTORIES[@]}"; do
    if [ -d "$dir" ]; then
        success "Directory exists: $dir"
    else
        error "Directory missing: $dir"
    fi
done

# Check configuration files
CONFIG_FILES=(
    "/opt/exprezzzo/config/.env.postgres"
    "/opt/exprezzzo/config/.env.redis"
    "/opt/exprezzzo/config/.env.app"
)

for file in "${CONFIG_FILES[@]}"; do
    if [ -f "$file" ]; then
        success "Configuration file exists: $file"
        # Check file permissions
        if [ "$(stat -c %a "$file")" = "600" ]; then
            success "Configuration file permissions correct: $file"
        else
            warning "Configuration file permissions may be incorrect: $file"
        fi
    else
        error "Configuration file missing: $file"
    fi
done

# 8. Security Validation
log ""
log "🔒 STEP 8: Security Validation"
log "================================================================"

# Check fail2ban
if systemctl is-active fail2ban > /dev/null 2>&1; then
    success "Fail2ban service is running"
else
    warning "Fail2ban service is not running"
fi

# Check unattended upgrades
if [ -f "/etc/apt/apt.conf.d/50unattended-upgrades" ]; then
    success "Unattended upgrades configured"
else
    warning "Unattended upgrades not configured"
fi

# Check SSL configuration if enabled
if [ "${EXPREZZZO_SSL:-false}" = "true" ]; then
    if [ -f "/opt/exprezzzo/config/nginx/ssl/exprezzzo.crt" ] && [ -f "/opt/exprezzzo/config/nginx/ssl/exprezzzo.key" ]; then
        success "SSL certificates found"
        test_http_endpoint "https://localhost/health" "HTTPS health endpoint" 200
    else
        error "SSL certificates not found"
    fi
else
    info "SSL not enabled, skipping HTTPS validation"
fi

# 9. Automation and Monitoring Validation
log ""
log "⚙️  STEP 9: Automation and Monitoring Validation"
log "================================================================"

# Check cron service
if systemctl is-active cron > /dev/null 2>&1; then
    success "Cron service is running"
else
    error "Cron service is not running"
fi

# Check cron jobs
if crontab -l 2>/dev/null | grep -q exprezzzo; then
    success "EXPREZZZO cron jobs configured"
    CRON_COUNT=$(crontab -l 2>/dev/null | grep -c exprezzzo)
    info "Found $CRON_COUNT EXPREZZZO cron jobs"
else
    warning "No EXPREZZZO cron jobs found"
fi

# Check monitoring scripts
MONITORING_SCRIPTS=(
    "/opt/exprezzzo/scripts/monitoring/system-monitor.sh"
    "/opt/exprezzzo/scripts/monitoring/docker-monitor.sh"
    "/opt/exprezzzo/scripts/backup/full-backup.sh"
    "/opt/exprezzzo/scripts/backup/quick-backup.sh"
)

for script in "${MONITORING_SCRIPTS[@]}"; do
    if [ -f "$script" ] && [ -x "$script" ]; then
        success "Monitoring script exists and is executable: $(basename "$script")"
    else
        error "Monitoring script missing or not executable: $script"
    fi
done

# 10. Performance and Load Testing
log ""
log "⚡ STEP 10: Performance and Load Testing"
log "================================================================"

# Simple load test
info "Running basic load test (10 concurrent requests)..."
if command -v curl >/dev/null 2>&1; then
    for i in {1..10}; do
        curl -s http://localhost/health > /dev/null &
    done
    wait
    
    # Check if service is still responsive
    if curl -f -s http://localhost/health > /dev/null; then
        success "Service remains responsive under basic load"
    else
        error "Service failed under basic load"
    fi
else
    warning "curl not available for load testing"
fi

# Check resource usage
info "Current resource usage:"
docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}" | grep exprezzzo | while read line; do
    info "  $line"
done

# 11. Backup and Recovery Validation
log ""
log "💾 STEP 11: Backup and Recovery Validation"
log "================================================================"

# Test backup scripts
if [ -x "/opt/exprezzzo/scripts/backup/quick-backup.sh" ]; then
    info "Testing quick backup script..."
    if /opt/exprezzzo/scripts/backup/quick-backup.sh > /dev/null 2>&1; then
        success "Quick backup script executed successfully"
        
        # Check if backup files were created
        if find /opt/exprezzzo/backups -name "*$(date +%Y%m%d)*" -type f | head -1 > /dev/null 2>&1; then
            success "Backup files created"
        else
            warning "Backup files not found"
        fi
    else
        error "Quick backup script failed"
    fi
else
    error "Quick backup script not found or not executable"
fi

# 12. Integration Testing
log ""
log "🔗 STEP 12: Integration Testing"
log "================================================================"

# Test full request flow
info "Testing complete request flow..."
SESSION_ID=$(curl -s -c /tmp/cookies.txt http://localhost/api/status | jq -r '.timestamp' 2>/dev/null || echo "no-session")
if [ "$SESSION_ID" != "no-session" ] && [ "$SESSION_ID" != "null" ]; then
    success "API request with session handling"
else
    warning "API session handling test inconclusive"
fi

# Test database-to-API flow
info "Testing database-to-API integration..."
DB_STATUS=$(curl -s http://localhost/health | jq -r '.status' 2>/dev/null || echo "unknown")
if [ "$DB_STATUS" = "healthy" ]; then
    success "Database-to-API integration working"
else
    error "Database-to-API integration test failed (status: $DB_STATUS)"
fi

# Final Summary
log ""
log "================================================================"
log "  VALIDATION SUMMARY"
log "================================================================"

if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    log "🎉 VALIDATION PASSED: All checks completed successfully!"
    RESULT="PASS"
elif [ $ERRORS -eq 0 ]; then
    log "⚠️  VALIDATION PASSED WITH WARNINGS: $WARNINGS warning(s) found"
    RESULT="PASS_WITH_WARNINGS"
else
    log "❌ VALIDATION FAILED: $ERRORS error(s) and $WARNINGS warning(s) found"
    RESULT="FAIL"
fi

# Create validation report
REPORT_FILE="/opt/exprezzzo/deployment/validation_report_${VALIDATION_ID}.txt"
cat > "$REPORT_FILE" << EOF
EXPREZZZO Phase 2 Validation Report
===================================

Validation ID: $VALIDATION_ID
Completed: $(date)
Result: $RESULT
Errors: $ERRORS
Warnings: $WARNINGS

System Information:
- Hostname: $(hostname)
- OS: $(lsb_release -d 2>/dev/null | cut -f2 || uname -a)
- RAM: ${RAM_MB}MB
- Free Disk: ${DISK_GB}GB

Docker Information:
- Version: $(docker --version 2>/dev/null | cut -d' ' -f3 | cut -d',' -f1)
- Compose: $(docker-compose --version 2>/dev/null | cut -d' ' -f3 | cut -d',' -f1)

Container Status:
$(docker ps --format "table {{.Names}}\t{{.Status}}" | grep exprezzzo)

Service Endpoints:
- Application: http://localhost:3000/health
- Web Interface: http://localhost/
- API: http://localhost/api/status

Database Status:
- PostgreSQL: $(docker exec exprezzzo-postgres psql -U exprezzzo -d exprezzzo -t -c "SELECT version();" 2>/dev/null | head -1 | awk '{print $1 " " $2}' || echo "Connection failed")
- Redis: $(docker exec exprezzzo-redis redis-cli info server 2>/dev/null | grep redis_version | cut -d: -f2 || echo "Connection failed")

Recommendations:
$([ $ERRORS -gt 0 ] && echo "- Fix all errors before proceeding to production")
$([ $WARNINGS -gt 0 ] && echo "- Review warnings and address if necessary")
$([ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ] && echo "- Deployment is ready for production use")
$([ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ] && echo "- Configure domain DNS if using custom domain")
$([ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ] && echo "- Set up SSL certificates for production")
$([ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ] && echo "- Configure external monitoring and alerting")

Full Log: $LOGFILE
EOF

log "Validation report saved to: $REPORT_FILE"
log "Full validation log: $LOGFILE"
log "================================================================"

# Exit with appropriate code
case $RESULT in
    "PASS")
        exit 0
        ;;
    "PASS_WITH_WARNINGS")
        exit 1
        ;;
    "FAIL")
        exit 2
        ;;
    *)
        exit 3
        ;;
esac