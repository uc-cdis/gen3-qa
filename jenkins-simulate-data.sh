#!/usr/bin/env bash
#
# Note: you can test this locally like this:
#  * (cd .. && git clone https://github.com/uc-cdis/cloud-automation.git)
#  * (cd .. && git clone https://github.com/uc-cdis/data-simulator.git)
#  * WORKSPACE=$(cd .. && pwd) GEN3_HOME=$(../cloud-automation && pwd) dictURL=https://s3.amazonaws.com/dictionary-artifacts/datadictionary/develop/schema.json TEST_DATA_PATH="$(pwd)/testData" bash ./jenkins-simulate-data.sh
#  * ls testData/
#
export WORKSPACE="${WORKSPACE:-$(pwd)}"

if [[ ! -d "$WORKSPACE/data-simulator" ]]; then
  echo "ERROR: I really want $WORKSPACE/data-simulator to exist"
  exit 1
fi

function writeMetricWithResult() {
  measure=""
  if [ "$1" == "PASS" ]; then
    measure="pass_count"
  else
    measure="fail_count"
  fi

  set +e
  # allow failure in case influxdb not in use
  curl -i -XPOST "http://influxdb:8086/write?db=ci_metrics" --data-binary "${measure},test_name=data_simulator,repo_name=$(echo $JOB_NAME | cut -d/ -f 2),pr_num=$(echo $BRANCH_NAME | cut -d- -f 2) ${measure}=1" || true
  set -e
}

namespace="${1:-${KUBECTL_NAMESPACE:-default}}"
testedEnv="${2:-""}"
echo "namespace: $namespace"
echo "testedEnv: $testedEnv"
export GEN3_HOME="${GEN3_HOME:-${WORKSPACE}/cloud-automation}"
export TEST_DATA_PATH="${TEST_DATA_PATH:-${WORKSPACE}/testData/}"

if [[ -n "$GEN3_HOME" && -d "$GEN3_HOME" ]]; then  # load gen3 tools from cloud-automation
  source "${GEN3_HOME}/gen3/lib/utils.sh"
  gen3_load "gen3/gen3setup"
else
  echo "Env var GEN3_HOME is required for simulating data"
  writeMetricWithResult "FAIL"
  exit 1
fi

cd "$WORKSPACE/data-simulator"
last_commit=`git log --name-status HEAD^..HEAD`
echo "data-simulator last commit: $last_commit"

projectName=jenkins
nData=1
dictURL="${dictURL:-$(g3kubectl get configmaps manifest-global -o json | jq -r '.data.dictionary_url')}"
if [[ $? -ne 0 || -z "dictURL" ]]; then
    echo "ERROR: failed to retrieve dictionary_url for namespace $namespace"
    writeMetricWithResult "FAIL"
    exit 1
fi

mkdir -p $TEST_DATA_PATH
curl -s -o"$TEST_DATA_PATH/schema.json" "$dictURL"
if [[ ! -f "$TEST_DATA_PATH/schema.json" ]]; then
  echo "ERROR: failed to download $dictURL"
  writeMetricWithResult "FAIL"
  exit 1
else
 echo Downloaded schema.json at "$TEST_DATA_PATH/schema.json"
fi

#
# pick a file type node out of the dictionary
# use "submitted_unaligned_reads" if it's there ...
#
leafNode="submitted_unaligned_reads"

if ! jq -r '.|values|map(select(.category=="data_file"))|map(.id)|join("\n")' < "$TEST_DATA_PATH/schema.json" | grep "$leafNode" > /dev/null; then
  echo "Did not find default leaf node '$leafNode' in schema. Finding a new node of category 'data_file'..."
  leafNode="$(jq -r '.|values|map(select(.category=="data_file"))|map(.id)|join("\n")' < "$TEST_DATA_PATH/schema.json" | head -1)"
fi

if [[ -z "$leafNode" ]]; then
  echo "ERROR: unable to identify file type node for data simulation from schema at $dictURL"
  writeMetricWithResult "FAIL"
  exit 1
fi
echo "Leaf node set to: $leafNode"

#
# assume that we are running in the data-simulator directory
#
if [ -f ./pyproject.toml ]; then
  echo "Found pyproject.toml, using poetry to install data simulator"
  # put poetry in the path
  export PATH="/var/jenkins_home/.local/bin:$PATH"
  poetry config virtualenvs.path "${WORKSPACE}/datasimvirtenv" --local
  # install data-simulator
  # retry in case of any connectivity failures
  for attempt in {1..3}; do
    yes | poetry cache clear --all pypi
    poetry run pip install --upgrade pip
    poetry install -vv --no-dev
    if [[ $? -ne 0 ]]; then
      echo "ERROR: Failed to install poetry / dependencies on attempt #${attempt}"
      writeMetricWithResult "FAIL"
      sleep ${attempt}
      echo "trying again..."
    else
      echo "poetry install returned a successful status code, proceeding with the data simulation..."
      break
    fi
  done

  export PYTHONPATH=.
  pyCMD="poetry run data-simulator simulate --url $dictURL --path $TEST_DATA_PATH --program jnkns --project jenkins"
  echo Running command: $pyCMD
  eval $pyCMD
  if [[ $? -ne 0 ]]; then
    echo "ERROR: Failed to simulate test data for $namespace"
    writeMetricWithResult "FAIL"
    exit 1
  fi

  pyCMD2="poetry run data-simulator submission_order --url $dictURL --path $TEST_DATA_PATH --node_name $leafNode"
  echo Running command: $pyCMD2
  eval $pyCMD2
  if [[ $? -ne 0 ]]; then
    echo "ERROR: Failed to generate submission_order data for $namespace"
    writeMetricWithResult "FAIL"
    exit 1
  fi
else
  echo "Not found pyproject.toml, using pip to install data simulator (old way)"
  /usr/bin/pip3 install cdislogging
  /usr/bin/pip3 install --user -r requirements.txt
  #python setup.py develop --user

  # Fail script if any of following commands fail
  set -e

  export PYTHONPATH=.
  pyCMD="python3 bin/data-simulator simulate --url $dictURL --path $TEST_DATA_PATH --program jnkns --project jenkins"
  echo Running command: $pyCMD
  eval $pyCMD
  if [[ $? -ne 0 ]]; then
    echo "ERROR: Failed to simulate test data for $namespace"
    writeMetricWithResult "FAIL"
    exit 1
  fi

  pyCMD2="python3 bin/data-simulator submission_order --url $dictURL --path $TEST_DATA_PATH --node_name $leafNode"
  echo Running command: $pyCMD2
  eval $pyCMD2
  if [[ $? -ne 0 ]]; then
    echo "ERROR: Failed to generate submission_order data for $namespace"
    writeMetricWithResult "FAIL"
    exit 1
  fi
fi

for f in $TEST_DATA_PATH/*; do
  printf "\n$f:\n"
  cat $f
done

writeMetricWithResult "PASS"
