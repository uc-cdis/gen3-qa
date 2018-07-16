#!/bin/bash -e
#
#

dictURL=https://s3.amazonaws.com/dictionary-artifacts/genomel-dictionary/master/schema.json
# dictURL=$(g3kubectl get configmaps global -o json | jq '.data.dictionary_url')
projectName=test
nData=1
saveDir=~/TestData/

mkdir -p $saveDir

Rscript GenTestDataCmd.R $dictURL $projectName $nData $saveDir
