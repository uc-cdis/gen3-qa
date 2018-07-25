#!/bin/bash -e
#
#

_RUN_TESTS=$(dirname "${BASH_SOURCE:-$0}")  # $0 supports zsh

cd "${_RUN_TESTS}"
npm install

namespaceList=$(kubectl get namespace -o json | jq -r '.items[].metadata.name')

if [[ $? -ne 0 ]]; then
  echo "ERROR: failed to retrieve kubernetes namespaces: $namespaceList"
  exit 1
fi


npm run selenium-install
npm run selenium-start

START_COUNT=0
WAIT_COUNT=0
echo "Starting Selenium..."

echo "Curling selenium sessions for debugging..."
curl -s 'http://127.0.0.1:4444/wd/hub/sessions' | jq '.'

while [[ $(curl -s -o /dev/null -w "%{http_code}" localhost:4444) != "200" ]]; do
    if [ "$WAIT_COUNT" -gt 6 ]; then
        if [ "$START_COUNT" -gt 2 ]; then
            echo -e "ERROR: Unable to start Selenium."
            exit 1
        fi
        echo -e "Selenium not started after 30 seconds, restarting"
        let START_COUNT+=1
        WAIT_COUNT=0
        npm run selenium-start
    fi
    let WAIT_COUNT+=1
    sleep 5
done

echo "Selenium running"