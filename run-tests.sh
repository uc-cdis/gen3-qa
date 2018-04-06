#!/bin/bash -e
#
#

_RUN_TESTS=$(dirname "${BASH_SOURCE:-$0}")  # $0 supports zsh

cd "${_RUN_TESTS}"
npm install

namespaceList=$(kubectl get namespace -o json | jq -r '.items[].metadata.name')

if [[ $? -ne 0 ]]; then
  echo "ERROR: failed to retrieve kubernetes namespaces: $namespaceList"
  exit 1
fi


get_pod() {
  local name
  local namespace
  name="$1"
  namespace="${2:-default}"
  pod=$(kubectl --namespace $namespace get pods --output=jsonpath='{range .items[*]}{.metadata.name}  {"\n"}{end}' | grep -m 1 "$name")
  echo $pod
}

#
# Run a test in the specified namespace
#
runTest() {
  local namespace
  namespace="${1:-default}"
  (
    export KUBECTL_NAMESPACE="$namespace"
    export HOSTNAME=$(kubectl --namespace=${namespace} get configmaps global -ojsonpath='{.data.hostname}')
    if [[ $? -ne 0 || -z "$HOSTNAME" ]]; then
      echo "ERROR: failed to retrive HOST_NAME for namespace $namespace"
      return 1
    fi
    export ACCESS_TOKEN=$(kubectl --namespace=${namespace} exec $(get_pod fence $namespace) -- fence-create token-create --scopes openid,user,fence,data --type access_token --exp 1800 --username cdis.autotest@gmail.com)
    if [[ $? -ne 0 || -z "$ACCESS_TOKEN" ]]; then
      echo "ERROR: failed to retrieve ACCESS_TOKEN for namespace $namespace"
      return 1
    fi
    cat - <<EOM
  =========================================
  Running test in $namespace
  HOSTNAME=$HOSTNAME

EOM
    # Don't actually run the tests yet ... :-p
    echo npm run test
  )
}

exitCode=0
for name in ${namespaceList}; do
  if [[ "$name" == "default" || "$name" =~ ^qa- ]]; then
    runTest "$name"
    if [[ $? -ne 0 ]]; then exitCode=1; fi
  fi
done

exit $exitCode
