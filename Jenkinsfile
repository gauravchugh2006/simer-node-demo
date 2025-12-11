pipeline {
  agent any
  options {
    skipDefaultCheckout()
    timestamps()
    disableConcurrentBuilds()
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
  }
  stages {
    stage('Checkout') {
      steps {
        echo 'Checking out source code from main branch.'
        checkout scm
      }
    }

    stage('Node version check') {
      steps {
        echo "Ensuring Node.js ${env.NODE_VERSION} is available on the agent."
        sh 'node -v && npm -v'
      }
    }

    stage('Backend dependencies') {
      steps {
        script {
          echo "Installing backend dependencies (lightweight mode: ${params.LIGHTWEIGHT_MODE})."
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
            sh """
              ssh -o StrictHostKeyChecking=no -i "${SSH_KEY_FILE}" ${EC2_USER}@${EC2_HOST} <<'DEPLOY'
              set -e
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
              git pull origin main

              echo "Copying environment file for frontend (if present)."
              if [ -f .env ]; then
                cp .env frontend/.env
              fi

              echo "Launching containers with docker compose."
              docker compose -f docker-compose.yml pull || true
              docker compose -f docker-compose.yml up -d --build

              echo "Pruning old Docker resources (safe cleanup)."
              docker system prune -af --volumes --filter "until=72h" || true
              DEPLOY
            """
          }
        }
      }
    }

    // stage('Container build & deploy (main only)') {
    //   when {
    //     branch 'main'
    //   }
    //   steps {
    //     echo 'Building Docker images for backend and frontend services.'
    //     sh 'docker compose -f docker-compose.yml build --parallel'

    //     echo 'Deploying to EC2 via SSH (docker compose up -d).'
    //     script {
    //       def repoUrl = sh(returnStdout: true, script: 'git config --get remote.origin.url').trim()
    //       sshagent (credentials: [env.SSH_KEY_CREDENTIALS]) {
    //         sh """
    //           ssh -o StrictHostKeyChecking=no ${EC2_USER}@${EC2_HOST} <<'DEPLOY'
    //           set -e
    //           echo "Preparing deployment directory on EC2 host."
    //           sudo mkdir -p /opt/${COMPOSE_PROJECT_NAME}
    //           sudo chown ${EC2_USER}:${EC2_USER} /opt/${COMPOSE_PROJECT_NAME}
    //           cd /opt/${COMPOSE_PROJECT_NAME}

    //           if [ ! -d .git ]; then
    //             echo "Cloning repository ${repoUrl}."
    //             git clone ${repoUrl} .
    //           else
    //             echo "Refreshing repository from origin/main."
    //             git fetch --all --prune
    //           fi

    //           git checkout main
    //           git reset --hard origin/main

    //           echo "Launching containers with docker compose."
    //           docker compose -f docker-compose.yml pull || true
    //           docker compose -f docker-compose.yml up -d --build

    //           echo "Pruning old Docker resources (safe cleanup)."
    //           docker system prune -af --volumes --filter "until=72h" || true
    //           DEPLOY
    //         """
    //       }
    //     }
    //   }
    // }
  }
}
