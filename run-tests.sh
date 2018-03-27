#!/bin/bash -e

set -e
npm install
export ACCESS_TOKEN=$(kubectl exec $(get_pod fence) -it -- fence-create token-create --scopes openid,user,fence,data --type access_token --exp 1800 --username cdis.autotest@gmail.com)
npm run test
