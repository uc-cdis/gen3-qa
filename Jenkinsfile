#!groovy

@Library('cdis-jenkins-lib@chore/skip_all_tests_if_pr_is_draft') _

testPipeline {
  // tell the pipeline to not checkout `gen3-qa:master`
  JOB_NAME = 'gen3-qa'
}
