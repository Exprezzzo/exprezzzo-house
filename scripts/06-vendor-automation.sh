#!/bin/bash

# EXPREZZZO Phase 2 - Vendor Automation Script
# Sets up monitoring, backup automation, and maintenance tasks

set -e

LOGFILE="/var/log/exprezzzo-vendor-automation.log"
MONITORING_ENABLED="${EXPREZZZO_MONITORING:-true}"
BACKUP_ENABLED="${EXPREZZZO_BACKUP:-true}"

log() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" | tee -a "$LOGFILE"
}

error_exit() {
    log "ERROR: $1"
    exit 1
}

log "Starting EXPREZZZO vendor automation setup..."

# Check if running as root
if [[ $EUID -ne 0 ]]; then
   error_exit "This script must be run as root"
fi

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    error_exit "Docker is not running. Please ensure Docker is installed and running"
fi

# Create automation directories
log "Creating automation directories..."
mkdir -p /opt/exprezzzo/{automation,monitoring,backups,maintenance,alerts} || error_exit "Failed to create automation directories"
mkdir -p /opt/exprezzzo/scripts/{backup,monitoring,maintenance} || error_exit "Failed to create script directories"

# Install required packages for monitoring and automation
log "Installing required packages..."
apt-get update || error_exit "Failed to update package list"
apt-get install -y \
    htop \
    iotop \
    ncdu \
    jq \
    curl \
    wget \
    cron \
    logrotate \
    fail2ban \
    unattended-upgrades \
    apt-listchanges \
    mailutils || error_exit "Failed to install required packages"

# Set up system monitoring
if [ "$MONITORING_ENABLED" = "true" ]; then
    log "Setting up system monitoring..."
    
    # Create system monitoring script
    cat > /opt/exprezzzo/scripts/monitoring/system-monitor.sh << 'EOF'
#!/bin/bash

ALERT_EMAIL="${EXPREZZZO_ALERT_EMAIL:-admin@localhost}"
LOG_FILE="/opt/exprezzzo/logs/system-monitor.log"
ALERT_FILE="/opt/exprezzzo/alerts/system-alerts.log"

log_alert() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - ALERT: $1" | tee -a "$ALERT_FILE"
    echo "$1" | mail -s "EXPREZZZO Alert: $(hostname)" "$ALERT_EMAIL" 2>/dev/null || true
}

log_info() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - INFO: $1" >> "$LOG_FILE"
}

# Check disk space
check_disk_space() {
    local usage=$(df / | tail -1 | awk '{print $5}' | sed 's/%//')
    if [ "$usage" -gt 90 ]; then
        log_alert "Disk space critical: ${usage}% used on root filesystem"
    elif [ "$usage" -gt 80 ]; then
        log_alert "Disk space warning: ${usage}% used on root filesystem"
    fi
    log_info "Disk usage: ${usage}%"
}

# Check memory usage
check_memory() {
    local mem_usage=$(free | grep Mem | awk '{printf "%.2f", $3/$2 * 100.0}')
    local mem_usage_int=${mem_usage%.*}
    if [ "$mem_usage_int" -gt 90 ]; then
        log_alert "Memory usage critical: ${mem_usage}%"
    elif [ "$mem_usage_int" -gt 80 ]; then
        log_alert "Memory usage warning: ${mem_usage}%"
    fi
    log_info "Memory usage: ${mem_usage}%"
}

# Check CPU load
check_cpu_load() {
    local load=$(uptime | awk -F'load average:' '{print $2}' | awk '{print $1}' | sed 's/,//')
    local cpu_cores=$(nproc)
    local load_percentage=$(echo "$load $cpu_cores" | awk '{printf "%.2f", ($1/$2)*100}')
    local load_percentage_int=${load_percentage%.*}
    
    if [ "$load_percentage_int" -gt 90 ]; then
        log_alert "CPU load critical: ${load_percentage}% (load: $load, cores: $cpu_cores)"
    elif [ "$load_percentage_int" -gt 80 ]; then
        log_alert "CPU load warning: ${load_percentage}% (load: $load, cores: $cpu_cores)"
    fi
    log_info "CPU load: ${load_percentage}% (load: $load)"
}

