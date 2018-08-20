#!/bin/bash

# set namespace for script, CHANGE THIS TO CHANGE NAMESPACE
namespace="default"
username=$namespace
if [[ $namespace == "default" ]]; then
    username="qaplanetv1"
fi

envs_file="local_vars.txt"
test_dur=600 # test duration in seconds
token_dur=1800 # access token duration

# function to get environment variables
get_envs() {
    env_vars=$(ssh ${username}@cdistest.csoc 'bash -s' < extract_envs_for_local.sh $namespace)
    if [[ $? != 0 ]]; then
        echo $env_vars
        return 1
    fi
    echo $env_vars > $envs_file
}

exit_code=0

# control block to generate new env variables only if the old ones expired
if [[ ! -f $envs_file ]]; then
    echo "No environment variables found, generating new ones"
    get_envs
    source $envs_file
    exit_code=$?
else
    source $envs_file
    timestamp="$(date +"%s")"
    if [[ "$TIMESTAMP+$token_dur" -lt  "$timestamp+$test_dur" ]]; then
        echo "Environment variables expired, regenerating"
        get_envs
        source $envs_file
        exit_code=$?
    else
        echo "Environment variables not expired, continuing"
    fi
fi

source ./google_creds.sh