#!/bin/bash -e
#
#

npm install

namespaceList="${1:-default}"

exitCode=0

for name in ${namespaceList}; do
  testArgs="--debug --verbose --reporter mocha-junit-reporter"
  if [[ "$name" != "default" ]]; then
    # run all tests except for those that require google configuration
    testArgs="${testArgs} --grep @reqGoogle --invert"
  fi
  npm test -- $testArgs
  if [[ $? -ne 0 ]]; then exitCode=1; fi
done

exit $exitCode