# Check Docker containers
check_docker_containers() {
    local containers=("exprezzzo-postgres" "exprezzzo-redis" "exprezzzo-app" "exprezzzo-nginx")
    for container in "${containers[@]}"; do
        if ! docker ps | grep -q "$container"; then
            log_alert "Container $container is not running"
        else
            local status=$(docker inspect --format='{{.State.Health.Status}}' "$container" 2>/dev/null || echo "unknown")
            if [ "$status" = "unhealthy" ]; then
                log_alert "Container $container is unhealthy"
            fi
            log_info "Container $container: running ($status)"
        fi
    done
}

# Check service endpoints
check_service_endpoints() {
    # Check application health
    if ! curl -f -s http://localhost:3000/health > /dev/null; then
        log_alert "Application health check failed"
    else
        log_info "Application health check: OK"
    fi
    
    # Check Nginx
    if ! curl -f -s http://localhost/health > /dev/null; then
        log_alert "Nginx proxy health check failed"
    else
        log_info "Nginx proxy health check: OK"
    fi
    
    # Check PostgreSQL
    if ! docker exec exprezzzo-postgres pg_isready -U exprezzzo -d exprezzzo > /dev/null 2>&1; then
        log_alert "PostgreSQL health check failed"
    else
        log_info "PostgreSQL health check: OK"
    fi
    
    # Check Redis
    if ! docker exec exprezzzo-redis redis-cli ping > /dev/null 2>&1; then
        log_alert "Redis health check failed"
    else
        log_info "Redis health check: OK"
    fi
}

# Main monitoring function
main() {
    log_info "Starting system monitoring check"
    check_disk_space
    check_memory
    check_cpu_load
    check_docker_containers
    check_service_endpoints
    log_info "System monitoring check completed"
}

main "$@"
EOF

    chmod +x /opt/exprezzzo/scripts/monitoring/system-monitor.sh
    
    # Create Docker monitoring script
    cat > /opt/exprezzzo/scripts/monitoring/docker-monitor.sh << 'EOF'
#!/bin/bash

LOG_FILE="/opt/exprezzzo/logs/docker-monitor.log"

log_info() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" >> "$LOG_FILE"
}

# Generate Docker system report
echo "=== EXPREZZZO Docker System Report ===" > "$LOG_FILE"
echo "Generated: $(date)" >> "$LOG_FILE"
echo "" >> "$LOG_FILE"

# System info
echo "=== System Information ===" >> "$LOG_FILE"
docker system df >> "$LOG_FILE" 2>&1
echo "" >> "$LOG_FILE"

# Container status
echo "=== Container Status ===" >> "$LOG_FILE"
docker ps -a --format "table {{.Names}}\t{{.Status}}\t{{.RunningFor}}\t{{.Size}}" >> "$LOG_FILE" 2>&1
echo "" >> "$LOG_FILE"

# Container resource usage
echo "=== Container Resource Usage ===" >> "$LOG_FILE"
docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}\t{{.BlockIO}}" >> "$LOG_FILE" 2>&1
echo "" >> "$LOG_FILE"

# Container logs summary
echo "=== Container Logs Summary ===" >> "$LOG_FILE"
for container in exprezzzo-postgres exprezzzo-redis exprezzzo-app exprezzzo-nginx; do
    if docker ps | grep -q "$container"; then
        echo "--- $container logs (last 5 lines) ---" >> "$LOG_FILE"
        docker logs "$container" --tail 5 >> "$LOG_FILE" 2>&1
        echo "" >> "$LOG_FILE"
    fi
done

# Network information
echo "=== Network Information ===" >> "$LOG_FILE"
docker network ls >> "$LOG_FILE" 2>&1
echo "" >> "$LOG_FILE"

# Volume information
echo "=== Volume Information ===" >> "$LOG_FILE"
docker volume ls >> "$LOG_FILE" 2>&1
echo "" >> "$LOG_FILE"

