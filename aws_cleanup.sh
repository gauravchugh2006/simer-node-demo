#!/bin/bash
set -e

# Make AWS CLI output clean in Git Bash / Windows
export AWS_PAGER=""
export AWS_DEFAULT_OUTPUT="json"

# Change this if needed
AWS_REGION="${AWS_REGION:-eu-north-1}"

echo "=============================================="
echo "   AWS CLEANUP SCRIPT - REGION: $AWS_REGION"
echo "   This will attempt to delete the following:"
echo "    • Unattached EBS volumes"
echo "    • Unused Elastic IPs"
echo "    • Your own EBS snapshots"
echo "    • Orphaned network interfaces (ENIs)"
echo "=============================================="
echo

read -p "Are you sure you want to continue? (yes/NO): " CONFIRM
if [[ "$CONFIRM" != "yes" ]]; then
  echo "Aborted."
  exit 0
fi

echo
echo "----- STEP 1: Delete Unattached EBS Volumes -----"
VOLUMES=$(aws ec2 describe-volumes \
  --region "$AWS_REGION" \
  --filters "Name=status,Values=available" \
  --query "Volumes[].VolumeId" \
  --output text 2>/dev/null || true)

if [[ -z "$VOLUMES" || "$VOLUMES" == "None" ]]; then
  echo "No unattached EBS volumes found."
else
  echo "Unattached volumes found: $VOLUMES"
  for VOL in $VOLUMES; do
    echo "Deleting volume: $VOL"
    aws ec2 delete-volume --volume-id "$VOL" --region "$AWS_REGION" || echo "Failed to delete volume $VOL"
  done
fi

echo
echo "----- STEP 2: Release Unused Elastic IPs -----"
ADDRESSES_JSON=$(aws ec2 describe-addresses \
  --region "$AWS_REGION" \
  --output json 2>/dev/null || echo "{}")

# Get AllocationIds where there is no AssociationId
ALLOC_IDS=$(echo "$ADDRESSES_JSON" | \
  jq -r '.Addresses[] | select(.AssociationId == null) | .AllocationId' 2>/dev/null || true)

if [[ -z "$ALLOC_IDS" ]]; then
  echo "No unused Elastic IPs found."
else
  echo "Unused Elastic IP AllocationIds: $ALLOC_IDS"
  for AID in $ALLOC_IDS; do
    echo "Releasing Elastic IP: $AID"
    aws ec2 release-address --allocation-id "$AID" --region "$AWS_REGION" || echo "Failed to release EIP $AID"
  done
fi

echo
echo "----- STEP 3: Delete Your Snapshots (Owner = self) -----"
SNAPSHOTS=$(aws ec2 describe-snapshots \
  --owner-ids self \
  --region "$AWS_REGION" \
  --query "Snapshots[].SnapshotId" \
  --output text 2>/dev/null || true)

if [[ -z "$SNAPSHOTS" || "$SNAPSHOTS" == "None" ]]; then
  echo "No snapshots found for owner 'self'."
else
  echo "Snapshots to delete: $SNAPSHOTS"
  for SNAP in $SNAPSHOTS; do
    echo "Deleting snapshot: $SNAP"
    aws ec2 delete-snapshot --snapshot-id "$SNAP" --region "$AWS_REGION" || echo "Failed to delete snapshot $SNAP"
  done
fi

echo
echo "----- STEP 4: Delete Orphaned ENIs (available) -----"
ENIS=$(aws ec2 describe-network-interfaces \
  --region "$AWS_REGION" \
  --filters "Name=status,Values=available" \
  --query "NetworkInterfaces[].NetworkInterfaceId" \
  --output text 2>/dev/null || true)

if [[ -z "$ENIS" || "$ENIS" == "None" ]]; then
  echo "No orphaned ENIs found."
else
  echo "Orphaned ENIs: $ENIS"
  for ENI in $ENIS; do
    echo "Deleting ENI: $ENI"
    aws ec2 delete-network-interface --network-interface-id "$ENI" --region "$AWS_REGION" || echo "Failed to delete ENI $ENI"
  done
fi

echo
echo "----- CLEANUP COMPLETE -----"
echo "Checked and attempted cleanup for:"
echo "  • Unattached EBS volumes"
echo "  • Unused Elastic IPs"
echo "  • Your snapshots"
echo "  • Orphaned ENIs"
echo
echo "You can now double-check AWS console for any remaining resources."
