#!/bin/bash -e
#
#

ls

echo "AYO"
echo $PWD

ls ~/

dictURL=https://s3.amazonaws.com/dictionary-artifacts/genomel-dictionary/master/schema.json
# dictURL=$(g3kubectl get configmaps global -o json | jq '.data.dictionary_url')
projectName=test
nData=1
saveDir=~/TestData/

mkdir -p $saveDir

Rscript ~/data-simulator/GenTestDataCmd.R $dictURL $projectName $nData $saveDir