log_info "Docker monitoring report generated"
EOF

    chmod +x /opt/exprezzzo/scripts/monitoring/docker-monitor.sh
fi

# Set up automated backups
if [ "$BACKUP_ENABLED" = "true" ]; then
    log "Setting up automated backup system..."
    
    # Create comprehensive backup script
    cat > /opt/exprezzzo/scripts/backup/full-backup.sh << 'EOF'
#!/bin/bash

BACKUP_DIR="/opt/exprezzzo/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
LOG_FILE="/opt/exprezzzo/logs/backup.log"
RETENTION_DAYS=7

log_info() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" | tee -a "$LOG_FILE"
}

log_info "Starting full backup process..."

# Create backup directories
mkdir -p "$BACKUP_DIR"/{postgres,redis,configs,logs,uploads,scripts}

# Backup PostgreSQL
log_info "Backing up PostgreSQL..."
if docker ps | grep -q exprezzzo-postgres; then
    docker exec exprezzzo-postgres pg_dump -U exprezzzo -d exprezzzo --verbose --clean --if-exists | gzip > "$BACKUP_DIR/postgres/exprezzzo_${TIMESTAMP}.sql.gz"
    log_info "PostgreSQL backup completed"
else
    log_info "WARNING: PostgreSQL container not running, skipping database backup"
fi

# Backup Redis
log_info "Backing up Redis..."
if docker ps | grep -q exprezzzo-redis; then
    docker exec exprezzzo-redis redis-cli BGSAVE
    sleep 5  # Wait for background save to complete
    docker cp exprezzzo-redis:/data/dump.rdb "$BACKUP_DIR/redis/redis_${TIMESTAMP}.rdb"
    gzip "$BACKUP_DIR/redis/redis_${TIMESTAMP}.rdb"
    log_info "Redis backup completed"
else
    log_info "WARNING: Redis container not running, skipping Redis backup"
fi

# Backup configurations
log_info "Backing up configurations..."
tar -czf "$BACKUP_DIR/configs/configs_${TIMESTAMP}.tar.gz" -C /opt/exprezzzo config/ || true

# Backup uploads
log_info "Backing up uploads..."
if [ -d "/opt/exprezzzo/uploads" ] && [ "$(ls -A /opt/exprezzzo/uploads 2>/dev/null)" ]; then
    tar -czf "$BACKUP_DIR/uploads/uploads_${TIMESTAMP}.tar.gz" -C /opt/exprezzzo uploads/ || true
fi

# Backup scripts
log_info "Backing up scripts..."
tar -czf "$BACKUP_DIR/scripts/scripts_${TIMESTAMP}.tar.gz" -C /opt/exprezzzo scripts/ || true

# Backup logs (last 7 days)
log_info "Backing up recent logs..."
find /opt/exprezzzo/logs -name "*.log" -mtime -7 -print0 | tar -czf "$BACKUP_DIR/logs/logs_${TIMESTAMP}.tar.gz" --null -T - || true

# Create backup manifest
log_info "Creating backup manifest..."
cat > "$BACKUP_DIR/manifest_${TIMESTAMP}.txt" << MANIFEST
EXPREZZZO Full Backup Manifest
Created: $(date)
Backup ID: $TIMESTAMP

Files included:
$(find "$BACKUP_DIR" -name "*_${TIMESTAMP}.*" -type f -exec basename {} \; | sort)

System information:
Hostname: $(hostname)
OS: $(lsb_release -d | cut -f2)
Docker version: $(docker --version)
Disk usage: $(df -h /)

Backup sizes:
$(find "$BACKUP_DIR" -name "*_${TIMESTAMP}.*" -type f -exec ls -lh {} \; | awk '{print $5, $9}')
MANIFEST

