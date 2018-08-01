#!/usr/bin/env bash

# curl service endpoints; exit failure if any service returns status code != 200

# Service Health Endpoints
commons_url="https://${KUBECTL_NAMESPACE}.planx-pla.net"
sheepdog="${commons_url}/api/_status"
peregrine="${commons_url}/peregrine/_status"
portal="${commons_url}/"
fence="${commons_url}/user/jwt/keys"
selenium="localhost:4444/wd/hub/sessions"
health_endpoints=( $sheepdog $peregrine $portal $fence $selenium )

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
