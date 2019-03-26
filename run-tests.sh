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
  bash run-tests.sh [[--namespace=]KUBECTL_NAMESPACE] [--service=service] [--hostname=hostname] [--dryrun]
    --namespace default is KUBECTL_NAMESPACE:-default
    --service default is service:-none
    --hostname default is hostname:-none
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

#
# DataClientCLI tests require a fix to avoid parallel test runs
# contending over config files in the home directory
#      
doNotRunRegex="@dataClientCLI"

# little helper to maintain doNotRunRegex
donot() {
  local or
  if [[ -z "$1" ]]; then
    return 0
  fi
  or='|'
  if [[ -z "$doNotRunRegex" ]]; then
    or=''
  fi
  doNotRunRegex="${doNotRunRegex}${or}$1"
}

# Do not run performance testing
donot '@Performance'

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
service="${service:-""}"
hostname="${hostname:-""}"

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
      namespaceName="$value"
      ;;
    hostname)
      hostname="$value"
      ;;
    dryrun)
      isDryRun=true
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

if [[ -z "$namespaceName" || -z "$service" ]]; then
  echo "USE: --namespace=NAME and --service=SERVICE are required arguments"
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

cat - <<EOM
Running with:
  namespace=$namespaceName
  service=$service
EOM

echo 'INFO: installing dependencies'
dryrun npm ci

exitCode=0
lockUser=""


# hostnames that use DCF features
# we will run Google Data Access tests for cdis-manifest PRs to these
requireGoogleHostnames="dcp.bionimbus.org gen3.datastage.io nci-crdc-demo.datacommons.io nci-crdc-staging.datacommons.io nci-crdc.datacommons.io"

#
# Google Data Access tests are not yet stable enough to run in all PR's -
# so just enable in PR's for some projects now
#
if [[ "$service" != "gen3-qa" && "$service" != "fence" && !("$service" == "cdis-manifest" && $requireGoogleHostnames =~ (^| )$hostname($| )) ]]; then
  # run all tests except for those that require dcf google configuration
  echo "INFO: disabling Google Data Access tests for $service"
  donot '@reqGoogle'
else
  #
  # Run tests including dcf google backend
  # Acquire google test lock - only one test can interact with the GCP test project
  #
  lockUser="testRunner-${namespaceName}-$$"
  echo "INFO: enabling Google Data Access tests for $service"
fi


echo "Checking kubernetes for optional services to test"
if ! (g3kubectl get pods --no-headers -l app=spark | grep spark) > /dev/null 2>&1; then
  donot '@etl'
fi
if ! (g3kubectl get pods --no-headers -l app=ssjdispatcher | grep ssjdispatcher) > /dev/null 2>&1; then
  donot '@dataUpload'
fi

testArgs="--reporter mocha-multi"
if [[ -n "$doNotRunRegex" ]]; then
  testArgs="${testArgs} --grep '${doNotRunRegex}' --invert"
fi

(
  export NAMESPACE="$namespaceName"
  cat - <<EOM

---------------------------
Launching test in $NAMESPACE
EOM
  dryrun npm test -- $testArgs
) || exitCode=1

if [[ -n "$lockUser" ]]; then
  (
    # release the dcf lock
    export KUBECTL_NAMESPACE=default
    dryrun gen3 klock unlock dcftest "$lockUser"
  )
fi

exit $exitCode