# Clean up old backups
log_info "Cleaning up old backups..."
find "$BACKUP_DIR" -name "*_*.sql.gz" -mtime +$RETENTION_DAYS -delete
find "$BACKUP_DIR" -name "*_*.rdb.gz" -mtime +$RETENTION_DAYS -delete
find "$BACKUP_DIR" -name "*_*.tar.gz" -mtime +$RETENTION_DAYS -delete
find "$BACKUP_DIR" -name "manifest_*.txt" -mtime +$RETENTION_DAYS -delete

log_info "Full backup process completed: $TIMESTAMP"
EOF

    chmod +x /opt/exprezzzo/scripts/backup/full-backup.sh
    
    # Create quick backup script
    cat > /opt/exprezzzo/scripts/backup/quick-backup.sh << 'EOF'
#!/bin/bash

BACKUP_DIR="/opt/exprezzzo/backups/quick"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
LOG_FILE="/opt/exprezzzo/logs/backup.log"

log_info() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" | tee -a "$LOG_FILE"
}

mkdir -p "$BACKUP_DIR"

log_info "Starting quick backup..."

# Quick database backup
if docker ps | grep -q exprezzzo-postgres; then
    docker exec exprezzzo-postgres pg_dump -U exprezzzo -d exprezzzo | gzip > "$BACKUP_DIR/quick_db_${TIMESTAMP}.sql.gz"
fi

# Quick config backup
tar -czf "$BACKUP_DIR/quick_config_${TIMESTAMP}.tar.gz" -C /opt/exprezzzo config/ 2>/dev/null || true

log_info "Quick backup completed: $TIMESTAMP"
EOF

    chmod +x /opt/exprezzzo/scripts/backup/quick-backup.sh
fi

# Set up maintenance automation
log "Setting up maintenance automation..."

# Create system maintenance script
cat > /opt/exprezzzo/scripts/maintenance/system-maintenance.sh << 'EOF'
#!/bin/bash

LOG_FILE="/opt/exprezzzo/logs/maintenance.log"

log_info() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" | tee -a "$LOG_FILE"
}

log_info "Starting system maintenance..."

# Update package lists
log_info "Updating package lists..."
apt-get update || log_info "Failed to update package lists"

# Clean up system
log_info "Cleaning up system..."
apt-get autoremove -y || log_info "Failed to autoremove packages"
apt-get autoclean || log_info "Failed to autoclean packages"

# Clean up Docker
log_info "Cleaning up Docker..."
docker system prune -f --volumes || log_info "Failed to prune Docker system"

# Clean up old log files
log_info "Cleaning up old log files..."
find /opt/exprezzzo/logs -name "*.log" -mtime +30 -delete || log_info "Failed to clean old logs"
find /var/log -name "*.log.*" -mtime +30 -delete 2>/dev/null || true

# Check disk space after cleanup
log_info "Disk space after cleanup:"
df -h / | tail -1 | awk '{print "Used: " $3 " Available: " $4 " Usage: " $5}' >> "$LOG_FILE"

log_info "System maintenance completed"
EOF

chmod +x /opt/exprezzzo/scripts/maintenance/system-maintenance.sh

# Create Docker maintenance script
cat > /opt/exprezzzo/scripts/maintenance/docker-maintenance.sh << 'EOF'
#!/bin/bash

LOG_FILE="/opt/exprezzzo/logs/docker-maintenance.log"

log_info() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" | tee -a "$LOG_FILE"
}

log_info "Starting Docker maintenance..."

# Check container health and restart if needed
containers=("exprezzzo-postgres" "exprezzzo-redis" "exprezzzo-app" "exprezzzo-nginx")
for container in "${containers[@]}"; do
    if docker ps | grep -q "$container"; then
        health=$(docker inspect --format='{{.State.Health.Status}}' "$container" 2>/dev/null || echo "no-health-check")
        if [ "$health" = "unhealthy" ]; then
            log_info "Restarting unhealthy container: $container"
            docker restart "$container"
        else
            log_info "Container $container is healthy"
        fi
    else
        log_info "WARNING: Container $container is not running"
    fi
done

