#!/bin/bash

# set namespace for script, CHANGE THIS TO CHANGE NAMESPACE
namespace="qa-bloodpac"

# function to get environment variables
get_envs() {
    env_vars=$(ssh $namespace@cdistest.csoc 'bash -s' < extract_envs_for_local.sh $namespace)
    if [[ $? != 0 ]]; then
        echo $env_vars
        return 1
    fi
    echo $env_vars
    eval $env_vars
}

# control block to generate new env variables only if the old ones expired
if [[ -z $TIMESTAMP ]]; then
    echo "No environment variables found, generating new ones"
    get_envs
    exit_code=$?
else
    timestamp="$(date +"%s")"
    if [[ "$TIMESTAMP+1800" -lt  "$timestamp" ]]; then
        echo "env variables expired, regenerating"
        get_envs
        exit_code=$?
    else
        echo "env variables not expired, continuing"
    fi
fi

if [[ exit_code == 0 ]]; then
    npm run test
fi