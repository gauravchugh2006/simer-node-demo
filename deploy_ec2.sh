#!/bin/bash
set -e

############################################################
# CONFIG
############################################################
AWS_REGION="eu-north-1"
INSTANCE_TYPE="t3.micro"
KEY_NAME="simer-node-key"
SECURITY_GROUP_NAME="simer-node-sg"
AMI_ID="ami-0b46816ffa1234887"  # Amazon Linux 2023 (eu-north-1)
REPO_URL="https://github.com/gauravchugh2006/simer-node-demo.git"
ROOT_VOLUME_SIZE=20             # GiB for / (was 8G earlier)

############################################################
# STEP 1 – Create / Recreate Key Pair
############################################################
echo "----- STEP 1: Create Key Pair -----"

# Delete existing key pair in AWS (if any)
aws ec2 delete-key-pair \
  --key-name "$KEY_NAME" \
  --region "$AWS_REGION" >/dev/null 2>&1 || true

# Remove local key file if exists
if [ -f "${KEY_NAME}.pem" ]; then
  rm -f "${KEY_NAME}.pem"
fi

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
echo "----- STEP 2: Create Security Group -----"

# Delete old SG with same name if it exists
EXISTING_SG_ID=$(aws ec2 describe-security-groups \
  --region "$AWS_REGION" \
  --filters "Name=group-name,Values=$SECURITY_GROUP_NAME" \
  --query "SecurityGroups[0].GroupId" \
  --output text 2>/dev/null || true)

if [ "$EXISTING_SG_ID" != "None" ] && [ -n "$EXISTING_SG_ID" ]; then
  echo "Found old security group $EXISTING_SG_ID, deleting..."
  aws ec2 delete-security-group \
    --group-id "$EXISTING_SG_ID" \
    --region "$AWS_REGION" || true
fi

SG_ID=$(aws ec2 create-security-group \
  --group-name "$SECURITY_GROUP_NAME" \
  --description "Security group for auto deploy" \
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

cat > user-data.sh <<'EOF'
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
EOF

echo "Bootstrap script created: user-data.sh"

############################################################
# STEP 4 – Launch EC2 Instance (with larger root volume)
############################################################
echo "----- STEP 4: Launch EC2 Instance -----"

# IMPORTANT: disable Git Bash path conversion so /dev/xvda is not mangled
MSYS_NO_PATHCONV=1 \
aws ec2 run-instances \
  --image-id "$AMI_ID" \
  --count 1 \
  --instance-type "$INSTANCE_TYPE" \
  --key-name "$KEY_NAME" \
  --security-group-ids "$SG_ID" \
  --user-data file://user-data.sh \
  --region "$AWS_REGION" \
  --block-device-mappings "DeviceName=/dev/xvda,Ebs={VolumeSize=$ROOT_VOLUME_SIZE,VolumeType=gp3,DeleteOnTermination=true}" \
  --query "Instances[0].InstanceId" \
  --output text > instance-id.txt

INSTANCE_ID=$(cat instance-id.txt)
rm -f instance-id.txt

echo "Instance launched: $INSTANCE_ID"

############################################################
# STEP 5 – Wait for Public IP
############################################################
echo "----- STEP 5: Wait for EC2 Public IP -----"
sleep 10

PUBLIC_IP=""
while [ -z "$PUBLIC_IP" ] || [ "$PUBLIC_IP" = "None" ]; do
  PUBLIC_IP=$(aws ec2 describe-instances \
    --instance-id "$INSTANCE_ID" \
    --region "$AWS_REGION" \
    --query "Reservations[0].Instances[0].PublicIpAddress" \
    --output text 2>/dev/null || true)
  if [ -z "$PUBLIC_IP" ] || [ "$PUBLIC_IP" = "None" ]; then
    echo "  Still waiting for public IP..."
    sleep 5
  fi
done

echo "Public IP: $PUBLIC_IP"

############################################################
# STEP 6 – Show URLs (App + Jenkins)
############################################################
echo "----- STEP 6: Deployment URLs -----"
echo "Backend:  http://$PUBLIC_IP:4000"
echo "Frontend: http://$PUBLIC_IP:5173"
echo "Jenkins:  http://$PUBLIC_IP:8080"
echo "SSH: ssh -i ${KEY_NAME}.pem ec2-user@$PUBLIC_IP"

############################################################
# STEP 7 – Try to Fetch Jenkins Initial Admin Password
############################################################
echo "----- STEP 7: Try to fetch Jenkins initial admin password (convenience) -----"
echo "Waiting ~60s for Jenkins to finish bootstrapping..."
# Give Jenkins some time to start
sleep 60

ADMIN_PW=""
for attempt in {1..10}; do
  echo "Attempt $attempt/10: reading /var/lib/jenkins/secrets/initialAdminPassword..."

  ADMIN_PW=$(ssh -o StrictHostKeyChecking=no -o ConnectTimeout=10 \
    -i "${KEY_NAME}.pem" \
    ec2-user@"$PUBLIC_IP" \
    "sudo cat /var/lib/jenkins/secrets/initialAdminPassword 2>/dev/null || true" || true)

  ADMIN_PW=$(echo "$ADMIN_PW" | tr -d ' \r\n')

  if [ -n "$ADMIN_PW" ]; then
    echo
    echo "✅ Jenkins initial admin password:"
    echo "$ADMIN_PW"
    echo
    echo "Use this on: http://$PUBLIC_IP:8080"
    break
  else
    echo "Password not ready yet, waiting 15s..."
    sleep 15
  fi
done

if [ -z "$ADMIN_PW" ]; then
  echo
  echo "⚠ Could not automatically retrieve Jenkins admin password."
  echo "   You can SSH and run:"
  echo "   ssh -i ${KEY_NAME}.pem ec2-user@$PUBLIC_IP"
  echo "   sudo cat /var/lib/jenkins/secrets/initialAdminPassword"
fi

echo "Deployment script completed."
