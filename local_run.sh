#!/bin/bash

# set namespace for script, CHANGE THIS TO CHANGE NAMESPACE
namespace="qa-bloodpac"

# function to get environment variables
get_envs() {
    eval $(ssh $namespace@cdistest.csoc 'bash -s' < extract_envs_for_local.sh $namespace)
}

# control block to generate new env variables only if the old ones expired
if [[ -z $TIMESTAMP ]]; then
    echo "No environment variables found, generating new ones"
    get_envs
else
    timestamp="$(date +"%s")"
    if [[ "$TIMESTAMP+1800" -lt  "$timestamp" ]]; then
        echo "env variables expired, regenerating"
        get_envs
    else
        echo "env variables not expired, continuing"
    fi
fi

# run custom parameters script and test
npm run test