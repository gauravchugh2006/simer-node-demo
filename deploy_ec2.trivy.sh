#!/bin/bash
set -e
# Load optional infra defaults
if [ -f infra.env ]; then
  echo "Loading infra.env..."
  # export all variables defined in infra.env
  set -a
  . infra.env
  set +a
fi

############################################################
# CONFIG
############################################################
AWS_REGION="${AWS_REGION:-eu-north-1}"
INSTANCE_TYPE="${INSTANCE_TYPE:-t3.micro}"
KEY_NAME="${KEY_NAME:-simer-node-key}"
SECURITY_GROUP_NAME="${SECURITY_GROUP_NAME:-simer-node-sg}"
AMI_ID="ami-0b46816ffa1234887"  # Amazon Linux 2023 (eu-north-1)
REPO_URL="https://github.com/gauravchugh2006/simer-node-demo.git"
ROOT_VOLUME_SIZE_GB="${ROOT_VOLUME_SIZE_GB:-20}"             # GiB for / (was 8G earlier)

############################################################
# STEP 1 – Create / Recreate Key Pair
############################################################
echo "----- STEP 1: Create Key Pair -----"

# Delete existing key pair in AWS and locally (if any)
set +e
aws ec2 delete-key-pair \
  --key-name "$KEY_NAME" \
  --region "$AWS_REGION" >/dev/null 2>&1 || true

# Remove local key file if exists
if [ -f "${KEY_NAME}.pem" ]; then
  rm -f "${KEY_NAME}.pem"
fi
set -e

# Create fresh key pair
aws ec2 create-key-pair \
  --key-name "$KEY_NAME" \
  --query "KeyMaterial" \
  --output text \
  --region "$AWS_REGION" > "${KEY_NAME}.pem"

chmod 400 "${KEY_NAME}.pem"
echo "Key pair saved: ${KEY_NAME}.pem"

############################################################
# STEP 2 – Create Security Group + Rules
############################################################
echo "----- STEP 2: Create or Reuse Security Group -----"
set +e
# Delete old SG with same name if it exists
EXISTING_SG_ID=$(aws ec2 describe-security-groups \
  --region "$AWS_REGION" \
  --filters "Name=group-name,Values=$SECURITY_GROUP_NAME" \
  --query "SecurityGroups[0].GroupId" \
  --output text 2>/dev/null || true)
set -e 

if [ "$EXISTING_SG_ID" != "None" ] && [ -n "$EXISTING_SG_ID" ]; then
  echo "Found old security group $EXISTING_SG_ID, deleting..."
  aws ec2 delete-security-group \
    --group-id "$EXISTING_SG_ID" \
    --region "$AWS_REGION" || true
fi

SG_ID=$(aws ec2 create-security-group \
  --group-name "$SECURITY_GROUP_NAME" \
  --description "Security group for simer-node-demo auto deploy" \
  --region "$AWS_REGION" \
  --query "GroupId" \
  --output text)

echo "Created SG: $SG_ID"
echo "Adding ingress rules (22, 4000, 5173, 3306, 8080)..."

# SSH
aws ec2 authorize-security-group-ingress \
  --group-id "$SG_ID" \
  --protocol tcp --port 22 --cidr 0.0.0.0/0 \
  --region "$AWS_REGION"

# Backend API
aws ec2 authorize-security-group-ingress \
  --group-id "$SG_ID" \
  --protocol tcp --port 4000 --cidr 0.0.0.0/0 \
  --region "$AWS_REGION"

# Frontend Vite dev server
aws ec2 authorize-security-group-ingress \
  --group-id "$SG_ID" \
  --protocol tcp --port 5173 --cidr 0.0.0.0/0 \
  --region "$AWS_REGION"

# Jenkins
aws ec2 authorize-security-group-ingress \
  --group-id "$SG_ID" \
  --protocol tcp --port 8080 --cidr 0.0.0.0/0 \
  --region "$AWS_REGION"

# (Optional) MySQL external – keep only if needed
aws ec2 authorize-security-group-ingress \
  --group-id "$SG_ID" \
  --protocol tcp --port 3306 --cidr 0.0.0.0/0 \
  --region "$AWS_REGION"

echo "Security group rules added."

############################################################
# STEP 3 – Create EC2 User-Data (Bootstrap Script)
############################################################
echo "----- STEP 3: Create EC2 Bootstrap Script -----"
###############---- START NEW SCRIPT ----###############
echo "----- STEP 3: Launch EC2 Instance -----"

