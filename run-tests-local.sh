#!/bin/bash -e
#
# Locally launch script.
# Use:
#   bash run-local-tests.sh 'namespace1 namespace2 ...'
#

export RUNNING_LOCAL=true

help() {
  cat - <<EOM
Locally run test script.
references a current [cloud-automation](https://github.com/uc-cdis/cloud-automation) folder.

Use:
  bash run-tests-local.sh [[--namespace=]KUBECTL_NAMESPACE]
EOM
}

while [[ $# -gt 0 ]]; do
  key="$(echo "$1" | sed -e 's/^-*//' | sed -e 's/=.*$//')"
  value="$(echo "$1" | sed -e 's/^.*=//')"
  case "$key" in
    namespace)
      export NAMESPACE=$value
      ;;
  esac
  shift
done

npm run test -- --grep @reqGoogle -- suites/apis/googleServiceAccountTest.js
