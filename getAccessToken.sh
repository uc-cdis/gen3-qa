#!/bin/bash

help() {
  cat - <<EOM
  Use: baseh ./getAccessToken.sh apiKey
EOM
}

if [[ $# -lt 1 || "$1" =~ ^-*h(elp)?$ ]]; then
  help
  exit 1
fi
apiKey="$1"
shift
if [[ ! -f "$apiKey" ]]; then
  echo "ERROR - api key file does not exist: $apiKey"
  help
  exit 1
fi

url="$(jq -r .api_key < "$apiKey" | awk -F . '{ print $2 }' | base64 --decode 2> /dev/null | jq -r .iss)"
if [[ -z "$url" || ! "$url" =~ ^https://.+/user$ ]]; then
  echo "ERROR: failed to derive valid url from access token - got: $url"
  exit 1
fi
url="${url}/credentials/cdis/access_token"
curl -s -H 'Content-type: application/json' -X POST "$url" "-d@$apiKey" | jq -r .access_token
