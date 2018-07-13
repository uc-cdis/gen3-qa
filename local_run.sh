#!/bin/bash

# set namespace for script, CHANGE THIS TO CHANGE NAMESPACE
namespace="qa-bloodpac"

# copy extract_envs_for_local.sh 
scp extract_envs_for_local.sh $namespace@cdistest.csoc:
ssh $namespace@cdistest.csoc bash extract_envs_for_local.sh $namespace
scp $namespace@cdistest.csoc:envs_local.txt envs_local.txt
ssh $namespace@cdistest.csoc rm extract_envs_for_local.sh envs_local.txt
source envs_local.txt

# run custom parameters script and test
npm run custom
npm run test