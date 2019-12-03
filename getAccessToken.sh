#!/bin/bash

help() {
  cat - <<EOM
  Use: baseh ./getAccessToken.sh <path_to_credentials.json>
EOM
}

if [[ $# -lt 1 || "$1" =~ ^-*h(elp)?$ ]]; then
  help
  exit 1
fi
credentials_json_path="$1"
shift
if [[ ! -f "$credentials_json_path" ]]; then
  echo "ERROR - Invalid path to the credentials.json file: $credentials_json_path"
  help
  exit 1
fi

api_key="$(jq -r .api_key < "$credentials_json_path")"
RC1=$?
target_environment="$(jq -r .api_key < "$credentials_json_path" | awk -F . '{ print $2 }' | base64 --decode 2> /dev/null | jq -r .iss | awk -F/ '{print $3}')"
RC2=$?
if [[ "$RC1$RC2" -ne "00" ]]; then
  echo "ERROR: failed to retrieve a valid url from the api key within credentials.json - got: $target_environment"
  exit 1
fi
export GEN3_COMMONS_HOSTNAME="${target_environment}"
export API_KEY="${api_key}"
node getAccessToken.js