# Update Docker images (if newer versions are available)
log_info "Checking for Docker image updates..."
docker-compose -f /opt/exprezzzo/config/postgres/docker-compose.yml pull || true
docker-compose -f /opt/exprezzzo/config/redis/docker-compose.yml pull || true
docker-compose -f /opt/exprezzzo/config/nginx/docker-compose.yml pull || true

# Clean up Docker resources
log_info "Cleaning up Docker resources..."
docker system prune -f
docker volume prune -f

log_info "Docker maintenance completed"
EOF

chmod +x /opt/exprezzzo/scripts/maintenance/docker-maintenance.sh

# Set up security automation
log "Setting up security automation..."

# Configure fail2ban for additional security
cat > /etc/fail2ban/jail.local << 'EOF'
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 5
backend = systemd

[sshd]
enabled = true
port = ssh
logpath = %(sshd_log)s

[nginx-http-auth]
enabled = true
port = http,https
logpath = /opt/exprezzzo/logs/nginx/error.log

[nginx-limit-req]
enabled = true
port = http,https
logpath = /opt/exprezzzo/logs/nginx/error.log
maxretry = 10
EOF

# Configure unattended upgrades for security updates
cat > /etc/apt/apt.conf.d/50unattended-upgrades << 'EOF'
Unattended-Upgrade::Allowed-Origins {
    "${distro_id}:${distro_codename}-security";
    "${distro_id}ESMApps:${distro_codename}-apps-security";
    "${distro_id}ESM:${distro_codename}-infra-security";
};

Unattended-Upgrade::AutoFixInterruptedDpkg "true";
Unattended-Upgrade::MinimalSteps "true";
Unattended-Upgrade::Remove-Unused-Dependencies "true";
Unattended-Upgrade::Automatic-Reboot "false";
EOF

# Enable automatic security updates
cat > /etc/apt/apt.conf.d/20auto-upgrades << 'EOF'
APT::Periodic::Update-Package-Lists "1";
APT::Periodic::Unattended-Upgrade "1";
APT::Periodic::AutocleanInterval "7";
EOF

# Set up cron jobs for automation
log "Setting up cron jobs..."

# Create crontab entries
cat > /tmp/exprezzzo-cron << 'EOF'
# EXPREZZZO Phase 2 Automation Jobs

# System monitoring every 5 minutes
*/5 * * * * /opt/exprezzzo/scripts/monitoring/system-monitor.sh

# Docker monitoring every 15 minutes
*/15 * * * * /opt/exprezzzo/scripts/monitoring/docker-monitor.sh

# Quick backup every 6 hours
0 */6 * * * /opt/exprezzzo/scripts/backup/quick-backup.sh

# Full backup daily at 2 AM
0 2 * * * /opt/exprezzzo/scripts/backup/full-backup.sh

# System maintenance weekly (Sunday at 3 AM)
0 3 * * 0 /opt/exprezzzo/scripts/maintenance/system-maintenance.sh

# Docker maintenance daily at 4 AM
0 4 * * * /opt/exprezzzo/scripts/maintenance/docker-maintenance.sh

# Log rotation daily
0 1 * * * /usr/sbin/logrotate /etc/logrotate.conf
EOF

# Install cron jobs
crontab /tmp/exprezzzo-cron
rm /tmp/exprezzzo-cron

# Start and enable services
log "Starting and enabling services..."
systemctl enable cron || error_exit "Failed to enable cron service"
systemctl start cron || error_exit "Failed to start cron service"
systemctl enable fail2ban || error_exit "Failed to enable fail2ban service"
systemctl start fail2ban || error_exit "Failed to start fail2ban service"

# Create status and control scripts
log "Creating vendor automation control scripts..."

# Status script
cat > /opt/exprezzzo/scripts/automation-status.sh << 'EOF'
#!/bin/bash

echo "=== EXPREZZZO Automation Status ==="
echo "Timestamp: $(date)"
echo ""

echo "=== Service Status ==="
echo "Cron: $(systemctl is-active cron)"
echo "Fail2ban: $(systemctl is-active fail2ban)"
echo ""

