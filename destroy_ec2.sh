#!/bin/bash
set -e

# Keep AWS CLI output simple in Git Bash / Windows
export AWS_PAGER=""
export AWS_DEFAULT_OUTPUT="json"

AWS_REGION="eu-north-1"
KEY_NAME="simer-node-key"
SECURITY_GROUP_NAME="simer-node-sg"

echo "===== DESTROY SCRIPT STARTED ====="

# Optional: accept INSTANCE_ID as a parameter
INSTANCE_ID_ARG="$1"

if [ -n "$INSTANCE_ID_ARG" ]; then
  INSTANCE_ID="$INSTANCE_ID_ARG"
  echo "Using provided instance ID: $INSTANCE_ID"
else
  echo "No instance ID provided. Trying to detect latest instance with key pair: $KEY_NAME"

  # Find the most recent instance (any state except terminated) using this key
  INSTANCE_ID=$(aws ec2 describe-instances \
    --region "$AWS_REGION" \
    --filters "Name=key-name,Values=$KEY_NAME" "Name=instance-state-name,Values=pending,running,stopping,stopped" \
    --query "Reservations[].Instances[].InstanceId" \
    --output text | awk '{print $NF}' )

  if [ -z "$INSTANCE_ID" ]; then
    echo "No EC2 instance found for key pair '$KEY_NAME' in region '$AWS_REGION'."
  else
    echo "Detected latest instance ID: $INSTANCE_ID"
  fi
fi

# 1) TERMINATE INSTANCE (if any)
if [ -n "$INSTANCE_ID" ] && [ "$INSTANCE_ID" != "None" ]; then
  echo "Terminating instance: $INSTANCE_ID ..."
  aws ec2 terminate-instances \
    --instance-ids "$INSTANCE_ID" \
    --region "$AWS_REGION" >/dev/null

  echo "Waiting for instance to terminate..."
  aws ec2 wait instance-terminated \
    --instance-ids "$INSTANCE_ID" \
    --region "$AWS_REGION"
  echo "Instance $INSTANCE_ID terminated."
else
  echo "No instance to terminate."
fi

# 2) DELETE SECURITY GROUP
echo "Attempting to delete security group: $SECURITY_GROUP_NAME ..."
set +e
SG_DELETE_OUTPUT=$(aws ec2 delete-security-group \
  --group-name "$SECURITY_GROUP_NAME" \
  --region "$AWS_REGION" 2>&1)
STATUS=$?
set -e

if [ $STATUS -ne 0 ]; then
  echo "Could not delete security group '$SECURITY_GROUP_NAME'. It may not exist or is still attached:"
  echo "$SG_DELETE_OUTPUT"
else
  echo "Security group '$SECURITY_GROUP_NAME' deleted."
fi

# 3) DELETE KEY PAIR IN AWS
echo "Deleting key pair '$KEY_NAME' in AWS..."
aws ec2 delete-key-pair \
  --key-name "$KEY_NAME" \
  --region "$AWS_REGION" || echo "Key pair '$KEY_NAME' may not exist in AWS."

# 4) DELETE LOCAL PEM FILE
if [ -f "${KEY_NAME}.pem" ]; then
  chmod +w "${KEY_NAME}.pem" 2>/dev/null || true
  rm -f "${KEY_NAME}.pem"
  echo "Local key file '${KEY_NAME}.pem' deleted."
else
  echo "Local key file '${KEY_NAME}.pem' not found, skipping."
fi

echo "===== DESTROY SCRIPT COMPLETED ====="
