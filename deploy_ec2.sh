#!/bin/bash
set -e

AWS_REGION="eu-north-1"
INSTANCE_TYPE="t3.micro"
KEY_NAME="simer-node-key"
SECURITY_GROUP_NAME="simer-node-sg"
AMI_ID="ami-0b46816ffa1234887" # Amazon Linux 2023
REPO_URL="https://github.com/gauravchugh2006/simer-node-demo.git"

echo "----- STEP 1: Create Key Pair -----"
aws ec2 delete-key-pair --key-name $KEY_NAME --region $AWS_REGION || true
aws ec2 create-key-pair \
  --key-name $KEY_NAME \
  --query "KeyMaterial" \
  --output text \
  --region $AWS_REGION > ${KEY_NAME}.pem

chmod 400 ${KEY_NAME}.pem
echo "Key pair saved: ${KEY_NAME}.pem"


echo "----- STEP 2: Create Security Group -----"
SG_ID=$(aws ec2 create-security-group \
  --group-name $SECURITY_GROUP_NAME \
  --description "Security group for auto deploy" \
  --region $AWS_REGION \
  --query "GroupId" \
  --output text)

echo "Created SG: $SG_ID"

echo "Adding rules..."
aws ec2 authorize-security-group-ingress \
  --group-id $SG_ID \
  --protocol tcp --port 22 --cidr 0.0.0.0/0 --region $AWS_REGION

aws ec2 authorize-security-group-ingress \
  --group-id $SG_ID \
  --protocol tcp --port 4000 --cidr 0.0.0.0/0 --region $AWS_REGION

aws ec2 authorize-security-group-ingress \
  --group-id $SG_ID \
  --protocol tcp --port 5173 --cidr 0.0.0.0/0 --region $AWS_REGION

aws ec2 authorize-security-group-ingress \
  --group-id $SG_ID \
  --protocol tcp --port 3306 --cidr 0.0.0.0/0 --region $AWS_REGION


echo "----- STEP 3: Create EC2 Bootstrap Script -----"
cat <<EOF > user-data.sh
#!/bin/bash
set -e
sudo dnf update -y
sudo dnf install -y docker git nodejs
sudo systemctl enable --now docker
sudo usermod -aG docker ec2-user

# Install Docker Compose Plugin
DOCKER_CONFIG=\${DOCKER_CONFIG:-\$HOME/.docker}
mkdir -p \$DOCKER_CONFIG/cli-plugins
curl -SL https://github.com/docker/compose/releases/download/v2.29.2/docker-compose-linux-x86_64 \
  -o \$DOCKER_CONFIG/cli-plugins/docker-compose
chmod +x \$DOCKER_CONFIG/cli-plugins/docker-compose

# Clone Repo
cd /home/ec2-user
git clone $REPO_URL
cd simer-node-demo

# Create .env dynamically
PUBLIC_IP=\$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4)
echo "VITE_API_BASE_URL=http://\$PUBLIC_IP:4000" > .env

docker compose up -d --build
EOF

echo "Bootstrap script created."


echo "----- STEP 4: Launch EC2 Instance -----"
INSTANCE_ID=$(aws ec2 run-instances \
  --image-id $AMI_ID \
  --count 1 \
  --instance-type $INSTANCE_TYPE \
  --key-name $KEY_NAME \
  --security-group-ids $SG_ID \
  --user-data file://user-data.sh \
  --region $AWS_REGION \
  --query "Instances[0].InstanceId" \
  --output text)

echo "Instance launched: $INSTANCE_ID"


echo "----- STEP 5: Wait for EC2 Public IP -----"
sleep 10

PUBLIC_IP=""
while [ -z "$PUBLIC_IP" ]; do
  PUBLIC_IP=$(aws ec2 describe-instances \
    --instance-id $INSTANCE_ID \
    --region $AWS_REGION \
    --query "Reservations[0].Instances[0].PublicIpAddress" \
    --output text 2>/dev/null || true)
  sleep 5
done

echo "Public IP: $PUBLIC_IP"


echo "----- STEP 6: Deployment URLs -----"
echo "Backend:  http://$PUBLIC_IP:4000"
echo "Frontend: http://$PUBLIC_IP:5173"
echo "SSH: ssh -i ${KEY_NAME}.pem ec2-user@$PUBLIC_IP"

echo "Deployment script completed."