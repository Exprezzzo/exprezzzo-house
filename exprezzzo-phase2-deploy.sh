#!/bin/bash

# EXPREZZZO Phase 2 - Master Deployment Script
# Orchestrates the complete EXPREZZZO Phase 2 deployment

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOGFILE="/var/log/exprezzzo-phase2-deploy.log"
DEPLOYMENT_ID="phase2-$(date +%Y%m%d_%H%M%S)"

# Configuration variables
POSTGRES_VERSION="${POSTGRES_VERSION:-17}"
NODE_ENV="${NODE_ENV:-production}"
EXPREZZZO_DOMAIN="${EXPREZZZO_DOMAIN:-localhost}"
EXPREZZZO_SSL="${EXPREZZZO_SSL:-false}"
EXPREZZZO_MONITORING="${EXPREZZZO_MONITORING:-true}"
EXPREZZZO_BACKUP="${EXPREZZZO_BACKUP:-true}"

log() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') [$DEPLOYMENT_ID] - $1" | tee -a "$LOGFILE"
}

error_exit() {
    log "ERROR: $1"
    log "DEPLOYMENT FAILED: $DEPLOYMENT_ID"
    exit 1
}

success() {
    log "SUCCESS: $1"
}

# Banner
log "================================================================"
log "  EXPREZZZO Phase 2 Master Deployment"
log "================================================================"
log "Deployment ID: $DEPLOYMENT_ID"
log "Script Directory: $SCRIPT_DIR"
log "Target Domain: $EXPREZZZO_DOMAIN"
log "SSL Enabled: $EXPREZZZO_SSL"
log "Environment: $NODE_ENV"
log "PostgreSQL Version: $POSTGRES_VERSION"
log "================================================================"

# Check if running as root
if [[ $EUID -ne 0 ]]; then
   error_exit "This script must be run as root. Use: sudo $0"
fi

# Pre-deployment checks
log "Performing pre-deployment checks..."

# Check for required scripts
REQUIRED_SCRIPTS=(
    "01-docker-setup.sh"
    "02-postgres-setup.sh"
    "03-redis-setup.sh"
    "04-app-deploy.sh"
    "05-nginx-config.sh"
    "06-vendor-automation.sh"
    "validate-deployment.sh"
)

for script in "${REQUIRED_SCRIPTS[@]}"; do
    if [ ! -f "$SCRIPT_DIR/$script" ]; then
        error_exit "Required script not found: $script"
    fi
    if [ ! -x "$SCRIPT_DIR/$script" ]; then
        log "Making script executable: $script"
        chmod +x "$SCRIPT_DIR/$script"
    fi
done

# Check system requirements
log "Checking system requirements..."
if [ $(free -m | awk '/^Mem:/{print $2}') -lt 2048 ]; then
    log "WARNING: Less than 2GB RAM detected. EXPREZZZO may not perform optimally."
fi

if [ $(df / | tail -1 | awk '{print $4}') -lt 10485760 ]; then
    error_exit "Insufficient disk space. At least 10GB free space required."
fi

# Check network connectivity
if ! ping -c 1 google.com > /dev/null 2>&1; then
    error_exit "No internet connectivity. Internet access is required for deployment."
fi

# Create deployment state directory
DEPLOYMENT_STATE_DIR="/opt/exprezzzo/deployment"
mkdir -p "$DEPLOYMENT_STATE_DIR"
echo "$DEPLOYMENT_ID" > "$DEPLOYMENT_STATE_DIR/current_deployment_id"

# Export environment variables for child scripts
export POSTGRES_VERSION
export NODE_ENV
export EXPREZZZO_DOMAIN
export EXPREZZZO_SSL
export EXPREZZZO_MONITORING
export EXPREZZZO_BACKUP
export DEPLOYMENT_ID

# Step 1: Docker Setup
log "================================================================"
log "STEP 1/6: Docker Setup"
log "================================================================"
if [ -f "$DEPLOYMENT_STATE_DIR/docker_setup_complete" ]; then
    log "Docker setup already completed, skipping..."
