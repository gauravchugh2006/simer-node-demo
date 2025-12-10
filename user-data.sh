#!/bin/bash
set -e

# ------------------------------
# 0. Create 1 GB Swapfile (for t3.micro stability)
# ------------------------------
fallocate -l 1G /swapfile || dd if=/dev/zero of=/swapfile bs=1M count=1024
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile
echo '/swapfile swap swap defaults 0 0' | tee -a /etc/fstab

# ------------------------------
# 1. Update System Packages
# ------------------------------
dnf update -y

# ------------------------------
# 2. Install Docker, Git, Node.js
# ------------------------------
dnf install -y docker git nodejs

systemctl enable --now docker
usermod -aG docker ec2-user

# ------------------------------
# 3. Install Docker Compose Plugin (system-wide)
# ------------------------------
mkdir -p /usr/libexec/docker/cli-plugins
curl -SL https://github.com/docker/compose/releases/download/v2.29.2/docker-compose-linux-x86_64   -o /usr/libexec/docker/cli-plugins/docker-compose
chmod +x /usr/libexec/docker/cli-plugins/docker-compose

# ------------------------------
# 4. Install Java 17 and Jenkins
# ------------------------------
dnf install -y java-17-amazon-corretto

wget -O /etc/yum.repos.d/jenkins.repo   https://pkg.jenkins.io/redhat-stable/jenkins.repo
rpm --import https://pkg.jenkins.io/redhat-stable/jenkins.io-2023.key

dnf install -y jenkins

# Add Jenkins user to docker group
usermod -aG docker jenkins

# Enable and start Jenkins
systemctl enable jenkins
systemctl start jenkins

# Restart Docker & Jenkins to ensure group changes apply
systemctl restart docker
systemctl restart jenkins

# ------------------------------
# 5. Clone GitHub Repo
# ------------------------------
cd /home/ec2-user
if [ ! -d "simer-node-demo" ]; then
  git clone https://github.com/gauravchugh2006/simer-node-demo.git
fi
chown -R ec2-user:ec2-user /home/ec2-user/simer-node-demo
cd /home/ec2-user/simer-node-demo

# ------------------------------
# 6. Generate .env using IMDSv2 Public IP
# ------------------------------
TOKEN=$(curl -s -X PUT "http://169.254.169.254/latest/api/token"   -H "X-aws-ec2-metadata-token-ttl-seconds: 21600" || true)

if [ -n "$TOKEN" ]; then
  PUBLIC_IP=$(curl -s -H "X-aws-ec2-metadata-token: $TOKEN"     http://169.254.169.254/latest/meta-data/public-ipv4 || true)
else
  PUBLIC_IP=$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4 || true)
fi

if [ -z "$PUBLIC_IP" ]; then
  PUBLIC_IP="localhost"
fi

echo "VITE_API_BASE_URL=http://$PUBLIC_IP:4000" > .env

# ------------------------------
# 7. Run docker compose
# ------------------------------
docker compose down || true
docker compose up -d --build

# Ensure final ownership
chown -R ec2-user:ec2-user /home/ec2-user/simer-node-demo
