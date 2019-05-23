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

# Takes one argument, being service name
getServiceVersion() {
  local command
  local response
  local version
  command="g3kubectl get configmap manifest-versions -o json | jq -r .data.json | jq -r .$1"
  response=$(eval "$command")

  # Get last item of delimited string using string operators:
  #    https://www.linuxjournal.com/article/8919
  version=${response##*:}
  echo $version
}

# Takes 3 arguments:
#   $1 service name
#   $2 test tag to avoid until version is greater than next arg
#   $3 versio of service where tests apply >=
#
# ex: runServiceTestsIfVersion "fence" "@multipartupload" "3.0.0"
runServiceTestsIfVersion() {
  local currentVersion
  currentVersion=$(getServiceVersion $1)

  # check if currentVersion is actually a number
  # NOTE: this assumes that all releases are tagged with actual numbers like:
  #       2.8.0, 3.0.0, 3.0, 0.2, 0.2.1.5, etc
  re='[0-9]+([.][0-9])+'
  if ! [[ $currentVersion =~ $re ]] ; then
    # force non-version numbers (e.g. branches and master)
    # to be some arbitrary large number, so that it will
    # cause next comparison to run the optional test.
    # NOTE: The assumption here is that branches and master should run all the tests,
    #       if you've branched off an old version that actually should NOT run the tests..
    #       this script cannot currently handle that
    # hopefully our service versions are never "OVER 9000!"
    versionAsNumber=9000
  else
    # version is actually a pinned number, not a branch name or master
    versionAsNumber=$currentVersion
  fi

  min=$(echo "$3" "$versionAsNumber" | awk '{if ($1 < $2) print $1; else print $2}')
  if [ "$min" = "$3" ]; then
    echo "RUNNING $2 tests b/c $1 version ($currentVersion) is greater than $3"
  else
    echo "SKIPPING $2 tests b/c $1 version ($currentVersion) is less than $3"
    donot $2
  fi
}


# environments that use DCF features
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
# Google Data Access tests are not yet stable enough to run in all PR's -
# so just enable in PR's for some projects now
#
if [[ "$service" != "gen3-qa" && "$service" != "fence" && !("$service" == "cdis-manifest" && $envsRequireGoogle =~ (^| )$testedEnv($| )) ]]; then
  # run all tests except for those that require dcf google configuration
  echo "INFO: disabling Google Data Access tests for $service"
  donot '@reqGoogle'
else
  #
  # Run tests including dcf google backend
  # Acquire google test lock - only one test can interact with the GCP test project
  #
  echo "INFO: enabling Google Data Access tests for $service"
fi


echo "Checking kubernetes for optional services to test"
if ! (g3kubectl get pods --no-headers -l app=spark | grep spark) > /dev/null 2>&1; then
  donot '@etl'
fi
if ! (g3kubectl get pods --no-headers -l app=ssjdispatcher | grep ssjdispatcher) > /dev/null 2>&1; then
  # do not run data upload tests if the data upload flow is not deployed
  donot '@dataUpload'
# else
#   if [[ "$service" == "cdis-manifest" ]]; then
#     # do not run multipart upload tests in cdis-manifest
#     # (reenable when all commons have fence>=2.8.0)
#     donot '@multipartUpload'
#   fi
fi

runServiceTestsIfVersion "fence" "@multipartUpload" "2.8.0"

testArgs="--reporter mocha-multi"
if [[ -n "$doNotRunRegex" ]]; then
  testArgs="${testArgs} --grep '${doNotRunRegex}' --invert"
fi

echo $testArgs

(
  export NAMESPACE="$namespaceName"
  cat - <<EOM

---------------------------
Launching test in $NAMESPACE
EOM
  dryrun npm test -- $testArgs
) || exitCode=1

exit $exitCode
