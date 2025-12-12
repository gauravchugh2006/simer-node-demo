pipeline {
  agent any
  options {
    // we do our own checkout
    skipDefaultCheckout()
    // one build at a time
    disableConcurrentBuilds()
    // keep last 10 builds only
    buildDiscarder(logRotator(numToKeepStr: '10'))
    // nice timestamps in console
    timestamps()
  }
  parameters {
    booleanParam(
      name: 'LIGHTWEIGHT_MODE',
      defaultValue: false,
      description: 'Enable after two successful runs to reuse cached dependencies and limit resource usage during CI/CD.'
    )
  }
  triggers {
    githubPush()
  }
  environment {
    NODE_VERSION = '18'
    AWS_REGION = 'eu-north-1'
    EC2_HOST = 'ec2-51-20-66-150.eu-north-1.compute.amazonaws.com'
    EC2_USER = 'ec2-user'
    SSH_KEY_CREDENTIALS = 'aws-ec2-ssh-key'
    COMPOSE_PROJECT_NAME = 'simer-node-demo'

    BACKEND_PORT  = '4000'
    FRONTEND_PORT = '5173'
    DB_PORT       = '3306'
  }
  stages {
    stage('Resolve EC2 Public IP') {
      steps {
        script {
            echo "[ENV] Resolving EC2 public IP from instance metadata…"
            env.EC2_HOST = sh(
                script: 'curl -s http://169.254.169.254/latest/meta-data/public-ipv4',
                returnStdout: true
            ).trim()
            echo "[ENV] EC2_HOST = ${env.EC2_HOST}"
        }
      }
    }
    // stage('Resolve EC2 Host') {
    //   steps {
    //     script {
    //       def ip = sh(
    //         script: """
    //           aws ec2 describe-instances \
    //             --region ${AWS_REGION} \
    //             --filters "Name=tag:Project,Values=simer-node-demo" "Name=instance-state-name,Values=running" \
    //             --query "Reservations[0].Instances[0].PublicIpAddress" \
    //             --output text
    //         """,
    //         returnStdout: true
    //       ).trim()
    //       env.EC2_HOST = ip
    //       echo "[INFO] Resolved EC2_HOST=${env.EC2_HOST}"
    //     }
    //   }
    // }
    stage('Checkout') {
        steps {
            echo "[GIT] Checking out source from main branch."
            // checkout scm
            checkout([
                $class: 'GitSCM',
                branches: [[name: '*/main']],
                userRemoteConfigs: [[
                    url: 'https://github.com/gauravchugh2006/simer-node-demo.git',
                    credentialsId: 'github-token-simer-node-demo'
                ]]
            ])
        }
    }
    stage('Node version check') {
        steps {
            echo "[NODE] Ensuring Node.js ${env.NODE_VERSION} is installed (or compatible) and available on the agent."
            sh '''
              set -e
              node -v || echo "Node not found on PATH"
              npm -v || echo "npm not found on PATH"
            '''
        }
    }
    stage('Backend dependencies') {
      steps {
        script {
          echo "[BACKEND]Installing backend dependencies (lightweight mode: ${params.LIGHTWEIGHT_MODE})."
          def backendInstallCmd = params.LIGHTWEIGHT_MODE ? 'npm install --prefer-offline --no-audit --prefix backend' : 'npm install --audit=false --prefix backend'
          sh backendInstallCmd
        }
      }
    }
    stage('Frontend build') {
      steps {
        script {
          echo "Installing frontend dependencies (lightweight mode: ${params.LIGHTWEIGHT_MODE})."
          def frontendInstallCmd = params.LIGHTWEIGHT_MODE ? 'npm install --prefer-offline --no-audit --prefix frontend' : 'npm install --audit=false --prefix frontend'
          sh frontendInstallCmd
        }
        echo 'Building frontend artifacts.'
        sh 'npm run build --prefix frontend'
        archiveArtifacts artifacts: 'frontend/dist/**/*', onlyIfSuccessful: true
      }
    }
    stage('Container build & deploy') {
      steps {
        echo 'Building Docker images for backend and frontend services.'
        sh 'docker compose -f docker-compose.yml build --parallel'

        echo 'Deploying to EC2 via SSH (docker compose up -d).'
        script {
          def repoUrl = sh(returnStdout: true, script: 'git config --get remote.origin.url').trim()
          withCredentials([
            sshUserPrivateKey(
              credentialsId: env.SSH_KEY_CREDENTIALS,
              keyFileVariable: 'SSH_KEY_FILE'
            )
          ]) {
            echo "[DEPLOY] Writing backend/.env and frontend/.env for this EC2 host…"
            sh """
              ssh -o StrictHostKeyChecking=no -i "${SSH_KEY_FILE}" ${EC2_USER}@${EC2_HOST} <<'DEPLOY'
              set -e

              # ---- backend/.env (for dotenv in app.js) ----
              cat > backend/.env <<EOF
              NODE_ENV=production
              PORT=${BACKEND_PORT}

              DB_HOST=mysql
              DB_PORT=${DB_PORT}
              DB_USER=root
              DB_PASSWORD=secret
              DB_NAME=cafe_coffee_day

              ALLOWED_ORIGINS=http://localhost:${FRONTEND_PORT},http://${EC2_HOST}:${FRONTEND_PORT}
              EOF

              # ---- frontend/.env (Vite) ----
              cat > frontend/.env <<EOF
              VITE_API_BASE_URL=http://${EC2_HOST}:${BACKEND_PORT}
              EOF
              echo "Preparing deployment directory on EC2 host."
              mkdir -p ~/simer-node-demo
              cd ~/simer-node-demo

              echo "Ensuring git is installed."
              sudo dnf install -y git

              if [ ! -d .git ]; then
                echo "Cloning repository for the first time."
                git clone '${repoUrl}' .
              else
                echo "Fetching latest changes."
                git fetch --all
              fi

              echo "Checking out main branch."
              git checkout main

              # Preserve local environment overrides while refreshing code.
              if [ -f .env ]; then
                cp .env /tmp/simer-node-demo.env.bak
              fi

              git reset --hard origin/main

              if [ -f /tmp/simer-node-demo.env.bak ]; then
                mv /tmp/simer-node-demo.env.bak .env
              fi

              echo "Copying environment file for frontend (if present)."
              if [ -f .env ]; then
                  cp .env frontend/.env
              else
                  echo "No .env file found in project root."
                  echo "[DEPLOY] frontend/.env:"
                  cat frontend/.env
              fi

              echo "Copying environment file for backend (if present)."
              if [ -f .env ]; then
                  cp .env backend/.env
              else
                  echo "No .env file found in project root."
                  echo "[DEPLOY] backend/.env:"
                  cat backend/.env
              fi

              echo "[DEPLOY] Stopping previous containers (if any)…"
              docker compose -f docker-compose.yml -p "${COMPOSE_PROJECT_NAME}" down -v --remove-orphans || true

              echo "[DEPLOY] Launching containers with docker compose."
              docker compose -f docker-compose.yml pull || true
              echo "[DEPLOY] Building and starting containers..."
              docker compose -f docker-compose.yml -p "$COMPOSE_PROJECT_NAME" up -d --build

              echo "[DEPLOY] Pruning old Docker resources (safe cleanup)."
              docker system prune -af --volumes --filter "until=72h" || true
              echo "[DEPLOY] Current Running containers:"
              docker ps --format "table {{.Names}}\t{{.Image}}\t{{.Ports}}"
            """
          }
        }
      }
    }
  }
}
