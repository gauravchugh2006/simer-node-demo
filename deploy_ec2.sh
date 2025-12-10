#!/bin/bash
set -e

# Make AWS CLI output clean in Git Bash / Windows
export AWS_PAGER=""
export AWS_DEFAULT_OUTPUT="json"

AWS_REGION="eu-north-1"
INSTANCE_TYPE="t3.micro"
KEY_NAME="simer-node-key"
SECURITY_GROUP_NAME="simer-node-sg"
AMI_ID="ami-0b46816ffa1234887" # Amazon Linux 2023
REPO_URL="https://github.com/gauravchugh2006/simer-node-demo.git"

echo "----- STEP 1: Create / Replace Key Pair -----"

# Clean up any old local PEM file
if [ -f "${KEY_NAME}.pem" ]; then
  chmod +w "${KEY_NAME}.pem" 2>/dev/null || true
  rm -f "${KEY_NAME}.pem"
fi

# Delete old key pair in AWS if it exists
aws ec2 delete-key-pair --key-name "$KEY_NAME" --region "$AWS_REGION" || true

# Create new key pair and save locally
aws ec2 create-key-pair \
  --key-name "$KEY_NAME" \
  --query "KeyMaterial" \
  --output text \
  --region "$AWS_REGION" > "${KEY_NAME}.pem"

chmod 400 "${KEY_NAME}.pem"
echo "Key pair saved: ${KEY_NAME}.pem"


echo "----- STEP 2: Create or Reuse Security Group -----"
set +e
EXISTING_SG_ID=$(aws ec2 describe-security-groups \
  --group-names "$SECURITY_GROUP_NAME" \
  --region "$AWS_REGION" \
  --query "SecurityGroups[0].GroupId" \
  --output text 2>/dev/null)
set -e

if [ "$EXISTING_SG_ID" = "None" ] || [ -z "$EXISTING_SG_ID" ]; then
  SG_ID=$(aws ec2 create-security-group \
    --group-name "$SECURITY_GROUP_NAME" \
    --description "Security group for auto deploy" \
    --region "$AWS_REGION" \
    --query "GroupId" \
    --output text)
  echo "Created new SG: $SG_ID"

  echo "Adding rules..."
  aws ec2 authorize-security-group-ingress \
    --group-id "$SG_ID" \
    --protocol tcp --port 22   --cidr 0.0.0.0/0 --region "$AWS_REGION"

  aws ec2 authorize-security-group-ingress \
    --group-id "$SG_ID" \
    --protocol tcp --port 4000 --cidr 0.0.0.0/0 --region "$AWS_REGION"

  aws ec2 authorize-security-group-ingress \
    --group-id "$SG_ID" \
    --protocol tcp --port 5173 --cidr 0.0.0.0/0 --region "$AWS_REGION"

  aws ec2 authorize-security-group-ingress \
    --group-id "$SG_ID" \
    --protocol tcp --port 3306 --cidr 0.0.0.0/0 --region "$AWS_REGION"

  # NEW: open Jenkins UI port 8080
  aws ec2 authorize-security-group-ingress \
    --group-id "$SG_ID" \
    --protocol tcp --port 8080 --cidr 0.0.0.0/0 --region "$AWS_REGION"
else
  SG_ID="$EXISTING_SG_ID"
  echo "Reusing existing SG: $SG_ID"
fi


echo "----- STEP 3: Launch EC2 Instance (no user-data) -----"
INSTANCE_ID=$(aws ec2 run-instances \
  --image-id "$AMI_ID" \
  --count 1 \
  --instance-type "$INSTANCE_TYPE" \
  --key-name "$KEY_NAME" \
  --security-group-ids "$SG_ID" \
  --region "$AWS_REGION" \
  --query "Instances[0].InstanceId" \
  --output text)

echo "Instance launched: $INSTANCE_ID"


echo "----- STEP 4: Wait for Instance to be Ready -----"
aws ec2 wait instance-status-ok --instance-ids "$INSTANCE_ID" --region "$AWS_REGION"

