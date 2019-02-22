#!/bin/bash -e
#
# Jenkins launch script.
# Use:
#   bash run-performance-tests.sh 'namespace1 namespace2 ...' []
#

help() {
  cat - <<EOM
Jenkins test launch script.  Assumes the  GEN3_HOME environment variable
references a current [cloud-automation](https://github.com/uc-cdis/cloud-automation) folder.

Use:
  bash run-performance-tests.sh [--namespace=]KUBECTL_NAMESPACE] --tests=tests --db=db [--dryrun]
    --namespace default is KUBECTL_NAMESPACE:-default
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
    tests)
      tests="$value"
      ;;
    size)
      size="$value"
      ;;
    db)
      db="$value"
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
  tests=$tests
EOM

echo 'INFO: installing dependencies'
dryrun npm ci

exitCode=0
lockUser=""

testArgs="--debug --verbose --reporter mocha-multi"

for name in ${namespaceList}; do
  (
    export NAMESPACE="$name"
    cat - <<EOM

---------------------------
Launching test in $NAMESPACE
EOM
    case "$tests" in
      submission)
        dataFiles=()
        while IFS= read -r line
        do
          dataFiles+=("$line")
        done < "DataImportOrder.txt"
        dataFiles=("${dataFiles[@]:1}")

        echo "${dataFiles[@]}"

        # for dataFile in ${dataFiles[@]}; do
        #   echo "Running submission test for ${dataFile}..."

        #   export DATAURL=$(aws s3 presign s3://cdis-terraform-state/regressions/subm/${size}/${dataFile}.json)

        #   dryrun npm test -- suites/regressions/submissionPerformanceTest.js
        # done

        singleSubmission=${dataFiles[0]}
        testArgs="${testArgs} --override '{ \"mocha\": { \"reporterOptions\": { \"mocha-junit-reporter\": { \"options\": { \"mochaFile\": \"output/result[hash].xml\" } } } } }'"

        echo "Running submission test for ${singleSubmission}..."
        export DATAURL=$(aws s3 presign s3://cdis-terraform-state/regressions/subm/${size}/${singleSubmission}.json)
        dryrun npm test -- $testArgs suites/regressions/submissionPerformanceTest.js
        ;;
      query)
        echo "Running query performance tests."
        testArgs="${testArgs} --override '{ \"mocha\": { \"reporterOptions\": { \"mocha-junit-reporter\": { \"options\": { \"mochaFile\": \"output/result[hash].xml\" } } } } }'"

        dryrun npm test -- suites/regressions/generateQueries.js
        dryrun npm test -- $testArgs suites/regressions/queryPerformanceTest.js
        ;;
      export)
        echo "Running export performance tests."
        testArgs="${testArgs} --override '{ \"mocha\": { \"reporterOptions\": { \"mocha-junit-reporter\": { \"options\": { \"mochaFile\": \"output/result[hash].xml\" } } } } }'"

        dryrun npm test -- suites/regressions/generateQueries.js
        dryrun npm test -- $testArgs suites/regressions/exportPerformanceTest.js
        ;;
      *)
        echo "Unknown tests."
        ;;
    esac
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
