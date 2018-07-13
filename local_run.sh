#!/bin/bash

# set namespace for script, CHANGE THIS TO CHANGE NAMESPACE
namespace="qa-bloodpac"

# function to get environment variables
get_envs() {
    scp extract_envs_for_local.sh $namespace@cdistest.csoc:
    ssh $namespace@cdistest.csoc bash extract_envs_for_local.sh $namespace
    scp $namespace@cdistest.csoc:envs_local.txt envs_local.txt
    ssh $namespace@cdistest.csoc rm extract_envs_for_local.sh envs_local.txt
}

# control block to generate new env variables only if the old ones expired
if [[ ! -f envs_local.txt ]]; then
    echo "No envs_local.txt file found, generating new env variables"
    get_envs
    source envs_local.txt
else 
    source envs_local.txt
    timestamp="$(date +"%s")"
    if [[ "$TIMESTAMP+1600" -lt  "$timestamp" ]]; then
        echo "env variables expired, regenerating"
        get_envs
        source envs_local.txt
    else 
        echo "env variables not expired, continuing"
    fi
fi


# run custom parameters script and test
npm run custom
npm run test