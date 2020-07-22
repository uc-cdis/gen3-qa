#!/bin/bash -e
#
# Jenkins launch script.
# Use:
#   bash run-tests.sh 'namespace1 namespace2 ...' [--service=fence] [--testedEnv=testedEnv] [--isGen3Release=isGen3Release] [--selectedTest=selectedTest]
#

set -xe

help() {
  cat - <<EOM
Jenkins test launch script.  Assumes the  GEN3_HOME environment variable
references a current [cloud-automation](https://github.com/uc-cdis/cloud-automation) folder.

Use:
  bash run-tests.sh [[--namespace=]KUBECTL_NAMESPACE] [--service=service] [--testedEnv=testedEnv] [--isGen3Release=isGen3Release] [--selectedTest=selectedTest] [--dryrun]
    --namespace default is KUBECTL_NAMESPACE:-default
    --service default is service:-none
    --testedEnv default is testedEnv:-none (for cdis-manifest PRs, specifies which environment is being tested, to know which tests are relevant)
    --isGen3Release default is "false"
    --selectedTest default is selectedTest:-none
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


# Takes 3 required and 1 optional arguments:
#   $1 test tag to avoid until service version is greater than last arg
#   $2 service name
#   $3 version of service where tests apply >=
#   $4 version of service where tests apply >=, in monthly release (2020.xx) format
#
# ex: runTestsIfServiceVersion "@multipartupload" "fence" "3.0.0"
# or: runTestsIfServiceVersion "@multipartupload" "fence" "3.0.0" "2020.01"
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

  min=$(printf "2020\n$versionAsNumber\n" | sort -V | head -n1)
  if [[ "$min" = "2020" && -n "$4" ]]; then
    # 1. versionAsNumber >=2020, so assume it is a monthly release (or it was a branch
    #    and is now 9000, in which case it will still pass the check as expected)
    # 2. monthly release version arg was provided
    # So, do the version comparison based on monthly release version arg
    min=$(printf "$4\n$versionAsNumber\n" | sort -V | head -n1)
    if [ "$min" = "$4" ]; then
      echo "RUNNING $1 tests b/c $2 version ($currentVersion) is greater than $4"
    else
      echo "SKIPPING $1 tests b/c $2 version ($currentVersion) is less than $4"
      donot $1
    fi
  else
    # versionAsNumber is normal semver tag
    min=$(printf "$3\n$versionAsNumber\n" | sort -V | head -n1)
    if [ "$min" = "$3" ]; then
      echo "RUNNING $1 tests b/c $2 version ($currentVersion) is greater than $3"
    else
      echo "SKIPPING $1 tests b/c $2 version ($currentVersion) is less than $3"
      donot $1
    fi
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
isGen3Release="${isGen3Release:false}"
selectedTest="${selectedTest:-"all"}"

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
    isGen3Release)
      isGen3Release="$value"
      ;;
    selectedTest)
      selectedTest="$value"
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
  isGen3Release=$isGen3Release
  selectedTest=$selectedTest
EOM

echo 'INFO: installing dependencies'
dryrun npm ci

################################ Disable Test Tags #####################################

runTestsIfServiceVersion "@multipartUpload" "fence" "2.8.0"
runTestsIfServiceVersion "@multipartUploadFailure" "fence" "3.0.0"
runTestsIfServiceVersion "@centralizedAuth" "fence" "3.0.0"
runTestsIfServiceVersion "@dbgapSyncing" "fence" "3.0.0"
runTestsIfServiceVersion "@indexRecordConsentCodes" "sheepdog" "1.1.13"
runTestsIfServiceVersion "@coreMetadataPage" "portal" "2.20.8"
runTestsIfServiceVersion "@indexing" "portal" "2.26.0" "2020.05"

# environments that use DCF features
# we only run Google Data Access tests for cdis-manifest PRs to these
envsRequireGoogle="dcp.bionimbus.org internalstaging.theanvil.io staging.theanvil.io gen3.theanvil.io preprod.gen3.biodatacatalyst.nhlbi.nih.gov internalstaging.datastage.io gen3.biodatacatalyst.nhlbi.nih.gov nci-crdc-staging.datacommons.io nci-crdc.datacommons.io"

#
# DataClientCLI tests require a fix to avoid parallel test runs
# contending over config files in the home directory
#
donot '@dataClientCLI'

# Do not run performance testing
donot '@Performance'

# Do not run manual tests
donot '@manual'

# Do not run force-fail tests
donot '@fail'

#
# Google Data Access tests are only required for some envs
#
if [[ "$isGen3Release" != "true" && "$service" != "gen3-qa" && "$service" != "fence" && !("$service" == "cdis-manifest" && $envsRequireGoogle =~ (^| )$testedEnv($| )) ]]; then
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

