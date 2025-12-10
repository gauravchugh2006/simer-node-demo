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
aws ec2 delete-key-pair --key-name "$KEY_NAME" --region "$AWS_REGION" >/dev/null 2>&1 || true

aws ec2 create-key-pair \
  --key-name "$KEY_NAME" \
  --query "KeyMaterial" \
  --output text \
  --region "$AWS_REGION" > "${KEY_NAME}.pem"

chmod 400 "${KEY_NAME}.pem"
echo "Key pair saved: ${KEY_NAME}.pem"

echo "----- STEP 2: Create Security Group -----"
# Try to delete old SG with same name (best-effort)
OLD_SG_ID=$(aws ec2 describe-security-groups \
  --region "$AWS_REGION" \
  --filters "Name=group-name,Values=${SECURITY_GROUP_NAME}" \
  --query "SecurityGroups[0].GroupId" \
  --output text 2>/dev/null || true)

if [[ "$OLD_SG_ID" != "None" && -n "$OLD_SG_ID" ]]; then
  echo "Found existing SG $OLD_SG_ID with name ${SECURITY_GROUP_NAME}, deleting..."
  aws ec2 delete-security-group --group-id "$OLD_SG_ID" --region "$AWS_REGION" >/dev/null 2>&1 || true
fi

SG_ID=$(aws ec2 create-security-group \
  --group-name "$SECURITY_GROUP_NAME" \
  --description "Security group for auto deploy" \
  --region "$AWS_REGION" \
  --query "GroupId" \
  --output text)

echo "Created SG: $SG_ID"
echo "Adding ingress rules (22, 4000, 5173, 3306, 8080)..."

aws ec2 authorize-security-group-ingress \
  --group-id "$SG_ID" \
  --protocol tcp --port 22 --cidr 0.0.0.0/0 --region "$AWS_REGION" >/dev/null

aws ec2 authorize-security-group-ingress \
  --group-id "$SG_ID" \
  --protocol tcp --port 4000 --cidr 0.0.0.0/0 --region "$AWS_REGION" >/dev/null

aws ec2 authorize-security-group-ingress \
  --group-id "$SG_ID" \
  --protocol tcp --port 5173 --cidr 0.0.0.0/0 --region "$AWS_REGION" >/dev/null

aws ec2 authorize-security-group-ingress \
  --group-id "$SG_ID" \
  --protocol tcp --port 3306 --cidr 0.0.0.0/0 --region "$AWS_REGION" >/dev/null

aws ec2 authorize-security-group-ingress \
  --group-id "$SG_ID" \
  --protocol tcp --port 8080 --cidr 0.0.0.0/0 --region "$AWS_REGION" >/dev/null

echo "Security group rules added."

echo "----- STEP 3: Create EC2 Bootstrap Script (user-data.sh) -----"
cat <<EOF > user-data.sh
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
curl -SL https://github.com/docker/compose/releases/download/v2.29.2/docker-compose-linux-x86_64 \
  -o /usr/libexec/docker/cli-plugins/docker-compose
chmod +x /usr/libexec/docker/cli-plugins/docker-compose

# ------------------------------
# 4. Install Java 17 and Jenkins
# ------------------------------
dnf install -y java-17-amazon-corretto

wget -O /etc/yum.repos.d/jenkins.repo \
  https://pkg.jenkins.io/redhat-stable/jenkins.repo
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
  git clone $REPO_URL
fi
chown -R ec2-user:ec2-user /home/ec2-user/simer-node-demo
cd /home/ec2-user/simer-node-demo

# ------------------------------
# 6. Generate .env using IMDSv2 Public IP
# ------------------------------
TOKEN=\$(curl -s -X PUT "http://169.254.169.254/latest/api/token" \
  -H "X-aws-ec2-metadata-token-ttl-seconds: 21600" || true)

if [ -n "\$TOKEN" ]; then
  PUBLIC_IP=\$(curl -s -H "X-aws-ec2-metadata-token: \$TOKEN" \
    http://169.254.169.254/latest/meta-data/public-ipv4 || true)
else
  PUBLIC_IP=\$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4 || true)
fi

if [ -z "\$PUBLIC_IP" ]; then
  PUBLIC_IP="localhost"
fi

echo "VITE_API_BASE_URL=http://\$PUBLIC_IP:4000" > .env

# ------------------------------
# 7. Run docker compose
# ------------------------------
docker compose down || true
docker compose up -d --build

# Ensure final ownership
chown -R ec2-user:ec2-user /home/ec2-user/simer-node-demo
EOF

echo "Bootstrap script created."

echo "----- STEP 4: Launch EC2 Instance -----"
INSTANCE_ID=$(aws ec2 run-instances \
  --image-id "$AMI_ID" \
  --count 1 \
  --instance-type "$INSTANCE_TYPE" \
  --key-name "$KEY_NAME" \
  --security-group-ids "$SG_ID" \
  --user-data file://user-data.sh \
  --region "$AWS_REGION" \
  --query "Instances[0].InstanceId" \
  --output text)

echo "Instance launched: $INSTANCE_ID"

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
    echo "Waiting for public IP..."
    sleep 5
  fi
done

echo "Public IP: $PUBLIC_IP"

echo "----- STEP 6: Deployment URLs -----"
echo "Backend:  http://$PUBLIC_IP:4000"
echo "Frontend: http://$PUBLIC_IP:5173"
echo "Jenkins:  http://$PUBLIC_IP:8080"
echo "SSH: ssh -i ${KEY_NAME}.pem ec2-user@$PUBLIC_IP"

echo "----- STEP 7: Try to fetch Jenkins initial admin password (convenience) -----"
echo "Waiting ~60s for Jenkins to finish bootstrapping..."
sleep 60

JENKINS_PASS=""
for i in {1..10}; do
  echo "Attempt $i/10: reading /var/lib/jenkins/secrets/initialAdminPassword..."
  JENKINS_PASS=$(ssh -o StrictHostKeyChecking=no -i "${KEY_NAME}.pem" \
    ec2-user@"$PUBLIC_IP" 'sudo cat /var/lib/jenkins/secrets/initialAdminPassword 2>/dev/null || true')
  if [ -n "$JENKINS_PASS" ]; then
    echo ""
    echo "✅ Jenkins initial admin password:"
    echo "$JENKINS_PASS"
    echo ""
    echo "Use this on: http://$PUBLIC_IP:8080"
    break
  else
    echo "Password not ready yet, waiting 15s..."
    sleep 15
  fi
done

if [ -z "$JENKINS_PASS" ]; then
  echo "⚠ Could not auto-read Jenkins password."
  echo "SSH and run manually:"
  echo "  ssh -i ${KEY_NAME}.pem ec2-user@$PUBLIC_IP"
  echo "  sudo cat /var/lib/jenkins/secrets/initialAdminPassword"
fi

echo "Deployment script completed."
