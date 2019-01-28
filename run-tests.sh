#!/bin/bash -e
#
# Jenkins launch script.
# Use:
#   bash run-tests.sh 'namespace1 namespace2 ...' [--service=fence]
#



help() {
  cat - <<EOM
Jenkins test launch script.  Assumes the  GEN3_HOME environment variable
references a current [cloud-automation](https://github.com/uc-cdis/cloud-automation) folder.

Use:
  bash run-tests.sh [[--namespace=]KUBECTL_NAMESPACE] [--service=service] [--dryrun]
    --namespace default is KUBECTL_NAMESPACE:-default
    --service default is service:-none
EOM
}

isDryRun=false

dryrun() {
  local command
  command="$@"
  if [[ "$isDryRun" == false ]]; then
    echo "Running: $command" 1>&2
    eval "$command"
  else
    echo "DryRun - not running: $command" 1>&2
  fi
}

if [[ -z "$GEN3_HOME" ]]; then
  echo 'ERROR: GEN3_HOME environment not set - should reference cloud-automation/'
  exit 1
fi

source "${GEN3_HOME}/gen3/lib/utils.sh"
gen3_load "gen3/gen3setup"

namespaceList="${KUBECTL_NAMESPACE:-default}"
service="${service:-""}"

while [[ $# -gt 0 ]]; do
  key="$(echo "$1" | sed -e 's/^-*//' | sed -e 's/=.*$//')"
  value="$(echo "$1" | sed -e 's/^.*=//')"
  case "$key" in
    help)
      help
      exit 0
      ;;
    service)
      service="$value"
      ;;
    namespace)
      namespaceList="$value"
      ;;
    dryrun)
      isDryRun=true
      ;;
    *)
      if [[ -n "$value" && "$value" == "$key" ]]; then
        # treat dangling option as namespace for backward compatability
        namespaceList="$value"
      else
        echo "ERROR: unknown option $1"
        help
        exit 1
      fi
      ;;
  esac
  shift
done


cat - <<EOM
Running with:
  namespace=$namespaceList
  service=$service
EOM

echo 'INFO: installing dependencies'
dryrun npm ci

exitCode=0
lockUser=""

testArgs="--debug --verbose --reporter mocha-junit-reporter"
#
# DCF tests are not yet stable enough to run in fence PR's -
# so just enable in gen3-qa PR's for now
#
#if [[ "$service" != "fence" && "$service" != "gen3-qa" ]]; then
if [[ "$service" != "gen3-qa" && "$service" != "fence" && "$service" != "cdis-manifest" ]]; then
  # run all tests except for those that require dcf google configuration
  testArgs="${testArgs} --grep @reqGoogle --invert"
  echo 'INFO: disabling DCF tests for testing non-fence service'
else
  # Run tests including dcf google backend
  lockUser="testRunner-${namespaceList}-$$"
  echo 'INFO: enabling DCF tests for testing fence service'
  if ! (
    #
    # acquire the freakin' global DCF lock
    # all of our test environment's share the same
    # backend DCF google project and CloudIdentity,
    # so only want one DCF test running globally at a time
    #
    export KUBECTL_NAMESPACE=default
    count=0
    gotLock=false
    while [[ $count -lt 10 && $gotLock == false ]]; do
      echo 'INFO: waiting to lock the DCF test google project'
      if dryrun gen3 klock lock dcftest "$lockUser" 300 -w 60; then
        gotLock=true
      fi
    done
    if [[ $gotLock == true ]]; then
      echo "Acquired the DCF lock"
    else
      echo "Failed to acquire the DCF lock after 10 minutes - bailing out"
      exit 1
    fi
  ); then exit 1; fi
fi

for name in ${namespaceList}; do
  (
    export NAMESPACE="$name"
    cat - <<EOM

---------------------------
Launching test in $NAMESPACE
EOM
    dryrun npm test -- $testArgs
  )
  if [[ $? -ne 0 ]]; then exitCode=1; fi
done

if [[ -n "$lockUser" ]]; then
  (
    # release the dcf lock
    export KUBECTL_NAMESPACE=default
    dryrun gen3 klock unlock dcftest "$lockUser"
  )
fi

exit $exitCode
