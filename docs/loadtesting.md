# k6 Load Testing

QA team is moving towards making efforts to execute load testing suite for the microservices such as Fence and IndexD (for start). The team is using a stack of k6 + Grafana + Influxdb to execute and report the load test script execution. 

## Installation

There are two ways on running the k6: local installation or Docker image.

### Local installation

* Install k6 ([doc][1]):
    * macOS: `brew install k6`
    * Ubuntu:

```
sudo apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys 379CE192D401AB61
echo "deb https://dl.bintray.com/loadimpact/deb stable main" | sudo tee -a /etc/apt/sources.list
sudo apt-get update
sudo apt-get install k6
```

* Run `k6 run script.js` :)

### Docker image

* `docker pull loadimpact/k6`
* `docker run -i loadimpact/k6 run - <script.js`

## What we use for visualization?

To have a nice visualization of load testing, run local Grafana and InfluxDB:

In `grafana/` folder:

```
docker-compose up -d
```

## How to run load testing scripts with K6?

* Install k6 locally `https://docs.k6.io/docs/installation`

* Go to the target Gen3 commons hostname and 'Create a API key' and download the API key in json

* Start `Grafana` and `InfluxDB` through the docker-compose file which helps in visualization of the load testing execution and its progress
    `docker-compose up -d`

* The Load test runner script is located at suites/load-testing folder. (the final location for the loadtestrunner script is TBD, so temporary location is this)
    On terminal, from this location run `node loadtestrunner.js <path_to_credentials> <service> <load_test_scenario> `
    e.g., `node load-testing/loadTestRunner.js /Users/$USER/Downloads/credentials.json fence presigned-url`

* on terminal you would see some k6 execution results such as vus, status and checks

* for more graphical representation, go to browser, check `localhost:3000` for the grafana visualization


## References

https://docs.k6.io/docs

https://docs.k6.io/docs/influxdb-grafana

https://docs.k6.io/docs/test-life-cycle