PUBLIC_IP=""
while [ -z "$PUBLIC_IP" ] || [ "$PUBLIC_IP" = "None" ]; do
  PUBLIC_IP=$(aws ec2 describe-instances \
    --instance-id "$INSTANCE_ID" \
    --region "$AWS_REGION" \
    --query "Reservations[0].Instances[0].PublicIpAddress" \
    --output text 2>/dev/null || true)
  sleep 5
done

echo "Public IP: $PUBLIC_IP"


echo "----- STEP 5: SSH into EC2 and Install + Deploy -----"
ssh -o StrictHostKeyChecking=no -i "${KEY_NAME}.pem" ec2-user@"$PUBLIC_IP" << 'REMOTE'
set -e

echo ">>> [REMOTE] STEP 0: Configure swap to avoid OOM on t3.micro"

# 0. Create 1G swap to avoid OOM on t3.micro
if ! sudo grep -q "/swapfile" /etc/fstab; then
  echo "Creating swapfile..."
  sudo fallocate -l 1G /swapfile || sudo dd if=/dev/zero of=/swapfile bs=1M count=1024
  sudo chmod 600 /swapfile
  sudo mkswap /swapfile
  sudo swapon /swapfile
  echo "/swapfile swap swap defaults 0 0" | sudo tee -a /etc/fstab
else
  echo "Swap already configured, skipping."
  sudo swapon /swapfile || true
fi

free -m

echo ">>> [REMOTE] STEP 1: Update system and install base dependencies (Docker, Git, Node, Java)"

# 1. Update system and install dependencies
sudo dnf update -y
sudo dnf install -y docker git nodejs java-17-amazon-corretto

sudo systemctl enable --now docker
sudo usermod -aG docker ec2-user

echo ">>> [REMOTE] STEP 2: Install Jenkins and start service"

# 2. Install Jenkins repo + Jenkins
sudo wget -O /etc/yum.repos.d/jenkins.repo \
  https://pkg.jenkins.io/redhat-stable/jenkins.repo

sudo rpm --import https://pkg.jenkins.io/redhat-stable/jenkins.io-2023.key

sudo dnf install -y jenkins

# Enable and start Jenkins on port 8080 (default)
sudo systemctl enable --now jenkins

# Allow Jenkins to use Docker (for pipelines that run docker/docker compose)
sudo usermod -aG docker jenkins

# Restart services so new group memberships are applied
sudo systemctl restart docker
sudo systemctl restart jenkins

echo ">>> [REMOTE] STEP 3: Install Docker Compose plugin system-wide"

# 3. Install Docker Compose plugin system-wide
sudo mkdir -p /usr/libexec/docker/cli-plugins
sudo curl -SL https://github.com/docker/compose/releases/download/v2.29.2/docker-compose-linux-x86_64 \
  -o /usr/libexec/docker/cli-plugins/docker-compose
sudo chmod +x /usr/libexec/docker/cli-plugins/docker-compose

echo ">>> [REMOTE] STEP 4: Clone or update GitHub repo"

# 4. Clone or update repo
cd /home/ec2-user
if [ -d "simer-node-demo" ]; then
  cd simer-node-demo
  git pull || true
else
  git clone https://github.com/gauravchugh2006/simer-node-demo.git
  cd simer-node-demo
fi

echo ">>> [REMOTE] STEP 5: Create .env dynamically using instance public IP"

# 5. Create .env dynamically using instance public IP
PUBLIC_IP=$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4)
echo "VITE_API_BASE_URL=http://$PUBLIC_IP:4000" > .env

echo ">>> [REMOTE] STEP 6: Run docker compose (backend + frontend + MySQL)"

# 6. Run docker compose (using sudo so we don't care about group refresh here)
sudo docker compose down || true
sudo docker compose up -d --build

echo ">>> [REMOTE] All remote setup done (Docker, Compose, Jenkins, app)."

REMOTE


echo "----- STEP 6: Deployment URLs -----"
echo "Backend:  http://$PUBLIC_IP:4000"
echo "Frontend: http://$PUBLIC_IP:5173"
echo "Jenkins:  http://$PUBLIC_IP:8080"
echo "SSH: ssh -i ${KEY_NAME}.pem ec2-user@$PUBLIC_IP"

echo "Deployment script completed."