else
    log "Executing: 01-docker-setup.sh"
    if "$SCRIPT_DIR/01-docker-setup.sh"; then
        touch "$DEPLOYMENT_STATE_DIR/docker_setup_complete"
        success "Docker setup completed"
    else
        error_exit "Docker setup failed"
    fi
fi

# Step 2: PostgreSQL Setup
log "================================================================"
log "STEP 2/6: PostgreSQL $POSTGRES_VERSION Setup"
log "================================================================"
if [ -f "$DEPLOYMENT_STATE_DIR/postgres_setup_complete" ]; then
    log "PostgreSQL setup already completed, skipping..."
else
    log "Executing: 02-postgres-setup.sh"
    if "$SCRIPT_DIR/02-postgres-setup.sh"; then
        touch "$DEPLOYMENT_STATE_DIR/postgres_setup_complete"
        success "PostgreSQL setup completed"
    else
        error_exit "PostgreSQL setup failed"
    fi
fi

# Step 3: Redis Setup
log "================================================================"
log "STEP 3/6: Redis Setup"
log "================================================================"
if [ -f "$DEPLOYMENT_STATE_DIR/redis_setup_complete" ]; then
    log "Redis setup already completed, skipping..."
else
    log "Executing: 03-redis-setup.sh"
    if "$SCRIPT_DIR/03-redis-setup.sh"; then
        touch "$DEPLOYMENT_STATE_DIR/redis_setup_complete"
        success "Redis setup completed"
    else
        error_exit "Redis setup failed"
    fi
fi

# Step 4: Application Deployment
log "================================================================"
log "STEP 4/6: Application Deployment"
log "================================================================"
if [ -f "$DEPLOYMENT_STATE_DIR/app_deploy_complete" ]; then
    log "Application deployment already completed, skipping..."
else
    log "Executing: 04-app-deploy.sh"
    if "$SCRIPT_DIR/04-app-deploy.sh"; then
        touch "$DEPLOYMENT_STATE_DIR/app_deploy_complete"
        success "Application deployment completed"
    else
        error_exit "Application deployment failed"
    fi
fi

# Step 5: Nginx Configuration
log "================================================================"
log "STEP 5/6: Nginx Configuration"
log "================================================================"
if [ -f "$DEPLOYMENT_STATE_DIR/nginx_config_complete" ]; then
    log "Nginx configuration already completed, skipping..."
else
    log "Executing: 05-nginx-config.sh"
    if "$SCRIPT_DIR/05-nginx-config.sh"; then
        touch "$DEPLOYMENT_STATE_DIR/nginx_config_complete"
        success "Nginx configuration completed"
    else
        error_exit "Nginx configuration failed"
    fi
fi

# Step 6: Vendor Automation Setup
log "================================================================"
log "STEP 6/6: Vendor Automation Setup"
log "================================================================"
if [ -f "$DEPLOYMENT_STATE_DIR/vendor_automation_complete" ]; then
    log "Vendor automation setup already completed, skipping..."
else
    log "Executing: 06-vendor-automation.sh"
    if "$SCRIPT_DIR/06-vendor-automation.sh"; then
        touch "$DEPLOYMENT_STATE_DIR/vendor_automation_complete"
        success "Vendor automation setup completed"
    else
        error_exit "Vendor automation setup failed"
    fi
fi

# Post-deployment validation
log "================================================================"
log "POST-DEPLOYMENT VALIDATION"
log "================================================================"
log "Executing: validate-deployment.sh"
if "$SCRIPT_DIR/validate-deployment.sh"; then
    success "Deployment validation passed"
else
    error_exit "Deployment validation failed"
fi

# Final setup and configuration
log "================================================================"
log "FINAL CONFIGURATION"
log "================================================================"

# Create deployment summary
SUMMARY_FILE="/opt/exprezzzo/deployment/deployment_summary_${DEPLOYMENT_ID}.txt"
cat > "$SUMMARY_FILE" << EOF
EXPREZZZO Phase 2 Deployment Summary
===================================

Deployment ID: $DEPLOYMENT_ID
Completed: $(date)
Duration: $(($(date +%s) - $(stat -c %Y "$DEPLOYMENT_STATE_DIR/current_deployment_id"))) seconds

