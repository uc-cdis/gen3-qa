#!/usr/bin/env bash

# curl service endpoints; exit failure if any service returns status code != 200

# Service Health Endpoints
sheepdog="/api/_status"
peregrine="/peregrine/_status"
portal="/"
fence="/user/jwt/keys"
health_endpoints=( $sheepdog $peregrine $portal $fence )

exit_code=0

checkHealth() {
  status=$(curl -s -o /dev/null -w "%{http_code}" "https://${vpc_name}.planx-pla.net${1}")
  if [[ $status != "200" ]]; then
    exit_code=1
  fi
  printf 'Health %-20s: %s\n' "$1" "$status"
}

for health_endpoint in ${health_endpoints[@]}; do
  checkHealth ${health_endpoint}
done

exit $exit_code
