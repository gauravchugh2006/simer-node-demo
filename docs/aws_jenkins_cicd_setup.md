# AWS EC2 CI/CD with Jenkins and GitHub

The following playbook describes how to automate deployments to an EC2 host when pull requests are merged into the `main` branch. It assumes you already have a working Jenkins controller and the `Jenkinsfile` in this repository.

## 1. Prerequisites and environment checks

Before wiring GitHub to Jenkins, verify the Jenkins host (the EC2 instance) has the right tooling. Fix any gaps before proceeding.

| Step | What to check/install | Why it matters | If missing |
| :--- | :--- | :--- | :--- |
| Jenkins | Confirm the service is running and reachable (default: port 8080). | Jenkins orchestrates the pipeline defined in the `Jenkinsfile`. | Install Jenkins and start the service. |
| AWS CLI | Run `aws --version`. | Needed for ECR login or SSM commands; honors IAM role permissions. | Install AWS CLI v2 and configure the correct region (e.g., `us-east-1`). |
| Git client | Run `git --version`. | Jenkins clones the GitHub repo and reads the `Jenkinsfile`. | Install Git via the OS package manager. |
| Docker + Compose | Run `docker --version` and `docker-compose --version` (or `docker compose version`). | Required because deployment uses Docker Compose on the EC2 host. | Install Docker and Compose; ensure the Jenkins user can run Docker without sudo. |

## 2. AWS security architecture (IAM)

Follow the assume-role pattern to avoid long-lived keys on the server.

1. **EC2 instance role (requester)**
   - Attach an IAM role to the Jenkins EC2 instance with minimal permissions (e.g., only `sts:AssumeRole` to the execution role and optional ECR read permissions).
   - Rationale: keeps the base host privilege low; Jenkins will request stronger, short-lived credentials only when needed.

2. **Deployment execution role (actor)**
   - Create a second IAM role (e.g., `Jenkins-Deployment-EC2-Role`) whose **trust policy** allows the EC2 instance role to assume it.
   - Attach only the permissions required for deployment (e.g., ECR pull, SSM send-command if used).
   - Record the role ARN for Jenkins credentials.

## 3. GitHub–Jenkins integration

1. **Webhook**
   - In GitHub: **Settings → Webhooks → Add webhook**, URL `http(s)://<jenkins-host>/github-webhook/`, content type `application/json`.
   - Trigger: select **“Just the push event.”** PR merges into `main` emit push events, which will start the pipeline automatically.

2. **Jenkins GitHub token**
   - Create a GitHub Personal Access Token (classic `repo` scope or fine-grained with `contents:read`, `metadata`). Add it to Jenkins as **Secret Text**.
   - Configure **Manage Jenkins → Configure System → GitHub** to use that token for API calls (e.g., status checks).

## 4. Jenkins credentials to create

Use these IDs (or adjust in your `Jenkinsfile`):
- `github-credentials`: GitHub PAT (Secret Text) for cloning.
- `ec2-ssh-key`: SSH key for the deploy user on EC2 (kind: “SSH Username with private key”).
- `aws-deploy-role`: AWS credential entry containing the **execution role ARN** (kind: “AWS Credentials”). This relies on the EC2 instance role to assume it via STS.
- App secrets such as `db_password` as Secret Text.

## 5. Configure the Jenkins pipeline job

1. Create a **Pipeline** (or Multibranch) job named, for example, `My-App-CICD`.
2. **Build Triggers:** enable **“GitHub hook trigger for GITScm polling.”**
3. **Pipeline definition:** choose **“Pipeline script from SCM.”**
   - SCM: Git, URL: your repo, Credentials: `github-credentials`, Branches to build: `*/main`.

## 6. Jenkinsfile wiring

Ensure the `Jenkinsfile` consumes the credentials above and assumes the deployment role securely.

- **Core stages to include**
  - `Checkout`: uses `git` with `github-credentials`.
  - `Build & Test`: run unit tests/lint; fail fast.
  - `Package` (optional): build and push Docker image to ECR if needed by the deploy script.
  - `Deploy`: run `deploy_ec2.sh` on the EC2 host.

- **SSH-based deploy example** (keeps `deploy_ec2.sh` idempotent and re-runnable):
  ```groovy
  stage('Deploy') {
    steps {
      sshagent(credentials: ['ec2-ssh-key']) {
        sh 'ssh -o StrictHostKeyChecking=no ec2-user@<EC2_PUBLIC_IP> "bash -s" < deploy_ec2.sh'
      }
    }
  }
  ```

- **Assume-role + ECR + Compose example** (for role-based auth on the host):
  ```groovy
  stage('Deployment to EC2') {
    steps {
      withAWS(roleArn: credentials('aws-deploy-role'), roleSessionName: 'EC2-Deployment-Session') {
        sh """
          aws ecr get-login-password --region <REGION> | docker login --username AWS --password-stdin <ECR_URI>
          docker compose pull
          docker compose up -d --remove-orphans
          docker image prune -f
        """
      }
    }
  }
  ```

- **SSM-based deploy** (no direct SSH): use `aws ssm send-command` from Jenkins to run `deploy_ec2.sh` (stored in S3 or inline). Requires the SSM agent on the instance and matching IAM permissions.

## 7. Make `deploy_ec2.sh` idempotent

- Handle repeated runs safely by pulling updated images and recreating containers only when needed.
- Example snippet:
  ```bash
  set -euo pipefail
  docker compose pull
  docker compose up -d --remove-orphans
  docker image prune -f
  ```

## 8. Protecting `main` with PR merges

- Enable branch protection on `main` so only approved PRs merge. Require status checks from Jenkins (e.g., build/test stage) before merging.
- PR merges to `main` create push events → webhook triggers Jenkins → pipeline runs → deploys.

## 9. Observability, validation, and rollback

- Send logs to CloudWatch Logs or view via `docker logs` over SSH. Add retries/backoff in deployment steps for transient issues.
- Keep previous images or Compose files to roll back by redeploying the prior tag or git commit.
- **Validation checklist**
  - [ ] Webhook deliveries succeed (GitHub → Recent Deliveries).
  - [ ] Jenkins builds on `main` pushes.
  - [ ] Deploy stage can reach EC2 via SSH/SSM.
  - [ ] Application starts after Compose/PM2 restart.
  - [ ] Rollback path tested.

## 10. Test the end-to-end flow

1. Push a change to a feature branch and open a PR.
2. Merge the PR into `main`.
3. Verify Jenkins auto-starts the pipeline from the webhook and progresses through checkout → build/test → deploy.
4. Confirm the EC2 instance pulls the new image/code and the app is live.