Configuration:
- PostgreSQL Version: $POSTGRES_VERSION
- Environment: $NODE_ENV
- Domain: $EXPREZZZO_DOMAIN
- SSL Enabled: $EXPREZZZO_SSL
- Monitoring Enabled: $EXPREZZZO_MONITORING
- Backup Enabled: $EXPREZZZO_BACKUP

Services:
- PostgreSQL: $(docker ps | grep exprezzzo-postgres | awk '{print $7}' | head -1)
- Redis: $(docker ps | grep exprezzzo-redis | awk '{print $7}' | head -1)
- Application: $(docker ps | grep exprezzzo-app | awk '{print $7}' | head -1)
- Nginx: $(docker ps | grep exprezzzo-nginx | awk '{print $7}' | head -1)

Network Endpoints:
- Application (internal): http://localhost:3000
- Web Interface: $([ "$EXPREZZZO_SSL" = "true" ] && echo "https://$EXPREZZZO_DOMAIN" || echo "http://$EXPREZZZO_DOMAIN")
- Health Check: $([ "$EXPREZZZO_SSL" = "true" ] && echo "https://$EXPREZZZO_DOMAIN/health" || echo "http://$EXPREZZZO_DOMAIN/health")
- API Status: $([ "$EXPREZZZO_SSL" = "true" ] && echo "https://$EXPREZZZO_DOMAIN/api/status" || echo "http://$EXPREZZZO_DOMAIN/api/status")

Database:
- Host: localhost:5432
- Database: exprezzzo
- Credentials: /opt/exprezzzo/config/.env.postgres

Cache:
- Redis: localhost:6379
- Credentials: /opt/exprezzzo/config/.env.redis

File Paths:
- Application Data: /opt/exprezzzo/data
- Configuration: /opt/exprezzzo/config
- Logs: /opt/exprezzzo/logs
- Backups: /opt/exprezzzo/backups
- Scripts: /opt/exprezzzo/scripts

Management Commands:
- Application Status: /opt/exprezzzo/scripts/app-status.sh
- Application Logs: /opt/exprezzzo/scripts/app-logs.sh
- Database Backup: /opt/exprezzzo/scripts/backup-postgres.sh
- Redis Monitor: /opt/exprezzzo/scripts/redis-monitor.sh
- System Status: /opt/exprezzzo/scripts/automation-status.sh
- Nginx Status: /opt/exprezzzo/scripts/nginx-status.sh

Security:
- Fail2ban: $(systemctl is-active fail2ban 2>/dev/null || echo "inactive")
- Automatic Updates: $([ -f /etc/apt/apt.conf.d/20auto-upgrades ] && echo "enabled" || echo "disabled")
- SSL/TLS: $([ "$EXPREZZZO_SSL" = "true" ] && echo "enabled" || echo "disabled")

Automation:
- System Monitoring: Every 5 minutes
- Docker Monitoring: Every 15 minutes
- Quick Backups: Every 6 hours
- Full Backups: Daily at 2 AM
- System Maintenance: Weekly (Sunday 3 AM)
- Docker Maintenance: Daily at 4 AM

Next Steps:
1. Test all endpoints using the validation script
2. Configure domain DNS if using a custom domain
3. Set up SSL certificates if using real SSL
4. Configure email alerts in automation scripts
5. Review and customize application configuration
6. Set up monitoring dashboards (optional)
7. Configure external backups (recommended)

Support:
- Logs: tail -f $LOGFILE
- Issues: Check individual component logs in /opt/exprezzzo/logs/
- Status: /opt/exprezzzo/scripts/automation-status.sh

EOF

# Create quick status script
cat > /opt/exprezzzo/scripts/deployment-status.sh << 'EOF'
#!/bin/bash

echo "=== EXPREZZZO Phase 2 Deployment Status ==="
echo "Timestamp: $(date)"
echo ""

# Show deployment info
if [ -f /opt/exprezzzo/deployment/current_deployment_id ]; then
    echo "Current Deployment ID: $(cat /opt/exprezzzo/deployment/current_deployment_id)"
    echo ""
fi

# Container status
echo "=== Container Status ==="
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | grep exprezzzo || echo "No EXPREZZZO containers found"
echo ""

# Service health
echo "=== Service Health ==="
echo -n "Application: "
curl -s -f http://localhost:3000/health > /dev/null && echo "Healthy" || echo "Unhealthy"

