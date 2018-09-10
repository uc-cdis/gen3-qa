#!/usr/bin/env bash

namespace="${1:-default}"
echo $namespace

if [[ -z "$TEST_DATA_PATH" ]]; then
    echo "Need to set environment variable TEST_DATA_PATH"
    exit 1
fi

_GEN_DATA="$WORKSPACE/data-simulator"

cd "${_GEN_DATA}"

projectName=test
nData=1
dictURL=$(g3kubectl get configmaps global -o json | jq -r '.data.dictionary_url')
if [[ $? -ne 0 || -z "dictURL" ]]; then
    echo "ERROR: failed to retrieve dictionary_url for namespace $namespace"
    exit 1
fi

mkdir -p $TEST_DATA_PATH

rCMD="Rscript GenTestDataCmd.R $dictURL $projectName $nData $TEST_DATA_PATH"
echo $rCMD
eval $rCMD
if [[ $? -ne 0 ]]; then
  echo "ERROR: Failed to generate test data for $namespace"
  exit 1
fi