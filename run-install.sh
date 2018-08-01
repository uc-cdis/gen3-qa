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

# install selenium
npm run selenium-install

# search for a free port to run selenium-standalone on, then start selenium
START_COUNT=0
WAIT_COUNT=0
CURRENT_PORT=4444
echo "Searching for free port for Selenium..."
while [[ $(curl -s -o /dev/null -w "%{http_code}" localhost:${CURRENT_PORT}) == "200" ]]; do
    let "CURRENT_PORT+=1"
done

export SELENIUM_PORT=$CURRENT_PORT
npm run selenium-start -- -- -port $SELENIUM_PORT > /dev/null 2>&1

echo "Selenium running on port ${SELENIUM_POART}"
