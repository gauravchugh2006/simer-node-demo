#!/bin/bash
set -e
# Log everything to a file for debugging
exec > /var/log/user-data.log 2>&1

# Hard-code repo URL here (no dependency on outside env)
REPO_URL="https://github.com/gauravchugh2006/simer-node-demo.git"

echo "[BOOTSTRAP] Updating system packages..."
dnf update -y

#######################################################
# 1. Install core tools: Docker, Git, Node, Java, npm
#######################################################
echo "[BOOTSTRAP] Installing Docker, Git, Node.js, npm, Java 17..."
dnf install -y docker git nodejs npm java-17-amazon-corretto

echo "[BOOTSTRAP] Enabling and starting Docker..."
systemctl enable --now docker

#######################################################
# 2. Install Docker Compose plugin (system-wide)
#######################################################
echo "[BOOTSTRAP] Installing Docker Compose CLI plugin..."
mkdir -p /usr/libexec/docker/cli-plugins
curl -SL https://github.com/docker/compose/releases/download/v2.29.2/docker-compose-linux-x86_64 \
  -o /usr/libexec/docker/cli-plugins/docker-compose
chmod +x /usr/libexec/docker/cli-plugins/docker-compose

#######################################################
# 3. Create a 1 GiB swap file (for t3.micro stability)
#######################################################
echo "[BOOTSTRAP] Creating 1G swap file..."
fallocate -l 1G /swapfile || dd if=/dev/zero of=/swapfile bs=1M count=1024
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile
grep -q "/swapfile" /etc/fstab || echo '/swapfile swap swap defaults 0 0' >> /etc/fstab

#######################################################
# 4. Install Jenkins
#######################################################
echo "[BOOTSTRAP] Installing Jenkins..."
wget -O /etc/yum.repos.d/jenkins.repo \
  https://pkg.jenkins.io/redhat-stable/jenkins.repo
rpm --import https://pkg.jenkins.io/redhat-stable/jenkins.io-2023.key
dnf install -y jenkins

# Jenkins needs Java 17 (already installed), enable service
echo "[BOOTSTRAP] Enabling and starting Jenkins..."
systemctl enable jenkins
systemctl start jenkins

# Allow Jenkins user to talk to Docker
echo "[BOOTSTRAP] Adding 'jenkins' user to 'docker' group..."
usermod -aG docker jenkins || true
# Restart Docker & Jenkins to ensure group changes apply
systemctl restart docker
systemctl restart jenkins

#######################################################
# 5. Clone repo & run docker-compose
#######################################################
echo "[BOOTSTRAP] Cloning application repository..."
cd /home/ec2-user
if [ ! -d "simer-node-demo" ]; then
  git clone "$REPO_URL"
fi
cd simer-node-demo
chown -R ec2-user:ec2-user /home/ec2-user/simer-node-demo

# Get public IP using IMDSv2
echo "[BOOTSTRAP] Fetching public IP from instance metadata (IMDSv2)..."
# ------------------------------
# 6. Generate .env using IMDSv2 Public IP
# ------------------------------
TOKEN=$(curl -s -X PUT "http://169.254.169.254/latest/api/token" \
  -H "X-aws-ec2-metadata-token-ttl-seconds: 21600" || true)

if [ -n "$TOKEN" ]; then
  PUBLIC_IP=$(curl -s -H "X-aws-ec2-metadata-token: $TOKEN" \
    http://169.254.169.254/latest/meta-data/public-ipv4 || true)
else
  PUBLIC_IP=$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4 || true)
fi

if [ -z "$PUBLIC_IP" ] || [ "$PUBLIC_IP" = "None" ]; then
  PUBLIC_IP="localhost"
fi

echo "[BOOTSTRAP] Detected public IP: $PUBLIC_IP"

# Create .env for Vite frontend
echo "[BOOTSTRAP] Writing .env for frontend..."
cat > .env <<EOT
VITE_API_BASE_URL=http://$PUBLIC_IP:4000
EOT

echo "[BOOTSTRAP] Running docker compose up -d --build..."
/usr/libexec/docker/cli-plugins/docker-compose version || docker compose version || true
docker compose down || true
docker compose up -d --build

#######################################################
# 6. Disk cleanup like you did manually
#######################################################
echo "[BOOTSTRAP] Cleaning Docker, dnf and npm caches to free disk..."
docker system prune -a -f --volumes || true
dnf clean all || true
rm -rf /var/cache/dnf || true
npm cache clean --force || true

echo "[BOOTSTRAP] User-data bootstrap finished."
