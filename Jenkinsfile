#!groovy

pipeline {
  agent any

  stages {
    stage('FetchCode') {
      steps {
        dir('gen3-qa') {
          checkout scm
        }
        dir('cdis-manifest') {
          git(
            url: 'https://github.com/uc-cdis/cdis-manifest.git',
            branch: 'QA'
          )
        }
        dir('cloud-automation') {
          git(
            url: 'https://github.com/uc-cdis/cloud-automation.git',
            branch: 'fix/google-json'
          )
        }
      }
    }
    stage('K8sDeploy') {
      steps {
        withEnv(['GEN3_NOPROXY=true', 'vpc_name=qaplanetv1']) {
          echo "GIT_BRANCH is $env.GIT_BRANCH"
          echo "GIT_COMMIT is $env.GIT_COMMIT"
          echo "WORKSPACE is $env.WORKSPACE"
          sh "bash cloud-automation/gen3/bin/kube-roll-all.sh"
        }
      }
    }
    stage('RunInstall') {
      steps {
        dir('gen3-qa') {
          withEnv(['GEN3_NOPROXY=true']) {
            sh "bash ./run-install.sh"
          }
        }
      }
    }
    stage('RunTests') {
      steps {
        dir('gen3-qa') {
          withEnv(['GEN3_NOPROXY=true']) {
            sh "bash ./run-tests.sh"
          }
        }
      }
    }
  }
  post {
    success {
      echo "https://jenkins.planx-pla.net/ $env.JOB_NAME pipeline succeeded"
    }
    failure {
      echo "Failure!"
      //slackSend color: 'bad', message: "https://jenkins.planx-pla.net $env.JOB_NAME pipeline failed"
    }
    unstable {
      echo "Unstable!"
      //slackSend color: 'bad', message: "https://jenkins.planx-pla.net $env.JOB_NAME pipeline unstable"
    }
  }
}
