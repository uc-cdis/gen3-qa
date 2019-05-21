#!/bin/bash -e
#
# Jenkins launch script.
# Use:
#   bash run-tests.sh 'namespace1 namespace2 ...' [--service=fence] [--testedEnv=testedEnv]
#

help() {
  cat - <<EOM
Jenkins test launch script.  Assumes the  GEN3_HOME environment variable
references a current [cloud-automation](https://github.com/uc-cdis/cloud-automation) folder.

Use:
  bash run-tests.sh [[--namespace=]KUBECTL_NAMESPACE] [--service=service] [--testedEnv=testedEnv] [--dryrun]
    --namespace default is KUBECTL_NAMESPACE:-default
    --service default is service:-none
    --testedEnv default is testedEnv:-none (for cdis-manifest PRs, specifies which environment is being tested, to know which tests are relevant)
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


# environments that use Google Data Access features
# we only run Google Data Access tests for cdis-manifest PRs to these
envsRequireGoogle="dcp.bionimbus.org gen3.datastage.io nci-crdc-staging.datacommons.io nci-crdc.datacommons.io"


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
testedEnv="${testedEnv:-""}"

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
    testedEnv)
      testedEnv="$value"
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


#
# Google Data Access tests are only required for some envs
#
if [[ "$service" != "gen3-qa" && "$service" != "fence" && !("$service" == "cdis-manifest" && $envsRequireGoogle =~ (^| )$testedEnv($| )) ]]; then
  # run all tests except for those that require google configuration
  echo "INFO: disabling Google Data Access tests for $service"
  donot '@reqGoogle'
else
  #
  # Run tests including google backend
  #
  echo "INFO: enabling Google Data Access tests for $service"
fi

# TODO: eventually enable for all services, but need arborist and fence updates first
#       in all environments
if [[ "$service" != "arborist" && "$service" != "gen3-qa" && "$service" != "fence" ]]; then
  echo "INFO: disabling Centralized Auth tests for $service"
  donot '@centralizedAuth'
  donot '@indexdJWT'
else
  echo "INFO: enabling Centralized Auth tests for $service"
fi

# Disable performance testing for gen3-qa PRs
if [[ "$service" != "gen3-qa" ]]; then
  echo "INFO: disabling performance tests for $service"
  donot '@Performance'
else
  echo "INFO: enabling performance tests for $service"
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

exit $exitCode