echo "=== Cron Jobs ==="
crontab -l | grep -E "exprezzzo|EXPREZZZO" || echo "No EXPREZZZO cron jobs found"
echo ""

echo "=== Recent Backup Files ==="
find /opt/exprezzzo/backups -type f -mtime -1 -ls 2>/dev/null | head -10 || echo "No recent backups found"
echo ""

echo "=== Disk Usage ==="
df -h /opt/exprezzzo
echo ""

echo "=== Recent Alerts ==="
tail -5 /opt/exprezzzo/alerts/system-alerts.log 2>/dev/null || echo "No recent alerts"
EOF

# Control script
cat > /opt/exprezzzo/scripts/automation-control.sh << 'EOF'
#!/bin/bash

case "$1" in
    start)
        systemctl start cron fail2ban
        echo "Automation services started"
        ;;
    stop)
        systemctl stop cron fail2ban
        echo "Automation services stopped"
        ;;
    restart)
        systemctl restart cron fail2ban
        echo "Automation services restarted"
        ;;
    status)
        /opt/exprezzzo/scripts/automation-status.sh
        ;;
    test-backup)
        echo "Running test backup..."
        /opt/exprezzzo/scripts/backup/quick-backup.sh
        ;;
    test-monitor)
        echo "Running test monitoring..."
        /opt/exprezzzo/scripts/monitoring/system-monitor.sh
        ;;
    *)
        echo "Usage: $0 {start|stop|restart|status|test-backup|test-monitor}"
        exit 1
        ;;
esac
EOF

# Make control scripts executable
chmod +x /opt/exprezzzo/scripts/automation-status.sh
chmod +x /opt/exprezzzo/scripts/automation-control.sh

# Create alert notification script
cat > /opt/exprezzzo/scripts/send-alert.sh << 'EOF'
#!/bin/bash

ALERT_EMAIL="${EXPREZZZO_ALERT_EMAIL:-admin@localhost}"
ALERT_WEBHOOK="${EXPREZZZO_ALERT_WEBHOOK:-}"
SUBJECT="$1"
MESSAGE="$2"

# Send email alert
if [ -n "$ALERT_EMAIL" ]; then
    echo "$MESSAGE" | mail -s "$SUBJECT" "$ALERT_EMAIL" 2>/dev/null || true
fi

# Send webhook alert
if [ -n "$ALERT_WEBHOOK" ]; then
    curl -X POST "$ALERT_WEBHOOK" \
         -H "Content-Type: application/json" \
         -d "{\"subject\":\"$SUBJECT\",\"message\":\"$MESSAGE\",\"hostname\":\"$(hostname)\",\"timestamp\":\"$(date -Iseconds)\"}" \
         2>/dev/null || true
fi

# Log alert
echo "$(date '+%Y-%m-%d %H:%M:%S') - ALERT SENT: $SUBJECT" >> /opt/exprezzzo/alerts/sent-alerts.log
EOF

chmod +x /opt/exprezzzo/scripts/send-alert.sh

# Test the automation setup
log "Testing automation setup..."
/opt/exprezzzo/scripts/automation-control.sh test-monitor || log "WARNING: Monitor test failed"
/opt/exprezzzo/scripts/automation-control.sh test-backup || log "WARNING: Backup test failed"

log "Vendor automation setup completed successfully!"
log "Automation features enabled:"
log "  - System monitoring (every 5 minutes)"
log "  - Docker monitoring (every 15 minutes)"
log "  - Quick backups (every 6 hours)"
log "  - Full backups (daily at 2 AM)"
log "  - System maintenance (weekly)"
log "  - Docker maintenance (daily)"
log "  - Security monitoring (fail2ban)"
log "  - Automatic security updates"
log ""
log "Control scripts:"
log "  - Status: /opt/exprezzzo/scripts/automation-status.sh"
log "  - Control: /opt/exprezzzo/scripts/automation-control.sh"
log "  - Send alerts: /opt/exprezzzo/scripts/send-alert.sh"