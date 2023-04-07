#!/bin/bash -e
#
# Jenkins launch script.
# Use:
#   bash run-tests-by-tag.sh '<namespace>' [--testedEnv=<testedEnv>] [--seleniumTimeout] [--selectedTag=<selectedTag>] [--debug=<debug>]
#

set -xe

help() {
  cat - <<EOM
Jenkins test launch script.  Assumes the  GEN3_HOME environment variable
references a current [cloud-automation](https://github.com/uc-cdis/cloud-automation) folder.

Use:
  bash run-tests-annotated.sh [[--namespace=]KUBECTL_NAMESPACE] [--testedEnv=testedEnv] [--selectedTag=selectedTag] [--seleniumTimeout=timeout] [--debug=debug]
    --namespace default is KUBECTL_NAMESPACE:-default
    --testedEnv default is testedEnv:-none (for cdis-manifest PRs, specifies which environment is being tested, to know which tests are relevant)
    --seleniumTimeout default is 3600
    --selectedTag required
    --debug default is "true" (run tests in debug mode)
EOM
}

#----------------------------------------------------
# main
#

if [[ -z "$GEN3_HOME" ]]; then
  echo "ERROR: GEN3_HOME environment not set - should reference cloud-automation/"
  exit 1
fi

source "${GEN3_HOME}/gen3/lib/utils.sh"
gen3_load "gen3/gen3setup"

namespaceName="${KUBECTL_NAMESPACE}"
testedEnv="${testedEnv:-""}"
seleniumTimeout="${seleniumTimeout:3600}"
selectedTag="${selectedTag}"
debug="${debug:true}"

while [[ $# -gt 0 ]]; do
  key="$(echo "$1" | sed -e 's/^-*//' | sed -e 's/=.*$//')"
  value="$(echo "$1" | sed -e 's/^.*=//')"
  case "$key" in
    help)
      help
      exit 0
      ;;
    namespace)
      namespaceName="$value"
      ;;
    testedEnv)
      testedEnv="$value"
      ;;
    seleniumTimeout)
      seleniumTimeout="$value"
      ;;
    selectedTag)
      selectedTag="$value"
      ;;
    debug)
      debug="$value"
      ;;
    *)
      if [[ -n "$value" && "$value" == "$key" ]]; then
        # treat dangling option as namespace for backward compatability
        namespaceName="$value"
      else
        echo "ERROR: unknown option $1"
        help
        exit 1
      fi
      ;;
  esac
  shift
done

if [[ -z "$namespaceName" || -z "$selectedTag" ]]; then
  echo "USE: --namespace=NAME and --selectedTag=TAG are required arguments"
  help
  exit 0
fi

if [[ -z "$KUBECTL_NAMESPACE" ]]; then
  # namespace key for g3kubectl
  KUBECTL_NAMESPACE="$namespaceName"
fi

if [[ "$KUBECTL_NAMESPACE" != "$namespaceName" ]]; then
  echo -e "$(red_color "ERROR: KUBECTL_NAMESPACE environment does not match --namespace option: $KUBECTL_NAMESPACE != $namespaceName")\n"
  help
  exit 1
fi

if [[ "$JENKINS_HOME" != "" && "$RUNNING_LOCAL" == "false" ]]; then
  # Set HOME environment variable as the current PR workspace
  # to avoid conflicts between gen3 CLI (cdis-data-client) profile configurations
  export HOME=$WORKSPACE
fi

cat - <<EOM
Running with:
  namespace=$namespaceName
  service=$service
  testedEnv=$testedEnv
  seleniumTimeout=$seleniumTimeout
  selectedTag=$selectedTag
  degub=$debug
EOM

echo 'INFO: installing dependencies'
npm ci

#### Gen3 QA in a BOX ############################################################################

if [[ "$(hostname)" == *"cdis-github-org"* ]] || [[ "$(hostname)" == *"planx-ci-pipeline"* ]]; then
  echo "inside an ephemeral gen3-qa-in-a-box pod..."
  
  # Start selenium process within the ephemeral jenkins pod.
  # npx selenium-standalone install --version=4.0.0-alpha-7 --drivers.chrome.version=96.0.4664.45 --drivers.chrome.baseURL=https://chromedriver.storage.googleapis.com
  chromeVersion=$(google-chrome --version | grep -Eo '[0-9.]{10,20}' | cut -d '.' -f 1-3)
  chromeDriverVersion=$(curl -s https://chromedriver.storage.googleapis.com/LATEST_RELEASE_$chromeVersion)
  npx selenium-standalone install --drivers.chrome.version=$chromeDriverVersion --drivers.chrome.baseURL=https://chromedriver.storage.googleapis.com
  timeout $seleniumTimeout npx selenium-standalone start --drivers.chrome.version=$chromeDriverVersion &

  # gen3-qa-in-a-box requires a couple of changes to its webdriver config
  set +e
  mv gen3.qa.in.a.box.codecept.conf.js codecept.conf.js
  cat codecept.conf.js
  set -e
else
  echo "NOT inside an ephemeral gen3-qa-in-a-box pod..."
fi

##################################################################################################

DEBUG=$debug npm test -- --reporter mocha-multi --verbose --grep "(?=.*\\$selectedTag)^(?!.*@manual)"

##################################################################################################

# When zero tests are executed, a results*.xml file is produced containing a tests="0" counter
# e.g., output/result57f4d8778c4987bda6a1790eaa703782.xml
# <testsuites name="Mocha Tests" time="0.0000" tests="0" failures="0">
[ "$(ls -A output)" ] && ls output/result*.xml || echo "Warn: there are no output/result-*.xml files to parse"

set +e

cat output/result*.xml  | head -n2 | sed -n -e 's/^<testsuites.*\(tests\=.*\) failures.*/\1/p'

zeroTests=$(cat output/result*.xml  | head -n2 | sed -n -e 's/^<testsuites.*\(tests\=.*\) failures.*/\1/p' | grep "tests=\"0\"")

set -e

if [ -n "$zeroTests" ]; then
  echo "No tests have been executed, aborting PR check..."
  npm test -- --verbose suites/fail.js
  exitCode=1
fi

echo "Testing done at $(date)" > output/gen3-qa.log

exit $exitCode
