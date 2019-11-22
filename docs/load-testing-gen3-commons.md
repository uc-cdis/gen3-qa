# Introduction

Our PlanX QA team utilizes the following technologies to perform Load Tests against a given Gen3 Commons system (Including performance monitoring and reports):

* K6 (Go-based Load Testing tool with tests scriptable in Javascript)
  * [Github repo](https://github.com/loadimpact/k6)

* InfluxDB (Time-series database)

* Grafana (Monitoring dashboard)

The objective behind this effort is to instrument our services' API endpoints and try to determine the workload they can accommodate. That should guide our capacity management, i.e., obtain the general understanding of our services performance and thresholds, including the ability to anticipate the need to scale up a given k8s deployment due to some upcoming event.

# How to run load tests

The following steps contain instructions to run Fence PreSignedURLs

1. Git clone the k6-load-testing repo.
`git clone git@github.com:uc-cdis/k6-load-testing.git`

2. Install k6 on your local laptop:
Mac: `brew install k6`
Ubuntu: `sudo apt-get install k6 (more steps in the README file)`

3. Login to qa-brain.planx-pla.net and copy the ACCESS_TOKEN from your browser’s cookie.
Paste the cookie into the token.txt file that sits on the root directory.

4. Edit the fence/presigned-url.js script to define the target commons hostname and the Indexd record GUID to be used in the PreSignedURL requests:
e.g., 
```
const host = "https://internalstaging.datastage.io";
const guid = "d544ba6a-09cb-4261-a3e4-db7d097ab953";
```
5. Bring up Grafana and InfluxDB throughdocker-compose to visualize the progress of the load test execution:
```
% pwd
/Users/$USER/workspace/k6-load-testing
% docker-compose up -d
Creating network "grafana_default" with the default driver
Creating grafana_influxdb_1 ... done
Creating grafana_grafana_1  ... done
```
6. Run the k6 binary locally sending metrics to InfluxDB:
`% k6 run --out influxdb=http://localhost:8086/db0 fence/presigned-url.js`

7. Open your browser, go to `http://localhost:3000/` and monitor the progress.

# Grafana metrics

Here are some of the graphs you will find on the k6-load-testing-results dashboard:

* Active VUs: 
  * Active virtual users that are controlled through the following snippet of code:
```
stages: [
        { duration: "15s", target: 10 },
        { duration: "30s", target: 10 },
        { duration: "15s", target: 0 },
    ],
```
* Request per second: 

* Errors per second:

* Checks per second:
  * Checks are calculated based on:
```
import { check } from "k6";
let res = http.get(url, params);
    check(res, {
        "is status 200": (r) => r.status === 200
    });
```
* http_req_duration:
  * mean, max, med, min, p90, p95


# Next steps
Move this to the gen3-qa repo and formalize how new checks / scenarios should be introduced (per project, etc.).
