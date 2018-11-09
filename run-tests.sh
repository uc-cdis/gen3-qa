#!/bin/bash -e
#
#

npm ci

namespaceList="${1:-${KUBECTL_NAMESPACE:-default}}"
exitCode=0

for name in ${namespaceList}; do
  testArgs="--debug --verbose --reporter mocha-junit-reporter"
  #if [[ "$name" != "default" ]]; then
  #  # run all tests except for those that require google configuration
  #  testArgs="${testArgs} --grep @reqGoogle --invert"
  #fi
  export NAMESPACE="$name"
  npm test -- $testArgs
  if [[ $? -ne 0 ]]; then exitCode=1; fi
done

exit $exitCode
