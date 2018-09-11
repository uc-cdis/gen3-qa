#!/bin/bash -e
#
#

npm install

namespaceList="${1:-default}"

exitCode=0

for name in ${namespaceList}; do
  if [[ "$name" == "default" || "$name" =~ ^qa- ]]; then
    npm test
    if [[ $? -ne 0 ]]; then exitCode=1; fi
  fi
done

exit $exitCode
