#!/usr/bin/env bash

# curl service endpoints; exit failure if any service returns status code != 200

# Service Health Endpoints
commons_name=$KUBECTL_NAMESPACE
if [[ "$KUBECTL_NAMESPACE" == "default" ]]; then
  commons_name="qa"
fi
commons_url="https://${commons_name}.planx-pla.net"
indexd="${commons_url}/index/_status"
sheepdog="${commons_url}/api/_status"
peregrine="${commons_url}/peregrine/_status"
portal="${commons_url}/"
fence="${commons_url}/user/jwt/keys"
selenium="selenium-hub:4444/status"

if [ -n $1 ] && [ "$1" == "dataguids.org" ]; then
  health_endpoints=( $indexd $portal )
elif ! (g3kubectl get pods --no-headers -l app=portal | grep portal) > /dev/null 2>&1; then
  health_endpoints=( $sheepdog $peregrine $fence )
else
  health_endpoints=( $sheepdog $peregrine $portal $fence )
fi

if [[ "$(hostname)" == *"cdis-github-org"* ]] || [[ "$(hostname)" == *"planx-ci-pipeline"* ]]; then
  echo "do not include $selenium in the health check."
else
  health_endpoints+=($selenium)
fi

exit_code=0

checkHealth() {
  status=$(curl -s -o /dev/null -w "%{http_code}" "${1}")
  if [[ $status != "200" ]]; then
    exit_code=1
  fi
  printf 'Health %-60s: %s\n' "${1}" "$status"
}

for health_endpoint in ${health_endpoints[@]}; do
  checkHealth ${health_endpoint}
done

exit $exit_code
