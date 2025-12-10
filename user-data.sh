#!/bin/bash
set -e

# Small delay to let networking + repos settle
sleep 15

# Update & install base packages
dnf update -y
dnf install -y docker git nodejs

systemctl enable --now docker
usermod -aG docker ec2-user

# Install Docker Compose plugin system-wide
mkdir -p /usr/libexec/docker/cli-plugins
curl -SL https://github.com/docker/compose/releases/download/v2.29.2/docker-compose-linux-x86_64   -o /usr/libexec/docker/cli-plugins/docker-compose
chmod +x /usr/libexec/docker/cli-plugins/docker-compose

# Clone or update repo
cd /home/ec2-user
if [ -d "simer-node-demo" ]; then
  cd simer-node-demo
  git pull || true
else
  git clone https://github.com/gauravchugh2006/simer-node-demo.git
  cd simer-node-demo
fi

# Create .env dynamically using instance public IP
PUBLIC_IP=$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4)
echo "VITE_API_BASE_URL=http://$PUBLIC_IP:4000" > .env

# Run docker compose (as root; user group changes apply after next login)
docker compose down || true
docker compose up -d --build

# Fix ownership for ec2-user
chown -R ec2-user:ec2-user /home/ec2-user/simer-node-demo

