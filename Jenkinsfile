#!groovy

pipeline {
  agent any

  stages {
    stage('FetchCode') {
      steps {
        dir('gen3-qa') {
          checkout scm
          /*
          git(
            url: 'https://github.com/uc-cdis/gen3-qa.git',
            branch: 'fix/k8s'
          )
          */
        }
        dir('cdis-manifest') {
          git(
            url: 'https://github.com/uc-cdis/gitops-qa.git',
            branch: 'master'
          )
        }
        dir('cloud-automation') {
          git(
            url: 'https://github.com/uc-cdis/cloud-automation.git',
            branch: 'master'
          )
          script {
            env.GEN3_HOME = env.WORKSPACE + '/cloud-automation';
          }
        }
        dir('data-simulator') {
          git(
            url: 'https://github.com/occ-data/data-simulator.git',
            branch: 'master'
          )
        }
      }
    }
    stage('SelectNamespace') {
      steps {
        script {
          String[] namespaces = ['jenkins-brain']
          int modNum = namespaces.length/2
          int randNum = 0;  // always use jenkins-brain for now (new Random().nextInt(modNum) + ((env.EXECUTOR_NUMBER as Integer) * 2)) % namespaces.length

          if( ! env.KUBECTL_NAMESPACE ) {
            env.KUBECTL_NAMESPACE = namespaces[randNum];
          }
          println "selected namespace $env.KUBECTL_NAMESPACE on executor $env.EXECUTOR_NUMBER"
          println "attempting to lock namespace with a wait time of 5 minutes"
          uid = BUILD_TAG.replaceAll(' ', '_').replaceAll('%2F', '_')
          sh("bash cloud-automation/gen3/bin/klock.sh lock jenkins "+uid+" 3600 -w 300")
        }
      }
    }
    stage('K8sDeploy') {
      when {
        environment name: 'DEPLOY_K8S', value: "true"
      }
      steps {
        withEnv(['GEN3_NOPROXY=true', "vpc_name=$env.KUBECTL_NAMESPACE", "GEN3_HOME=$env.WORKSPACE/cloud-automation"]) {
          echo "GEN3_HOME is $env.GEN3_HOME"
          echo "GIT_BRANCH is $env.GIT_BRANCH"
          echo "GIT_COMMIT is $env.GIT_COMMIT"
          echo "KUBECTL_NAMESPACE is $env.KUBECTL_NAMESPACE"
          echo "WORKSPACE is $env.WORKSPACE"
          echo "GEN3_HOME is $env.GEN3_HOME"
          sh "bash cloud-automation/gen3/bin/kube-roll-all.sh"
          sh "bash cloud-automation/gen3/bin/kube-wait4-pods.sh || true"
          sh "bash ./gen3-qa/check-pod-health.sh"
        }
      }
    }
    stage('RunTests') {
      steps {
        dir('gen3-qa') {
          withEnv(['GEN3_NOPROXY=true', "vpc_name=$env.KUBECTL_NAMESPACE", "GEN3_HOME=$env.WORKSPACE/cloud-automation", "NAMESPACE=$env.KUBECTL_NAMESPACE", "TEST_DATA_PATH=$env.WORKSPACE/testData/"]) {
            sh "bash ./jenkins-simulate-data.sh $env.KUBECTL_NAMESPACE"
            sh "bash ./run-tests.sh $env.KUBECTL_NAMESPACE"
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
      archiveArtifacts artifacts: '**/output/*.png', fingerprint: true
      //slackSend color: 'bad', message: "https://jenkins.planx-pla.net $env.JOB_NAME pipeline failed"
    }
    unstable {
      echo "Unstable!"
      //slackSend color: 'bad', message: "https://jenkins.planx-pla.net $env.JOB_NAME pipeline unstable"
    }
    always {
      script {
        uid = BUILD_TAG.replaceAll(' ', '_').replaceAll('%2F', '_')
        sh("bash cloud-automation/gen3/bin/klock.sh unlock jenkins "+uid)
      }
      junit "gen3-qa/output/*.xml"
    }
  }
}