# Focus on GUI tests for data-portal
if [[ "$service" == "data-portal" ]]; then
  echo "INFO: disabling tests involving RESTful APIs & Gen3 CLI / Batch operations for $service"
  donot '@metadataIngestion'
  donot '@batch'
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

set +e
ddHasConsentCodes=$(jq -re '.|values|map(select(.data_file_properties.consent_codes!=null))|.[]' < "$TEST_DATA_PATH/schema.json")
set -e

if [ -z "$ddHasConsentCodes" ]; then
  # do not run tests for consent codes in indexd records if the dictionary's data_file_properties doesn't have consent_codes
  donot '@indexRecordConsentCodes'
fi

#
# try to read configs of portal 
#
hostname="$(g3kubectl get configmaps manifest-global -o json | jq -r '.data.hostname')"
portalApp="$(g3kubectl get configmaps manifest-global -o json | jq -r '.data.portal_app')"
portalConfigURL="https://${hostname}/data/config/${portalApp}.json"
portalVersion="$(g3kubectl get configmaps manifest-all -o json | jq -r '.data.json | fromjson.versions.portal')"

# do not run portal related tests for NDE portal
if [[ "$portalVersion" == *"data-ecosystem-portal"* ]]; then
  donot '@portal'
fi

# do not run top bar login test if version of portal is old
# update the version once this change is released
if ! [[ "$portalVersion" == *"master" ]]; then
  donot '@topBarLogin'
  donot '@loginRedirect'
fi

# check if manifest indexing jobs are set in sower block
# this is a temporary measure while PXP-4796 is not implemented
set +e
checkForPresenceOfManifestIndexingSowerJob=$(g3kubectl get cm manifest-sower -o yaml | grep manifest-indexing)
set -e
if [ -z "$checkForPresenceOfManifestIndexingSowerJob" ]; then
  echo "the manifest-indexing sower job was not found, skip @indexing tests"; 
  donot '@indexing'
fi

set +e
checkForPresenceOfMetadataIngestionSowerJob=$(g3kubectl get cm manifest-sower -o yaml | grep get-dbgap-metadata)
set -e
if [ -z "$checkForPresenceOfMetadataIngestionSowerJob" ]; then
  echo "the get-dbgap-metadata sower job was not found, skip @metadataIngestion tests";
  donot '@metadataIngestion'
fi

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

# set required vars
export NAMESPACE="$namespaceName"
if [[ "$testedEnv" == "ci-env-1.planx-pla.net" ]]; then
  export GCLOUD_DYNAMIC_PROJECT="gen3qa-ci-env-1-279903"
fi
export testedEnv="$testedEnv"

if [ "$selectedTest" == "all" ]; then
    # no interactive tests
    export GEN3_INTERACTIVE=false
    cat - <<EOM

---------------------------
Launching test in $NAMESPACE
EOM
    set +e
    dryrun npm 'test' -- $testArgs
    RC=$?
    #
    # Do this kind of thing (uncomment the following line, change the grep)
    # to limit your test run in jenkins:
    #    dryrun npm 'test' -- --reporter mocha-multi --verbose --grep '@FRICKJACK'
    exitCode=$RC
    set -e
else
  set +e
  additionalArgs=""
  foundReqGoogle=$(grep "@reqGoogle" ${selectedTest})
  foundDataClientCLI=$(grep "@dataClientCLI" ${selectedTest})
  if [ -n "$foundReqGoogle" ]; then
    additionalArgs="--grep @reqGoogle"
  elif [ -n "$foundDataClientCLI" ]; then
    additionalArgs="--grep @indexRecordConsentCodes|@dataClientCLI --invert"
  elif [[ "$selectedTest" == "suites/sheepdogAndPeregrine/submitAndQueryNodesTest.js" && -z "$ddHasConsentCodes" ]]; then
    additionalArgs="--grep @indexRecordConsentCodes --invert"
  else
    additionalArgs="--grep @manual --invert"
  fi
  set -e
  npm 'test' -- --reporter mocha-multi --verbose ${additionalArgs} ${selectedTest}
fi

# When zero tests are executed, a results*.xml file is produced containing a tests="0" counter
# e.g., output/result57f4d8778c4987bda6a1790eaa703782.xml
# <testsuites name="Mocha Tests" time="0.0000" tests="0" failures="0">
ls -ilha output/result*.xml
cat output/result*.xml  | head -n2 | sed -n -e 's/^<testsuites.*\(tests\=.*\) failures.*/\1/p'
set +e
zeroTests=$(cat output/result*.xml  | head -n2 | sed -n -e 's/^<testsuites.*\(tests\=.*\) failures.*/\1/p' | grep "tests=\"0\"")
set -e
if [ -n "$zeroTests" ]; then
  echo "No tests have been executed, aborting PR check..."
  npm test -- --verbose suites/fail.js
  exitCode=1
fi

exit $exitCode