echo -n "Web Interface: "
curl -s -f http://localhost/health > /dev/null && echo "Healthy" || echo "Unhealthy"

echo -n "PostgreSQL: "
docker exec exprezzzo-postgres pg_isready -U exprezzzo -d exprezzzo > /dev/null 2>&1 && echo "Healthy" || echo "Unhealthy"

echo -n "Redis: "
docker exec exprezzzo-redis redis-cli ping > /dev/null 2>&1 && echo "Healthy" || echo "Unhealthy"
echo ""

# Resource usage
echo "=== Resource Usage ==="
docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}" | grep exprezzzo || echo "No stats available"
echo ""

# Disk usage
echo "=== Disk Usage ==="
df -h /opt/exprezzzo 2>/dev/null || df -h /
EOF

chmod +x /opt/exprezzzo/scripts/deployment-status.sh

# Mark deployment as complete
touch "$DEPLOYMENT_STATE_DIR/deployment_complete"
echo "$(date)" > "$DEPLOYMENT_STATE_DIR/deployment_completed_at"

# Final success message
log "================================================================"
log "  EXPREZZZO Phase 2 Deployment COMPLETED Successfully!"
log "================================================================"
log "Deployment ID: $DEPLOYMENT_ID"
log "Total Deployment Time: $(($(date +%s) - $(stat -c %Y "$DEPLOYMENT_STATE_DIR/current_deployment_id"))) seconds"
log ""
log "Services Status:"
log "  ✓ Docker: Running"
log "  ✓ PostgreSQL $POSTGRES_VERSION: Running on port 5432"
log "  ✓ Redis: Running on port 6379"
log "  ✓ Application: Running on port 3000"
log "  ✓ Nginx: Running on port 80$([ "$EXPREZZZO_SSL" = "true" ] && echo "/443")"
log "  ✓ Automation: Enabled"
log ""
log "Access Points:"
if [ "$EXPREZZZO_SSL" = "true" ]; then
    log "  🌐 Web Interface: https://$EXPREZZZO_DOMAIN"
    log "  🔍 Health Check: https://$EXPREZZZO_DOMAIN/health"
    log "  🔌 API Status: https://$EXPREZZZO_DOMAIN/api/status"
else
    log "  🌐 Web Interface: http://$EXPREZZZO_DOMAIN"
    log "  🔍 Health Check: http://$EXPREZZZO_DOMAIN/health"
    log "  🔌 API Status: http://$EXPREZZZO_DOMAIN/api/status"
fi
log ""
log "Important Files:"
log "  📋 Deployment Summary: $SUMMARY_FILE"
log "  🔧 Database Config: /opt/exprezzzo/config/.env.postgres"
log "  🔧 Redis Config: /opt/exprezzzo/config/.env.redis"
log "  📊 Status Script: /opt/exprezzzo/scripts/deployment-status.sh"
log "  📝 Master Log: $LOGFILE"
log ""
log "Quick Commands:"
log "  Status: /opt/exprezzzo/scripts/deployment-status.sh"
log "  Validate: $SCRIPT_DIR/validate-deployment.sh"
log "  App Logs: /opt/exprezzzo/scripts/app-logs.sh"
log "  Backup Now: /opt/exprezzzo/scripts/backup/full-backup.sh"
log ""
log "================================================================"
log "🎉 EXPREZZZO Phase 2 is now ready for use!"
log "================================================================"

# Run a final status check
log ""
log "Running final status check..."
/opt/exprezzzo/scripts/deployment-status.sh >> "$LOGFILE" 2>&1

# Send completion notification if configured
if [ -f /opt/exprezzzo/scripts/send-alert.sh ]; then
    /opt/exprezzzo/scripts/send-alert.sh "EXPREZZZO Phase 2 Deployment Complete" "Deployment ID: $DEPLOYMENT_ID completed successfully on $(hostname). Access: $([ "$EXPREZZZO_SSL" = "true" ] && echo "https://$EXPREZZZO_DOMAIN" || echo "http://$EXPREZZZO_DOMAIN")"
fi

log "Master deployment script completed successfully!"
exit 0