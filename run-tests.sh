#!/bin/bash -e
#
# Jenkins launch script.
# Use:
#   bash run-tests.sh 'namespace1 namespace2 ...' [--service=fence] [--testedEnv=testedEnv] [--isGen3Release=isGen3Release] [--seleniumTimeout] [--selectedTest=selectedTest] [--selectedTag=selectedTag] [--debug=debug]
#

set -xe

help() {
  cat - <<EOM
Jenkins test launch script.  Assumes the  GEN3_HOME environment variable
references a current [cloud-automation](https://github.com/uc-cdis/cloud-automation) folder.

Use:
  bash run-tests.sh [[--namespace=]KUBECTL_NAMESPACE] [--service=service] [--testedEnv=testedEnv] [--isGen3Release=isGen3Release] [--selectedTest=selectedTest] [--selectedTag=selectedTag] [--dryrun] [--debug=debug]
    --namespace default is KUBECTL_NAMESPACE:-default
    --service default is service:-none
    --testedEnv default is testedEnv:-none (for cdis-manifest PRs, specifies which environment is being tested, to know which tests are relevant)
    --isGen3Release default is "false"
    --seleniumTimeout default is 3600
    --selectedTest default is selectedTest:-none
    --selectedTag default is selectedTag:-none
    --debug default is "false" (run tests in debug mode if true)
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

# Check if a service in the manifest
ifServiceDeployed() {
  local command
  local response

  command="g3kubectl get configmap manifest-versions -o json | jq -r .data.json | jq -r "'".[\"$1\"]"'""
  response=$(eval "$command")

  echo $response
}

# Takes one argument, being service name
getServiceVersion() {
  local command
  local response
  local version
  command="g3kubectl get configmap manifest-versions -o json | jq -r .data.json | jq -r "'".[\"$1\"]"'""
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
  doNotRunRegex="${doNotRunRegex}${or}.*$1"
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
seleniumTimeout="${seleniumTimeout:3600}"
selectedTest="${selectedTest:-""}"
selectedTag="${selectedTag:-""}"
debug="${debug:false}"

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
    seleniumTimeout)
      seleniumTimeout="$value"
      ;;
    selectedTest)
      selectedTest="$value"
      ;;
    selectedTag)
      selectedTag="$value"
      ;;
    dryrun)
      isDryRun=true
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
  isGen3Release=$isGen3Release
  seleniumTimeout=$seleniumTimeout
  selectedTest=$selectedTest
  selectedTag=$selectedTag
EOM

echo 'INFO: installing dependencies'
if [ -f gen3-qa-mutex.marker ]; then
  echo "parallel-testing is enabled, the dependencies have already been installed by Jenkins."
  export PARALLEL_TESTING_ENABLED="true"
else
  dryrun npm ci
fi

################################ Disable Test Tags #####################################

runTestsIfServiceVersion "@multipartUpload" "fence" "2.8.0"
runTestsIfServiceVersion "@multipartUploadFailure" "fence" "3.0.0"
runTestsIfServiceVersion "@centralizedAuth" "fence" "3.0.0"
runTestsIfServiceVersion "@dbgapSyncing" "fence" "3.0.0"
runTestsIfServiceVersion "@indexRecordConsentCodes" "sheepdog" "1.1.13"
runTestsIfServiceVersion "@coreMetadataPage" "portal" "2.20.8"
runTestsIfServiceVersion "@indexing" "portal" "2.26.0" "2020.05"
runTestsIfServiceVersion "@cleverSafe" "fence" "4.22.4" "2020.09"
runTestsIfServiceVersion "@requestor" "requestor" "1.5.0" "2022.02"
runTestsIfServiceVersion "@requestor" "arborist" "3.2.0" "2021.12"
runTestsIfServiceVersion "@requestorNew" "requestor" "1.5.1" "2022.06"
runTestsIfServiceVersion "@requestorNew" "arborist" "3.2.0" "2021.12"
runTestsIfServiceVersion "@requestorRoleIds" "requestor" "1.7.0" "2022.09"
runTestsIfServiceVersion "@requestorRoleIds" "arborist" "3.2.0" "2021.12"
runTestsIfServiceVersion "@clientCreds" "arborist" "4.0.0" "2022.12"
runTestsIfServiceVersion "@clientCreds" "fence" "6.1.0" "2022.10"
runTestsIfServiceVersion "@clientCreds" "requestor" "1.8.0" "2022.12"
runTestsIfServiceVersion "@clientExpiration" "fence" "7.0.0" "2023.01"
runTestsIfServiceVersion "@clientRotation" "fence" "7.3.0" "2023.03"

