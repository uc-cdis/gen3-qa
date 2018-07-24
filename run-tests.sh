#!/bin/bash -e
#
#

_RUN_TESTS="$PWD"
_ROOT_DIR="$(dirname "$PWD")"
_GEN_DATA="$_ROOT_DIR/data-simulator"

export TEST_DATA_PATH="$_ROOT_DIR/TestData/"

cd "${_RUN_TESTS}"
npm install

namespaceList="${1:-default}" 

if [[ -n "$GEN3_HOME" ]]; then  # load gen3 tools from cloud-automation
  source "${GEN3_HOME}/gen3/lib/utils.sh"
  gen3_load "gen3/gen3setup"
fi

#
# Run a test in the specified namespace
#
runTest() {
  cd "${_RUN_TESTS}"

  local namespace
  namespace="${1:-default}"
  echo $namespace
  
  (
    if [[ -n "$GEN3_HOME" ]]; then
      echo "Acquiring tokens for test authentication"
      if [[ -n "$namespace" && "$namespace" != "default" ]]; then
        export KUBECTL_NAMESPACE="$namespace"
      fi
      export HOSTNAME=$(g3kubectl get configmaps global -ojsonpath='{.data.hostname}')
      if [[ $? -ne 0 || -z "$HOSTNAME" ]]; then
        echo "ERROR: failed to retrive HOST_NAME for namespace $namespace"
        return 1
      fi

      export ACCESS_TOKEN=$(g3kubectl exec $(gen3 pod fence $namespace) -- fence-create token-create --scopes openid,user,fence,data,credentials --type access_token --exp 1800 --username cdis.autotest@gmail.com)
      if [[ $? -ne 0 || -z "$ACCESS_TOKEN" ]]; then
        echo "ERROR: failed to retrieve ACCESS_TOKEN for namespace $namespace"
        return 1
      fi
      export EXPIRED_ACCESS_TOKEN=$(g3kubectl exec $(gen3 pod fence $namespace) -- fence-create token-create --scopes openid,user,fence,data,credentials --type access_token --exp 1 --username cdis.autotest@gmail.com)
      if [[ $? -ne 0 || -z "$EXPIRED_ACCESS_TOKEN" ]]; then
        echo "ERROR: failed to retrieve EXPIRED_ACCESS_TOKEN for namespace $namespace"
        return 1
      fi
      qa_cred=$(g3kubectl get secret sheepdog-creds -o json | jq -r '.data["creds.json"]' | base64 --decode | egrep '(\s+"indexd_password":)' | sed 's/.*\("[A-Za-z0-9]\{8,\}"\).*/\1/' )
      export INDEX_USERNAME=gdcapi
      export INDEX_PASSWORD=$( [[ $qa_cred =~ ([A-Za-z0-9]{8,}+) ]] && echo ${BASH_REMATCH[1]} )
      if [[ $? -ne 0 || -z "$INDEX_PASSWORD" ]]; then
        echo "ERROR: failed to retrieve INDEX_PASSWORD for namespace $namespace"
        return 1
      fi
    else
      cat - <<EOM
GEN3_HOME environment not set, so gen3 tools not available -
please manually set the environment variables necessary to
run the integration test suite:
  HOSTNAME
  ACCESS_TOKEN 
  EXPIRED_ACCESS_TOKEN
  INDEX_USERNAME
  INDEX_PASSWORD
  
EOM
    fi
    cat - <<EOM
Running test in $namespace
HOSTNAME=$HOSTNAME

EOM
    npm run custom
    # see https://codecept.io/reports/
    ./node_modules/.bin/codeceptjs run --debug --verbose --reporter mocha-junit-reporter
  )
}

#
# Generate data for a specified namespace
#
genData() {
  local namespace
  namespace="${1:-default}"
  echo $namespace

  cd "${_GEN_DATA}"

  projectName=test
  nData=1
  dictURL=$(g3kubectl get configmaps global -o json | jq -r '.data.dictionary_url')
  if [[ $? -ne 0 || -z "dictURL" ]]; then
    echo "ERROR: failed to retrieve dictionary_url for namespace $namespace"
    return 1
  fi

  mkdir -p $TEST_DATA_PATH

  rCMD="Rscript GenTestDataCmd.R $dictURL $projectName $nData $TEST_DATA_PATH"
  echo $rCMD
  eval $rCMD
  if [[ $? -ne 0 ]]; then return 1; fi
}

exitCode=0
for name in ${namespaceList}; do
  if [[ "$name" == "default" || "$name" =~ ^qa- ]]; then
    genData "$name"
    if [[ $? -ne 0 ]]; then exitCode=1; fi
    runTest "$name"
    if [[ $? -ne 0 ]]; then exitCode=1; fi
  fi
done

exit $exitCode
