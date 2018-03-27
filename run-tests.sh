#!/bin/bash -e

set -e
npm install
export ACCESS_TOKEN=$(kubectl exec $(get_pod fence) -it -- fence-create token-create --scopes openid,user,fence,data --type access_token --exp 1800 --username cdis.autotest@gmail.com)
qa_cred=$( kubectl get secret sheepdog-secret -ojson | jq -r '.data["wsgi.py"]' | base64 --decode | egrep "(\s+'auth':\s\('gdcapi')" | sed "s/.*\(('gdcapi', '[A-Za-z0-9]\{8,\}')\).*/\1/" )
export INDEX_USER=gdcapi
export INDEX_PASSWORD=$( [[ $qa_cred =~ ([A-Za-z0-9]{8,}+) ]] && echo ${BASH_REMATCH[1]} )
npm run test