INSTANCE_ID=$(aws ec2 run-instances \
  --image-id "$AMI_ID" \
  --instance-type "$INSTANCE_TYPE" \
  --key-name "$KEY_NAME" \
  --security-group-ids "$SG_ID" \
  --count 1 \
  --region "$AWS_REGION" \
  --tag-specifications "ResourceType=instance,Tags=[{Key=Name,Value=simer-node-demo}]" \
  --query "Instances[0].InstanceId" \
  --output text)

echo "Instance launched: $INSTANCE_ID"

echo
echo "----- STEP 4: Wait for EC2 Public IP -----"

aws ec2 wait instance-running \
  --instance-ids "$INSTANCE_ID" \
  --region "$AWS_REGION"

PUBLIC_IP=$(aws ec2 describe-instances \
  --instance-ids "$INSTANCE_ID" \
  --region "$AWS_REGION" \
  --query "Reservations[0].Instances[0].PublicIpAddress" \
  --output text)

echo "Public IP: $PUBLIC_IP"

echo
echo "----- STEP 5: Remote bootstrap (Docker + Jenkins + app) -----"
echo "This will install packages, clone the repo, and run docker compose up -d"

# Give the OS a few seconds more to finish cloud-init
sleep 20

ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null \
  -i "${KEY_NAME}.pem" ec2-user@"$PUBLIC_IP" << 'REMOTE'
set -euo pipefail

echo "[REMOTE] Updating system packages + installing basics..."
sudo dnf update -y

#######################################################
# 1. Install core tools: Docker, Git, Node, Java, npm
#######################################################
echo "[BOOTSTRAP] Installing Docker, Git, Node.js, npm, Java 17..."
sudo dnf install -y git docker nodejs npm java-17-amazon-corretto

echo "[REMOTE] Enabling and starting Docker..."
sudo systemctl enable docker
sudo systemctl start docker

#######################################################
# 2. Install Docker Compose plugin (system-wide)
#######################################################
echo "echo "[BOOTSTRAP] Installing Docker Compose CLI plugin..."
sudo mkdir -p /usr/libexec/docker/cli-plugins
sudo curl -fsSL "https://github.com/docker/compose/releases/download/v2.29.7/docker-compose-linux-x86_64" -o /usr/libexec/docker/cli-plugins/docker-compose
sudo chmod +x /usr/libexec/docker/cli-plugins/docker-compose
docker compose version || true

echo "[BOOTSTRAP] Installing Trivy (vulnerability scanner)..."
TRIVY_VERSION="0.55.2"
TMP_TRIVY="/tmp/trivy_${TRIVY_VERSION}_Linux-64bit.tar.gz"
curl -fsSL "https://github.com/aquasecurity/trivy/releases/download/v${TRIVY_VERSION}/trivy_${TRIVY_VERSION}_Linux-64bit.tar.gz" -o "$TMP_TRIVY"
tar -xzf "$TMP_TRIVY" -C /tmp trivy
sudo install -m 0755 /tmp/trivy /usr/local/bin/trivy
rm -f "$TMP_TRIVY" /tmp/trivy
trivy --version || true

echo "[BOOTSTRAP] Pre-downloading Trivy vulnerability DB (speeds up first scan)..."
# This is best-effort; do not fail bootstrap if Aqua's DB endpoint is slow/unavailable.
trivy --download-db-only --no-progress || true


#######################################################
# 3. Create a 1 GiB swap file (for t3.micro stability)
#######################################################
echo "[BOOTSTRAP] Creating 1G swap file..."
fallocate -l 1G /swapfile || dd if=/dev/zero of=/swapfile bs=1M count=1024
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile
grep -q "/swapfile" /etc/fstab || echo '/swapfile swap swap defaults 0 0' >> /etc/fstab

echo "[REMOTE] Adding ec2-user to docker group..."
if ! groups ec2-user | grep -q docker; then
  sudo usermod -aG docker ec2-user
fi

#######################################################
# 4. Install Jenkins
#######################################################
echo "[REMOTE] Installing Jenkins..."
sudo curl -fsSL https://pkg.jenkins.io/redhat-stable/jenkins.io-2023.key -o /etc/pki/rpm-gpg/RPM-GPG-KEY-jenkins
sudo tee /etc/yum.repos.d/jenkins.repo >/dev/null <<EOFJ
[jenkins]
name=Jenkins-stable
baseurl=https://pkg.jenkins.io/redhat-stable/
gpgcheck=1
gpgkey=file:///etc/pki/rpm-gpg/RPM-GPG-KEY-jenkins
EOFJ

