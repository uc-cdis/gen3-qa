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

This requires the following option for k6 command, e.g.:

```
k6 run --out influxdb=http://localhost:8086/db0 <folder-name>/<file.js>
```

## How to run load testing scripts with K6?

* Install k6 locally 

* Login to the particular data commons you want to test against, get the `ACCESS_TOKEN` from the browser and paste the token inside the token.txt

* edit the script that you want to execute with target host
    example -> const host = "https://internalstaging.datastage.io";

* Start `Grafana` and `InfluxDB` through the docker-compose file which helps in visualization of the load testing execution and its progress
    `% docker-compose up -d`

* now run k6 command and send the metrics to InfluxDB 
    `k6 run --out influxdb=http://localhost:8086/db0 fence/presigned-url.js`

* go to browser, check `localhost:3000` for the grafana visualization







