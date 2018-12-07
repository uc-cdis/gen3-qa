#!/usr/bin/env bash

namespace="${1:-${KUBECTL_NAMESPACE:-default}}"
echo $namespace
export GEN3_HOME="${GEN3_HOME:-${WORKSPACE}/cloud-automation}"
export TEST_DATA_PATH="${TEST_DATA_PATH:-${WORKSPACE}/testData/}"

if [[ -n "$GEN3_HOME" && -d "$GEN3_HOME" ]]; then  # load gen3 tools from cloud-automation
  source "${GEN3_HOME}/gen3/lib/utils.sh"
  gen3_load "gen3/gen3setup"
else
  echo "Env var GEN3_HOME is required for simulating data"
  exit 1
fi

if [[ -z "$TEST_DATA_PATH" ]]; then
    echo "Env var TEST_DATA_PATH is required for simulating data"
    exit 1
fi

_GEN_DATA="$WORKSPACE/data-simulator"

cd "${_GEN_DATA}"

projectName=jenkins
nData=1
dictURL=$(g3kubectl get configmaps manifest-global -o json | jq -r '.data.dictionary_url')
if [[ $? -ne 0 || -z "dictURL" ]]; then
    echo "ERROR: failed to retrieve dictionary_url for namespace $namespace"
    exit 1
fi

mkdir -p $TEST_DATA_PATH

# rCMD="Rscript GenTestDataCmd.R $dictURL $projectName $nData $TEST_DATA_PATH"
pyCMD="data-simulator simulate --url $dictURL --path $TEST_DATA_PATH --program jnkns --project jenkins"
echo $pyCMD
eval $pyCMD
if [[ $? -ne 0 ]]; then
  echo "ERROR: Failed to generate test data for $namespace"
  exit 1
fi