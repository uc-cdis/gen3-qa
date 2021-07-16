import requests
import os
import json

base_url = "https://jenkins.planx-pla.net"

all_builds = requests.get(
  "{}/job/qa-metrics/api/json?tree=allBuilds[fullDisplayName,id,number,url,timestamp]".format(base_url),
  auth=("themarcelor", os.environ["JENKINS_USER_API_TOKEN"].strip()),
)
all_builds_json = all_builds.json()['allBuilds']
# print('all_builds: {}'.format(all_builds_json))

big_metrics_json = []
for build in all_builds_json:
  print('fetching qa-metrics.json from url: {}artifact/qa-metrics.json'.format(build['url']))
  metrics_out = requests.get(
    "{}artifact/qa-metrics.json".format(build['url']),
    auth=("themarcelor", os.environ["JENKINS_USER_API_TOKEN"].strip()),
  )
  try:
    print(metrics_out.text)
    json.loads(metrics_out.text)
    big_metrics_json.append(metrics_out.json())
  except:
    print('WARN: invalid json. Skip')
    continue

with open("qa-metrics-all.json", "w") as metrics_json:
  metrics_json.write(json.dumps(big_metrics_json))

print('done!')
