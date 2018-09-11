#!/bin/bash -e
#
#

_RUN_TESTS="$PWD"
_ROOT_DIR="$(dirname "$PWD")"
_GEN_DATA="$_ROOT_DIR/data-simulator"

export TEST_DATA_PATH="$_ROOT_DIR/TestData/"
cd "${_RUN_TESTS}"

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
