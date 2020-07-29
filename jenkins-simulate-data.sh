#!/usr/bin/env bash
#
# Note: you can test this locally like this:
#  * (cd .. && git clone https://github.com/uc-cdis/cloud-automation.git)
#  * (cd .. && git clone https://github.com/uc-cdis/data-simulator.git)
#  * WORKSPACE=$(cd .. && pwd) GEN3_HOME=$(../cloud-automation && pwd) dictURL=https://s3.amazonaws.com/dictionary-artifacts/datadictionary/develop/schema.json TEST_DATA_PATH="$(pwd)/testData" bash ./jenkins-simulate-data.sh
#  * ls testData/
#
export WORKSPACE="${WORKSPACE:-$(pwd)}"

if [[ ! -d "$WORKSPACE/data-simulator" ]]; then
  echo "ERROR: I really want $WORKSPACE/data-simulator to exist"
  exit 1
fi

namespace="${1:-${KUBECTL_NAMESPACE:-default}}"
echo $namespace
export GEN3_HOME="${GEN3_HOME:-${WORKSPACE}/cloud-automation}"
export TEST_DATA_PATH="${TEST_DATA_PATH:-${WORKSPACE}/testData/}"

if [[ -n "$GEN3_HOME" && -d "$GEN3_HOME" ]]; then  # load gen3 tools from cloud-automation
  source "${GEN3_HOME}/gen3/lib/utils.sh"
  gen3_load "gen3/gen3setup"
else
  echo "Env var GEN3_HOME is required for simulating data"
  exit 1
fi

cd "$WORKSPACE/data-simulator"

projectName=jenkins
nData=1
dictURL="${dictURL:-$(g3kubectl get configmaps manifest-global -o json | jq -r '.data.dictionary_url')}"
if [[ $? -ne 0 || -z "dictURL" ]]; then
    echo "ERROR: failed to retrieve dictionary_url for namespace $namespace"
    exit 1
fi

mkdir -p $TEST_DATA_PATH
curl -s -o"$TEST_DATA_PATH/schema.json" "$dictURL"
if [[ ! -f "$TEST_DATA_PATH/schema.json" ]]; then
  echo "ERROR: failed to download $dictURL"
  exit 1
fi

#
# pick a data_file node out of the dictionary
# use "submitted_unaligned_reads" if it's there ...
#
leafNode="submitted_unaligned_reads"
if ! jq -r '.|values|map(select(.category=="data_file"))|map(.id)|join("\n")' < "$TEST_DATA_PATH/schema.json" | grep "$leafNode" > /dev/null; then
  leafNode="$(jq -r '.|values|map(select(.category=="data_file"))|map(.id)|join("\n")' < "$TEST_DATA_PATH/schema.json" | head -1)"
fi

if [[ -z "$leafNode" ]]; then
  echo "ERROR: unable to identify data_file node for data simulation from schema at $dictURL"
  exit 1
fi
echo "Leaf node set to: $leafNode"

#
# assume that we are running in the data-simulator directory
# try to trick pip into working in the WORKSPACE
#
export HOME="${WORKSPACE:-$HOME}"
if [ -f ./pyproject.toml ]; then
  echo "Found pyproject.toml, using poetry to install data simulator"
  # only poetry 1.1+ works (still a preview version now)
  # stable version poetry fails to work because it  depends on pythen3-venv
  # from poetry 1.1 they build virtual envs with virtualenv, see https://github.com/python-poetry/poetry/releases/tag/1.1.0b1
  /usr/bin/curl -sSL https://raw.githubusercontent.com/python-poetry/poetry/master/get-poetry.py | POETRY_VERSION=1.1.0b2 python3.6
  # make sure poetry is using python 3.6
  sed -i '1 s/\<python\>/python3.6/' $HOME/.poetry/bin/poetry
  # these steps are needed to ensure virtualenv creates and activates successfully
  source $HOME/.poetry/env
  mkdir -p $HOME/.cache/pypoetry/virtualenvs
  touch $HOME/.cache/pypoetry/virtualenvs/envs.toml
  $HOME/.poetry/bin/poetry env use python3.6
  # install data-simulator
  $HOME/.poetry/bin/poetry install -vv --no-dev

  # Fail script if any of following commands fail
  set -e

  export PYTHONPATH=.
  pyCMD="$HOME/.poetry/bin/poetry run data-simulator simulate --url $dictURL --path $TEST_DATA_PATH --program jnkns --project jenkins"
  eval $pyCMD
  if [[ $? -ne 0 ]]; then
    echo "ERROR: Failed to simulate test data for $namespace"
    exit 1
  fi

  pyCMD2="$HOME/.poetry/bin/poetry run data-simulator submission_order --url $dictURL --path $TEST_DATA_PATH --node_name $leafNode"
  eval $pyCMD2
  if [[ $? -ne 0 ]]; then
    echo "ERROR: Failed to generate submission_order data for $namespace"
    exit 1
  fi
else
  echo "Not found pyproject.toml, using pip to install data simulator (old way)"
  /usr/bin/pip3 install cdislogging
  /usr/bin/pip3 install --user -r requirements.txt
  #python setup.py develop --user

  # Fail script if any of following commands fail
  set -e

  export PYTHONPATH=.
  pyCMD="python3 bin/data-simulator simulate --url $dictURL --path $TEST_DATA_PATH --program jnkns --project jenkins"
  eval $pyCMD
  if [[ $? -ne 0 ]]; then
    echo "ERROR: Failed to simulate test data for $namespace"
    exit 1
  fi

  pyCMD2="python3 bin/data-simulator submission_order --url $dictURL --path $TEST_DATA_PATH --node_name $leafNode"
  eval $pyCMD2
  if [[ $? -ne 0 ]]; then
    echo "ERROR: Failed to generate submission_order data for $namespace"
    exit 1
  fi
fi
