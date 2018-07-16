#!/bin/bash -e
#
#

_RUN_TESTS=$(dirname "${BASH_SOURCE:-$0}")  # $0 supports zsh

cd "${_RUN_TESTS}"

if [[ -n "$GEN3_HOME" ]]; then  # load gen3 tools from cloud-automation
  source "${GEN3_HOME}/gen3/lib/utils.sh"
  gen3_load "gen3/gen3setup"
fi

echo "AYO"
echo $PWD

cd ../data-simulator

echo $PWD

# dictURL=https://s3.amazonaws.com/dictionary-artifacts/genomel-dictionary/master/schema.json
dictURL=$(g3kubectl get configmaps global -o json | jq '.data.dictionary_url')
projectName=test
nData=1
saveDir=../TestData/

mkdir -p $saveDir

Rscript GenTestDataCmd.R $dictURL $projectName $nData $saveDir

ls $saveDir