# disable tests if the service is not deployed
# export isIndexdDeployed=$(ifServiceDeployed "indexd")
# if [ -z "$isIndexdDeployed" ] || [ "$isIndexdDeployed" = "null" ];then
#   echo "indexd is not deployed.Skip all tests required indexd.."
#   donot '@requires-indexd'
# fi

listVar="arborist fence guppy indexd manifestservice metadata pelican peregrine pidgin portal sheepdog sower tube audit requestor hatchery argo-wrapper cohort-middleware dicom-viewer dicom-server"

for svc_name in $listVar; do
    export isServiceDeployed=$(ifServiceDeployed $svc_name)
    if [ -z "$isServiceDeployed" ] || [ "$isServiceDeployed" = "null" ]; then
      echo "$svc_name is not deployed.Skip all tests requiring $svc_name.."
      echo "@requires-$svc_name"
      donot "@requires-$svc_name"
    fi
done

# environments that use DCF features
# we only run Google Data Access tests for cdis-manifest PRs to these
envsRequireGoogle="dcp.bionimbus.org internalstaging.theanvil.io staging.theanvil.io gen3.theanvil.io preprod.gen3.biodatacatalyst.nhlbi.nih.gov staging.gen3.biodatacatalyst.nhlbi.nih.gov  gen3.biodatacatalyst.nhlbi.nih.gov nci-crdc-staging.datacommons.io nci-crdc.datacommons.io"

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

# Do not run batch processing tests
donot '@batch'

# Do not run dataguids.org test for regular PRs
donot '@dataguids'

# Do not run the test until update the test
donot '@GWASUI'

# Do not run prjsBucketAccess (for prod-execution only)
donot '@prjsBucketAccess'

echo "INFO: disabling RAS DRS test as jenkins env is not configured"
donot '@rasDRS'

# For dataguids.org PRs, skip all fence-related bootstrapping oprations
# as the environment does not have fence
if [ "$testedEnv" == "dataguids.org" ]; then
  # disable bootstrap script from codeceptjs
  sed -i '/bootstrap\:/d' codecept.conf.js
  sed -i '/bootstrap\:/d' gen3.qa.in.a.box.codecept.conf.js
fi

# if [[ "$testedEnv" == *"heal"* ]]; then
  # use moon instead of selenium
  # sed -i 's/selenium-hub/moon.moon/' codecept.conf.js
# fi

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

#
# RAS AuthN Integration tests are only required for some repos
#
if [[ "$isGen3Release" != "true" && "$service" != "gen3-qa" && "$service" != "fence" && "$service" != "cdis-manifest" && "$service" != "gitops-qa" && "$service" != "cloud-automation" && "$service" != "gitops-dev" ]]; then
  # disable ras tests
  echo "INFO: disabling RAS AuthN Integration tests for $service"
  donot '@rasAuthN'
else
  #
  # Run tests including RAS AuthN Integration tests
  # If RAS Staging is down, uncomment the line below to skip these tests
  # donot '@rasAuthN'
  runTestsIfServiceVersion "@rasAuthN" "fence" "4.22.1" "2020.09"
  echo "INFO: enabling RAS AuthN Integration tests for $service"
  donot '@rasAuthN'
  # Disabling RAS tests temporarily because of RAS authentication issues
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

# Only run register user tests in midrc
#if [[ !( "$service" =~ ^(cdis-manifest|gitops-qa|gen3-qa) && $testedEnv == *"midrc"* )]]; then
#  echo "INFO: disabling Register User tests for $service"
#  donot '@registerUser'
#else
#  echo "INFO: enabling Register User tests for $service"
#fi

donot '@registerUser' 
donot '@dicomViewer'

# Focus on GUI tests for data-portal
if [[ "$service" == "data-portal" ]]; then
  echo "INFO: disabling tests involving RESTful APIs & Gen3 CLI / Batch operations for $service"
  donot '@metadataIngestion'
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

