# AWS EC2 CI/CD with Jenkins and GitHub

The following playbook describes how to automate deployments to an EC2 host when pull requests are merged into the `main` branch. It assumes you already have a working Jenkins controller and the `Jenkinsfile` in this repository.

## 1. Prepare AWS resources
1. **IAM user/role for Jenkins**
   - Create an IAM user or role with programmatic access limited to the target resources (e.g., `AmazonEC2FullAccess` or a tailored policy that allows: `ec2:DescribeInstances`, `ec2:StartInstances`, `ec2:StopInstances`, `ec2:CreateTags`, `ssm:SendCommand` if using SSM, and `s3:GetObject` if artifacts live in S3`).
   - Generate access keys for the Jenkins credential store.

2. **Network and host access**
   - Ensure the EC2 instance’s security group allows SSH (port 22) **from the Jenkins controller’s IP**. Keep access narrow.
   - If using Docker on the EC2 host, expose only necessary application ports to the load balancer or trusted IP ranges.

3. **Instance preparation**
   - Install runtime dependencies on the target EC2 host (Docker, Docker Compose, Node/PM2, etc.). The provided `deploy_ec2.sh` assumes Docker + Compose—validate it locally on the instance.
   - Create a non-root deploy user with sudo access to Docker (`sudo usermod -aG docker <user>`). Configure SSH for that user.

4. **Secrets management**
   - Prefer AWS Systems Manager Parameter Store/Secrets Manager for app secrets. If not available, store secrets as Jenkins credentials and inject them as environment variables during deploy.

## 2. Configure GitHub–Jenkins integration
1. **GitHub webhook**
   - In the GitHub repo, add a webhook targeting `https://<jenkins-domain>/github-webhook/`.
   - Select events: “Pull requests” and “Pushes.” The pipeline will listen for merged PRs via pushes to `main`.

2. **Jenkins GitHub app/token**
   - Create a GitHub personal access token (classic with `repo` scope or fine-grained with `contents:read`, `metadata`), and add it to Jenkins as a credential (kind: “Secret Text”).
   - Configure Jenkins global settings: *Manage Jenkins → Configure System → GitHub* and add the token to the GitHub server entry.

## 3. Set up Jenkins credentials
Create the following credentials (names referenced in examples below):
- `github-credentials`: the GitHub PAT (Secret Text).
- `ec2-ssh-key`: SSH private key for the deploy user on EC2 (kind: “SSH Username with private key”).
- `aws-creds`: AWS access key/secret for the IAM user (kind: “AWS Credentials” or two separate secrets). Optionally, rely on an IAM role attached to the Jenkins agent instead.
- Any app secrets (e.g., `db_password`) as Secret Text or “Username with password.”

## 4. Jenkins pipeline job
1. **Create a Multibranch Pipeline or a Pipeline job** pointing to this repository. Supply `github-credentials` so Jenkins can clone.
2. **Branch source filters**: build only `main` or use PR-based triggers if desired.
3. **Build triggers**: enable “GitHub hook trigger for GITScm polling.”

## 5. Jenkinsfile wiring
Ensure your `Jenkinsfile` includes these stages (names illustrative):
- `Checkout`: uses `git` step with the GitHub credentials.
- `Build & Test`: run unit tests or lint; fail fast to block bad merges.
- `Package` (optional): build Docker image or artifacts. Push to ECR/Docker Hub if the deploy script expects a registry image.
- `Deploy`: call `deploy_ec2.sh` on the remote host. Two common approaches:
  1. **SSH + bash** (simple):
     ```groovy
     stage('Deploy') {
       steps {
         sshagent(credentials: ['ec2-ssh-key']) {
           sh 'ssh -o StrictHostKeyChecking=no ec2-user@<EC2_PUBLIC_IP> "bash -s" < deploy_ec2.sh'
         }
       }
     }
     ```
     - Replace `ec2-user` and host with your target values.
     - `deploy_ec2.sh` should be idempotent (safe to re-run) and executable.
  2. **AWS SSM** (no direct SSH): use `aws ssm send-command` from Jenkins to run `deploy_ec2.sh` stored in S3 or inline. Requires the SSM agent and IAM permissions.

## 6. Making the deploy script idempotent
- Validate `deploy_ec2.sh` handles repeated runs by checking for existing containers and pulling only when versions change.
- Example snippet to redeploy Docker Compose safely:
  ```bash
  set -euo pipefail
  docker compose pull
  docker compose up -d --remove-orphans
  docker image prune -f
  ```

## 7. Protecting `main` with PR merges
- Enable branch protection on `main` so only approved PRs merge. Require status checks from Jenkins (e.g., `build-and-test` stage) before merging.
- When a PR is merged, GitHub pushes to `main` trigger the webhook → Jenkins job → deploy stage.

## 8. Observability and rollback
- Pipe application logs to CloudWatch Logs or a centralized tool; for Docker, use `awslogs` driver or `docker logs` through SSH.
- Keep previous images or Compose files; to roll back, redeploy with the prior image tag or git commit.

## 9. Example end-to-end flow
1. Developer opens PR → Jenkins runs tests via webhook.
2. PR approved and merged into `main`.
3. GitHub webhook triggers Jenkins; Jenkins clones `main` and runs build/test.
4. Jenkins pushes image to registry (if applicable) and runs `deploy_ec2.sh` over SSH/SSM on the EC2 instance.
5. EC2 pulls the new image/code and restarts containers; health checks confirm success.

## 10. Security and reliability tips
- Rotate SSH keys and tokens regularly; prefer short-lived AWS roles where possible.
- Restrict Jenkins agents’ IAM permissions to least privilege.
- Store no long-lived secrets in the repo; rely on Jenkins credentials or AWS Parameter Store.
- Add retries/backoff in deployment steps to handle transient network issues.

## 11. Validation checklist
- [ ] Webhook delivers events to Jenkins (check GitHub “Recent Deliveries”).
- [ ] Jenkins job builds on `main` pushes.
- [ ] Deploy stage can reach EC2 via SSH/SSM.
- [ ] Application starts successfully after Compose/PM2 restart.
- [ ] Rollback path tested.
