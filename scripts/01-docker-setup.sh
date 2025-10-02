#!/bin/bash

# EXPREZZZO Phase 2 - Docker Setup Script
# Sets up Docker and Docker Compose for the deployment environment

set -e

LOGFILE="/var/log/exprezzzo-docker-setup.log"

log() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" | tee -a "$LOGFILE"
}

error_exit() {
    log "ERROR: $1"
    exit 1
}

log "Starting EXPREZZZO Docker setup..."

# Check if running as root
if [[ $EUID -ne 0 ]]; then
   error_exit "This script must be run as root"
fi

# Update system packages
log "Updating system packages..."
apt-get update || error_exit "Failed to update package list"

# Install required packages
log "Installing required packages..."
apt-get install -y \
    apt-transport-https \
    ca-certificates \
    curl \
    gnupg \
    lsb-release \
    software-properties-common || error_exit "Failed to install required packages"

# Add Docker's official GPG key
log "Adding Docker GPG key..."
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg || error_exit "Failed to add Docker GPG key"

# Add Docker repository
log "Adding Docker repository..."
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null || error_exit "Failed to add Docker repository"

# Update package list again
log "Updating package list with Docker repository..."
apt-get update || error_exit "Failed to update package list after adding Docker repository"

# Install Docker
log "Installing Docker..."
apt-get install -y docker-ce docker-ce-cli containerd.io || error_exit "Failed to install Docker"

# Install Docker Compose
log "Installing Docker Compose..."
curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose || error_exit "Failed to download Docker Compose"
chmod +x /usr/local/bin/docker-compose || error_exit "Failed to make Docker Compose executable"

# Create docker group and add current user (if not root)
if [ "$SUDO_USER" ]; then
    log "Adding user $SUDO_USER to docker group..."
    usermod -aG docker "$SUDO_USER" || log "WARNING: Failed to add user to docker group"
fi

# Enable and start Docker service
log "Enabling and starting Docker service..."
systemctl enable docker || error_exit "Failed to enable Docker service"
systemctl start docker || error_exit "Failed to start Docker service"

# Verify Docker installation
log "Verifying Docker installation..."
docker --version || error_exit "Docker installation verification failed"
docker-compose --version || error_exit "Docker Compose installation verification failed"

# Create Docker network for EXPREZZZO
log "Creating EXPREZZZO Docker network..."
docker network create exprezzzo-network 2>/dev/null || log "Network exprezzzo-network already exists or failed to create"

# Configure Docker daemon for production
log "Configuring Docker daemon..."
cat > /etc/docker/daemon.json << EOF
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  },
  "storage-driver": "overlay2"
}
EOF

# Restart Docker to apply configuration
log "Restarting Docker service..."
systemctl restart docker || error_exit "Failed to restart Docker service"

# Create directories for EXPREZZZO deployment
log "Creating EXPREZZZO directories..."
mkdir -p /opt/exprezzzo/{data,logs,config,backups} || error_exit "Failed to create EXPREZZZO directories"
chmod 755 /opt/exprezzzo || error_exit "Failed to set permissions on EXPREZZZO directory"

log "Docker setup completed successfully!"
log "Please log out and back in if you were added to the docker group"