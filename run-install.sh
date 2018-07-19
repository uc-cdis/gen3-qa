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

while [ -z "$(lsof -t -i tcp:4444)" ]; do
    if [ "$WAIT_COUNT" -gt 6 ]; then
        if [ "$START_COUNT" -gt 2 ]; then
            echo -e "$(red_color "ERROR:") Unable to start Selenium."
            exit 1
        fi
        echo -e "$(red_color "ERROR:") Selenium not started after 30 seconds, restarting"
        let START_COUNT+=1
        npm run selenium-start
    fi
    let WAIT_COUNT+=1
    sleep 5
done

echo "Selenium running"