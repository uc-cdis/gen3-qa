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
  bash run-tests-local.sh [[--namespace=]KUBECTL_NAMESPACE] -- pass-through arguments

Ex:
  /bin/rm -rf output/*; bash ./run-tests-local.sh --namespace=reuben -- suites/.../myTest.js 2>&1 | tee run.log
EOM
}

while [[ $# -gt 0 && "$1" != "--" ]]; do
  kv="$(sed 's/^-*//' <<<$1)"
  key="${kv%%=*}"
  value="${kv##*=}"
  case "$key" in
    namespace)
      export NAMESPACE=$value
      ;;
    *)
      echo "ERROR: unknown kv $1 - $kv - $key - $value"
      help
      exit 1;
      ;;
  esac
  shift
done
shift

if [[ -z "$NAMESPACE" ]]; then
  echo "ERROR: must specify a namespace to test against"
  help
  exit 1
fi

npm run test -- --reporter mocha-multi --verbose --grep "@dataClientCLI|@reqGoogle|@Performance" --invert "$@"