sudo dnf install -y jenkins
sudo systemctl enable jenkins
sudo systemctl start jenkins
echo "[REMOTE] Adding 'jenkins' user to 'docker' group..."
# Allow Jenkins user to talk to Docker
sudo usermod -aG docker jenkins || true
# Restart Docker & Jenkins to ensure group changes apply
sudo systemctl restart docker
sudo systemctl restart jenkins
#######################################################
# 5. Clone repo & run docker-compose
#######################################################
echo "[REMOTE] Cloning application repository..."
if [ -d "/home/ec2-user/simer-node-demo" ]; then
  rm -rf /home/ec2-user/simer-node-demo
fi
sudo -u ec2-user git clone https://github.com/gauravchugh2006/simer-node-demo.git /home/ec2-user/simer-node-demo

cd /home/ec2-user/simer-node-demo
# Get public IP using IMDSv2
echo "[BOOTSTRAP] Fetching public IP from instance metadata (IMDSv2)..."
# ------------------------------
# 6. Generate .env using IMDSv2 Public IP
# ------------------------------
echo "[REMOTE] Detecting public IP from instance metadata..."
META_TOKEN=$(curl -s -X PUT "http://169.254.169.254/latest/api/token" \
  -H "X-aws-ec2-metadata-token-ttl-seconds: 21600" || true)
PUBLIC_IP=$(curl -s -H "X-aws-ec2-metadata-token: $META_TOKEN" \
  http://169.254.169.254/latest/meta-data/public-ipv4 || true)

echo "[REMOTE] PUBLIC_IP = $PUBLIC_IP"

BACKEND_PORT=4000
FRONTEND_PORT=5173
# Create .env for backend CORS first and then Vite frontend
echo "[REMOTE] Writing backend/.env..."
cat > backend/.env <<EOF
NODE_ENV=production
PORT=$BACKEND_PORT
DB_HOST=mysql
DB_USER=root
DB_PASSWORD=secret
DB_NAME=cafe_coffee_day
ALLOWED_ORIGINS=http://localhost:$FRONTEND_PORT,http://$PUBLIC_IP:$FRONTEND_PORT
EOF

echo "[REMOTE] Writing frontend/.env (Vite)..."
cat > frontend/.env <<EOF
VITE_API_BASE_URL=http://$PUBLIC_IP:$BACKEND_PORT
EOF

echo "[REMOTE] Docker compose up -d (project: simer-node-demo)..."
sudo docker compose -f docker-compose.yml -p simer-node-demo down -v --remove-orphans || true
sudo docker compose -f docker-compose.yml -p simer-node-demo up -d --build

echo "[REMOTE] Current containers:"
sudo docker ps --format "table {{.Names}}\t{{.Image}}\t{{.Ports}}"

echo "[REMOTE] Health check: backend..."
curl -fsS "http://localhost:$BACKEND_PORT" || echo "!! Backend not responding on localhost:$BACKEND_PORT"

echo "[REMOTE] Health check: frontend..."
curl -fsS "http://localhost:$FRONTEND_PORT" || echo "!! Frontend not responding on localhost:$FRONTEND_PORT"

echo "[REMOTE] NOTE: From SSH session, use 'sudo docker ps' (not plain 'docker ps')."
REMOTE

echo
############################################################
# STEP 6 – Show URLs (App + Jenkins)
############################################################
echo "----- STEP 6: Deployment URLs -----"
echo "Backend:  http://${PUBLIC_IP}:4000"
echo "Frontend: http://${PUBLIC_IP}:5173"
echo "Jenkins:  http://${PUBLIC_IP}:8080"
echo "SSH: ssh -i ${KEY_NAME}.pem ec2-user@${PUBLIC_IP}"
############################################################
# STEP 7 – Try to Fetch Jenkins Initial Admin Password
############################################################
echo
echo "----- STEP 7: Try to fetch Jenkins initial admin password (convenience) -----"
echo "Waiting ~60s for Jenkins to finish bootstrapping..."
# Give Jenkins some time to start
sleep 60
for attempt in {1..10}; do
  echo "Attempt ${attempt}/10: reading /var/lib/jenkins/secrets/initialAdminPassword..."
  if ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null \
       -i "${KEY_NAME}.pem" ec2-user@"${PUBLIC_IP}" \
       "sudo cat /var/lib/jenkins/secrets/initialAdminPassword" 2>/dev/null; then
    echo
    echo "✅ Jenkins initial admin password above."
    echo "Use this on: http://${PUBLIC_IP}:8080"
    break
  else
    echo "Password not ready yet, waiting 15s..."
    sleep 15
  fi
done

echo "Deployment script completed."
############################################################
