#!groovy

@Library('cdis-jenkins-lib@fix/dcf') _

testPipeline {
  // doing this will kick the DCF tests to run (which only run for fence)
  JOB_NAME=fence
  // fence:master image
  GIT_BRANCH=master
}
