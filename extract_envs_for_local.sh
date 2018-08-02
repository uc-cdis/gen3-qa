#!/bin/bash

# set shell to interactive to bypass .bashrc check
set -i
# load bashrc so that the script is treated like it was launched on the remote machine
source ~/.bashrc

# load gen3 tools
if [[ -n "$GEN3_HOME" ]]; then  # load gen3 tools from cloud-automation
  source "${GEN3_HOME}/gen3/lib/utils.sh"
  gen3_load "gen3/gen3setup"
else
  echo "GEN3_HOME is not set"
  return 1
fi

# set namespace to arg that was passed by parent script (local_run.sh)
namespace=$1
# run gen3 tools to extract values
if [[ -n "$GEN3_HOME" ]]; then
  # echo "Acquiring tokens for test authentication"
  if [[ -n "$namespace" && "$namespace" != "default" ]]; then
    export KUBECTL_NAMESPACE="$namespace"
  fi
  export HOSTNAME=$(g3kubectl get configmaps global -ojsonpath='{.data.hostname}')
  if [[ $? -ne 0 || -z "$HOSTNAME" ]]; then
    echo "ERROR: failed to retrive HOST_NAME for namespace $namespace"
    return 1
  fi
  export ACCESS_TOKEN=$(g3kubectl exec $(gen3 pod fence $namespace) -- fence-create token-create --scopes openid,user,fence,data,credentials --type access_token --exp 1800 --username cdis.autotest@gmail.com)
  if [[ $? -ne 0 || -z "$ACCESS_TOKEN" ]]; then
    echo "ERROR: failed to retrieve ACCESS_TOKEN for namespace $namespace"
    return 1
  fi
  export EXPIRED_ACCESS_TOKEN=$(g3kubectl exec $(gen3 pod fence $namespace) -- fence-create token-create --scopes openid,user,fence,data,credentials --type access_token --exp 1 --username cdis.autotest@gmail.com)
  if [[ $? -ne 0 || -z "$EXPIRED_ACCESS_TOKEN" ]]; then
    echo "ERROR: failed to retrieve EXPIRED_ACCESS_TOKEN for namespace $namespace"
    return 1
  fi
  qa_cred=$(g3kubectl get secret sheepdog-creds -o json | jq -r '.data["creds.json"]' | base64 --decode | egrep '(\s+"indexd_password":)' | sed 's/.*\("[A-Za-z0-9]\{8,\}"\).*/\1/' )
  export INDEX_USERNAME=gdcapi
  export INDEX_PASSWORD=$( [[ $qa_cred =~ ([A-Za-z0-9]{8,}+) ]] && echo ${BASH_REMATCH[1]} )
  if [[ $? -ne 0 || -z "$INDEX_PASSWORD" ]]; then
    echo "ERROR: failed to retrieve INDEX_PASSWORD for namespace $namespace"
    return 1
  fi
fi

timestamp="$(date +"%s")"

# write environment variables to file
cat - << EOM
export HOSTNAME=$HOSTNAME
export ACCESS_TOKEN=$ACCESS_TOKEN
export EXPIRED_ACCESS_TOKEN=$EXPIRED_ACCESS_TOKEN
export INDEX_USERNAME=$INDEX_USERNAME
export INDEX_PASSWORD=$INDEX_PASSWORD  
export TIMESTAMP=$timestamp
EOM
