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

* The Load test runner script is located at the load-testing/ folder.
    On terminal, from this location run:
	
	`node load-testing/loadTestRunner.js <path to the credentials.json file> <path to load-test-descriptor.json>`
	
    e.g., `node load-testing/loadTestRunner.js /Users/$USER/.gen3/credentials.json load-testing/load-test-descriptor.json`
	
	_optional argument:_ random-guids -> If an indexd record url is provided in `load-test-descriptor`, a set of GUIDs will be dynamically retrieved from the target environment and the requests will target random records (Note: For `fence/presigned-url` scenario only).
	
	e.g., `node load-testing/loadTestRunner.js /Users/$USER/.gen3/credentials.json load-testing/load-test-descriptor.json random-guids`

* The `load-testing-descriptor.json` file is comprised of the following parameters:
** _service_: The name of the service which you want to load test.
** _load_test_scenario_: The specific feature of the service that is targeted by the load test.
** _presigned_url_guids_: A hardcoded list of GUIDs to use in presigned url requests.
** _indexd_record_url_: The url that is associated with one or more records from a given environment (Useful when the environment has been previously configured with some test data, e.g., by tailoring a manifest and creating new clinical metadata instaces using `indexd_utils`).
** _virtual_users_: This array containing "duration" and "target" parameters are used to set the number of Virtual Users (VUs) that will execute the load test scenarios. The "duration" represents the time that it will take for the test to reach the "target" amount of VUs or maintain the same number if the target did not change between stages, this is used to increase or decrease the number of VUs in specific time-frames (and also to increase the number of requests that are produced by the test).


* on terminal you would see some k6 execution results such as vus, status and checks

* for more graphical representation, go to browser, check `localhost:3000` for the grafana visualization


## References

https://docs.k6.io/docs

https://docs.k6.io/docs/influxdb-grafana

https://docs.k6.io/docs/test-life-cycle
