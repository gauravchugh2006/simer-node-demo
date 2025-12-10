#!/bin/bash
set -e
sudo dnf update -y
sudo dnf install -y docker git nodejs
sudo systemctl enable --now docker
sudo usermod -aG docker ec2-user

# Install Docker Compose Plugin
DOCKER_CONFIG=${DOCKER_CONFIG:-$HOME/.docker}
mkdir -p $DOCKER_CONFIG/cli-plugins
curl -SL https://github.com/docker/compose/releases/download/v2.29.2/docker-compose-linux-x86_64   -o $DOCKER_CONFIG/cli-plugins/docker-compose
chmod +x $DOCKER_CONFIG/cli-plugins/docker-compose

# Clone Repo
cd /home/ec2-user
git clone https://github.com/gauravchugh2006/simer-node-demo.git
cd simer-node-demo

# Create .env dynamically
PUBLIC_IP=$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4)
echo "VITE_API_BASE_URL=http://$PUBLIC_IP:4000" > .env

docker compose up -d --build
