#!/bin/bash -e
#
#

echo "AYO"
echo $PWD

_RUN_TESTS=$(dirname "${BASH_SOURCE:-$0}")  # $0 supports zsh

cd "${_RUN_TESTS}"

echo $PWD

dictURL=https://s3.amazonaws.com/dictionary-artifacts/genomel-dictionary/master/schema.json
# dictURL=$(g3kubectl get configmaps global -o json | jq '.data.dictionary_url')
projectName=test
nData=1
saveDir=~/TestData/

mkdir -p $saveDir

Rscript ../data-simulator/GenTestDataCmd.R $dictURL $projectName $nData $saveDir
