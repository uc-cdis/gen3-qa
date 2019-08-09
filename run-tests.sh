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
#   $1 test tag to avoid until service version is greater than last arg
#   $2 service name
#   $3 version of service where tests apply >=
#
# ex: runTestsIfServiceVersion "@multipartupload" "fence" "3.0.0"
runTestsIfServiceVersion() {
  # make sure args provided
  if [[ -z "$1" || -z "$2" || -z "$3" ]]; then
    return 0
  fi

  local currentVersion
  currentVersion=$(getServiceVersion $2)

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
    echo "RUNNING $1 tests b/c $2 version ($currentVersion) is greater than $3"
  else
    echo "SKIPPING $1 tests b/c $2 version ($currentVersion) is less than $3"
    donot $1
  fi
}

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

doNotRunRegex=""

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
  testedEnv=$testedEnv
EOM

echo 'INFO: installing dependencies'
dryrun npm ci

################################ Disable Test Tags #####################################

runTestsIfServiceVersion "@multipartUpload" "fence" "2.8.0"
runTestsIfServiceVersion "@multipartUploadFailure" "fence" "3.0.0"
runTestsIfServiceVersion "@centralizedAuth" "fence" "3.0.0"
runTestsIfServiceVersion "@dbgapSyncing" "fence" "3.0.0"

# environments that use DCF features
# we only run Google Data Access tests for cdis-manifest PRs to these
envsRequireGoogle="dcp.bionimbus.org gen3.datastage.io nci-crdc-staging.datacommons.io nci-crdc.datacommons.io"

#
# DataClientCLI tests require a fix to avoid parallel test runs
# contending over config files in the home directory
#
donot '@dataClientCLI'

# Do not run performance testing
donot '@Performance'

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
if [[ "$service" == "cdis-manifest" ]]; then
  echo "INFO: disabling Centralized Auth tests for $service"
  donot '@centralizedAuth'
  donot '@indexdJWT'
else
  echo "INFO: enabling Centralized Auth tests for $service"
fi

echo "Checking kubernetes for optional services to test"
if ! (g3kubectl get pods --no-headers -l app=spark | grep spark) > /dev/null 2>&1; then
  donot '@etl'
fi
if ! (g3kubectl get pods --no-headers -l app=ssjdispatcher | grep ssjdispatcher) > /dev/null 2>&1; then
  # do not run data upload tests if the data upload flow is not deployed
  donot '@dataUpload'
fi
if ! (g3kubectl get pods --no-headers -l app=guppy | grep guppy) > /dev/null 2>&1; then
  # do not run Guppy API tests if Guppy is not deployed
  donot '@guppyAPI'
fi


if [[ -z "$TEST_DATA_PATH" ]]; then
  echo "ERROR: TEST_DATA_PATH env var is not set--cannot find schema in run-tests.sh."
  exit 1
fi
if ! jq -re '.|values|map(select(.data_file_properties.consent_codes!=null))|.[]' < "$TEST_DATA_PATH/schema.json" > /dev/null; then
  # do not run tests for consent codes in indexd records if the dictionary's data_file_properties doesn't have consent_codes
  donot '@indexRecordConsentCodes'
fi

#
# try to read configs of portal 
#
hostname="$(g3kubectl get configmaps manifest-global -o json | jq -r '.data.hostname')"
portalApp="$(g3kubectl get configmaps manifest-global -o json | jq -r '.data.portal_app')"
portalConfigURL="https://${hostname}/data/config/${portalApp}.json"

if ! (g3kubectl get pods --no-headers -l app=manifestservice | grep manifestservice) > /dev/null 2>&1 ||
! (g3kubectl get pods --no-headers -l app=wts | grep wts) > /dev/null 2>&1; then
  donot '@exportToWorkspaceAPI'
  donot '@exportToWorkspacePortalGeneral'
  donot '@exportToWorkspacePortalJupyterHub'
  donot '@exportToWorkspacePortalHatchery'
elif [[ $(curl -s "$portalConfigURL" | jq 'contains({dataExplorerConfig: {buttons: [{enabled: true, type: "export-to-workspace"}]}}) | not') == "true" ]] || 
[[ ! -z "$testedEnv" ]]; then 
  # do not run export to workspace portal tests if not enabled or in a manifest PR
  donot '@exportToWorkspacePortalGeneral'
  donot '@exportToWorkspacePortalJupyterHub'
  donot '@exportToWorkspacePortalHatchery'
elif ! (g3kubectl get pods --no-headers -l app=jupyter-hub | grep jupyterhub) > /dev/null 2>&1; then
  donot '@exportToWorkspacePortalJupyterHub'
elif ! (g3kubectl get pods --no-headers -l app=hatchery | grep hatchery) > /dev/null 2>&1 || 
! (g3kubectl get pods --no-headers -l service=ambassador | grep ambassador) > /dev/null 2>&1; then
  donot '@exportToWorkspacePortalHatchery'
fi

########################################################################################

testArgs="--reporter mocha-multi"

if [[ -n "$doNotRunRegex" ]]; then
  testArgs="${testArgs} --grep '${doNotRunRegex}' --invert"
fi

exitCode=0

(
  export NAMESPACE="$namespaceName"
  cat - <<EOM

---------------------------
Launching test in $NAMESPACE
EOM
  dryrun npm 'test' -- $testArgs
  # 
  # Do this kind of thing (uncomment the following line, change the grep) 
  # to limit your test run in jenkins:
  #    dryrun npm 'test' -- --reporter mocha-multi --verbose --grep '@FRICKJACK'
) || exitCode=1

exit $exitCode
