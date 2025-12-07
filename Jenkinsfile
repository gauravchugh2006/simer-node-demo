pipeline {
  agent any
  options {
    skipDefaultCheckout()
    timestamps()
    disableConcurrentBuilds()
  }
  triggers {
    githubPush()
  }
  environment {
    NODE_VERSION = '18'
  }
  stages {
    stage('Checkout') {
      steps {
        checkout scm
      }
    }

    stage('Backend dependencies') {
      steps {
        sh 'npm install --prefix backend'
      }
    }

    stage('Frontend build') {
      steps {
        sh 'npm install --prefix frontend'
        sh 'npm run build --prefix frontend'
        archiveArtifacts artifacts: 'frontend/dist/**/*', onlyIfSuccessful: true
      }
    }

    stage('Container build & deploy (main only)') {
      when {
        branch 'main'
      }
      steps {
        sh 'docker compose -f docker-compose.yml build'
        sh 'echo "Run your production deployment command here (e.g., docker stack deploy or kubectl apply)."'
      }
    }
  }
}