#### FRONTEND_ROOT ####
export frontend_root="$(g3kubectl get configmaps manifest-global -o yaml | yq '.data.frontend_root')"
if [[ $frontend_root == \"gen3ff\" ]]; then
  export PORTAL_SUFFIX="/portal"
  donot '@centralizedAuth'
else
  export PORTAL_SUFFIX=""
  donot '@requires-frontend-framework'
fi

#### GEN3 FF HEAL ####
if [[ ! $testedEnv == *"heal"* ]]; then
  donot '@heal'
fi

#
# try to read configs of portal
#
hostname="$(g3kubectl get configmaps manifest-global -o json | jq -r '.data.hostname')"
portalApp="$(g3kubectl get configmaps manifest-global -o json | jq -r '.data.portal_app')"
portalConfigURL="https://${hostname}${PORTAL_SUFFIX}/data/config/${portalApp}.json"
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

# # Study Viewer test
runStudyViewerTests=false
#run for data-portal/requestor/gen3-qa/gitops-qa/cdis-manifest repo
if [[ ! ("$service" =~ ^(data-portal|requestor|gen3-qa)$ || $testedEnv == *"niaid"*) ]]; then
  echo "Disabling study-viewer test"
  donot "@studyViewer"
else
  if [[ $(curl -s "$portalConfigURL" | jq 'contains({studyViewerConfig})') == "true" ]]; then
    if (g3kubectl get pods --no-headers -l app=requestor | grep requestor) > /dev/null 2>&1; then
      echo "### Study-Viewer is deployed"
      runStudyViewerTests=true
    fi
  fi
fi
# disabling the studyViewer test for debugging
donot '@studyViewer'

# disabling the nondbgap usersync test as the jenkins is configured
donot '@nondbgapUsersyncTest'

# landing page buttons
if [[ $(curl -s "$portalConfigURL" | jq '.components | contains({buttons}) | not') == "true" ]] || [[ ! -z "$testedEnv" ]]; then
  donot '@landing'
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

# Nightly Build exclusive tests
donot '@pfbExport'
donot '@jupyterNb'

#
# only run audit-service tests for manifest repos IF audit-service is
# deployed, and for repos with an audit-service integration.
#
runAuditTests=true
if ! [[ "$service" =~ ^(audit-service|fence|cloud-automation|gen3-qa)$ ]]; then
  if [[ "$service" =~ ^(cdis-manifest|gitops-qa|gitops-dev)$ ]]; then
    if ! (g3kubectl get pods --no-headers -l app=audit-service | grep audit-service) > /dev/null 2>&1; then
      echo "INFO: audit-service is not deployed"
      runAuditTests=false
    fi
  else
    echo "INFO: no need to run audit-service tests for repo $service"
    runAuditTests=false
  fi
fi
if [[ "$runAuditTests" == true ]]; then
  echo "INFO: enabling audit-service tests"
else
  echo "INFO: disabling audit-service tests"
  donot '@audit'
fi
# the tests assume audit-service can read from an AWS SQS
runTestsIfServiceVersion "@audit" "audit-service" "1.0.0" "2021.06"
# the tests assume fence records both successful and unsuccessful events
runTestsIfServiceVersion "@audit" "fence" "5.1.0" "2021.07"

#
# Run Agg MDS tests only if the feature is enabled
# and service is one of metadata-service, cdis-manifest, gitops-qa, gitops-dev and gen3-qa
# and if metadata service version is 1.5.0 (semver) / 2021.10 (monthly)
#
usingAggMDS=$(g3kubectl get cm manifest-metadata -o yaml | yq .data.USE_AGG_MDS)
portalUsingAggMDS=$(gen3 secrets decode portal-config gitops.json | jq '.featureFlags.discoveryUseAggMDS')
if ! [[ $usingAggMDS == \"true\" && $portalUsingAggMDS == "true" && "$service" =~ ^(cdis-manifest|gitops-qa|gitops-dev|gen3-qa|metadata-service) ]]; then
	donot '@aggMDS'
fi
runTestsIfServiceVersion "@aggMDS" "metadata" "1.6.0" "2021.10"

#
# Run Discovery Page tests only if feature flag is enabled
# and service is one of metadata-service, cdis-manifest, gitops-qa, gitops-dev and gen3-qa
# and if portal service version is 3.8.1 (semver) / 2021.10 (monthly)
#
discoveryFeatureFlagEnabled=$(gen3 secrets decode portal-config gitops.json | jq '.featureFlags.discovery')
if ! [[ $discoveryFeatureFlagEnabled == "true" && "$service" =~ ^(cdis-manifest|gitops-qa|gitops-dev|gen3-qa|metadata-service) ]]; then
  donot '@discoveryPage'
fi
runTestsIfServiceVersion "@discoveryPage" "portal" "3.8.1" "2021.09"

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
  if [ -n "$selectedTest" ]; then
    echo "Test selected - $selectedTest"
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
    DEBUG=$debug npm test -- --reporter mocha-multi --verbose ${additionalArgs} ${selectedTest}
  fi
  if [ -n "$selectedTag" ]; then
    echo "Tag selected - $selectedTag"
    DEBUG=$debug npm test -- --reporter mocha-multi --verbose --grep "(?=.*$selectedTag)^(?!$doNotRunRegex)"
  fi
fi

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
