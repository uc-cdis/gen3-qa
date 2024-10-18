# Load Testing with Grafana Labs K6

The `load-testing-v2` directory contains load tests written with Grafana Labs K6 Load Test Runner. The interface with these tests is the `docker-compose.yaml` file. `docker compose` is configured to run one test at a time. All tests can be found in the `./tests` directory. Each test is configured with defaults and can be run by executing `docker compose run k6 run` followed by the path to the test. For example:

```sh
docker compose run k6 run /tests/audit-service/audit-login.js
```

To pass in values, use environment variables. For example, in a Linux terminal, set the variable with `export RELEASE_VERSION=v3.3.1`, then pass it into the test using the `-e` flag:

```sh
docker compose run -e RELEASE_VERSION k6 run /tests/audit-service/audit-login.js
```

You can pass multiple values this way, but most tests won't need it.

The other two services configured in the `docker-compose.yaml` file are Grafana and InfluxDB. Start them with:

```sh
docker compose up -d influxdb grafana
```

Navigate to `localhost:3000` in your browser and log in with default Grafana credentials to see the completed tests visualized in the Grafana dashboards defined in `./grafana`. If you don't use `docker compose up` to start Grafana and InfluxDB, running `docker compose run k6` will start InfluxDB, but not Grafana.

**Populate Credentials**
1. Log into the Gen3 instance you are testing.
2. Click the "Profile" button in the top right corner.
3. Click "Create API key" and then "Copy" to copy the credentials.
4. Open `./utils/credentials.json`, select all, and paste the copied credentials.

The `./utils/credentials.json` should now be populated with an API key that has about a one-month lifespan. Tests will use the API key to retrieve an access token for test execution.

Ensure your terminal is in the `load-testing-v2` directory.

Each test consists of four parts: `init`, `options`, `setup`, and test execution.

- **Init**: This section includes importing external modules, loading the `credentials.json` file, and setting/altering environment variables. It runs once per Virtual User (VU) instance of the test. Because of the design of K6, this is the only place the credentials.json can be loaded into the test.  This results in the file being loaded into every VU instance of the test.  Since the file is small this isn't an issue.  If we create tests that need to import large test files, K6 has mechanisms for those senareios.
- **Options**: The `init` section is also where dynamic changes to the values used in the `options` object are made. For example, `__ENV.VIRTUAL_USERS` controls the stages of the test.  This environment variable contains the values that get pasted to the stage option.  This controls the stages of the test.  For example `{ "duration": "300s",  "target": 100 }` defines a stage that over 5 minutes (300 seconds) the test will work its way up to the number of target users.  It this case 100.  At that point it will continue to the next stage which is ofton something like `{ "duration": "30s", "target": 1 }` and starts dropping virtual users at a rate that it will reach the target of 1 user in 30 seconds.  Stages can be added or removed to create load necessary to exersize the functionality under test.  In some of the tests, the longer running stages are currently commented out, so be sure to review what stages are currently activive when running your tests.
- **Setup**: This function runs once and is used to retrieve and set `ACCESS_TOKEN` and `GEN3_HOST` from the `credentials.json` file. The object returned by `setup` is passed into the default function. Since `setup` is called only once, it can be used to perform other environment set up necessary for all of the other test.
- **Default Function**: This is where the main test definition and assertions exist. A `teardown` function can also be defined if necessary.

For more information on the lifecycle of a K6 test, please [click here](https://grafana.com/docs/k6/latest/using-k6/test-lifecycle/?form=MG0AV3#overview-of-the-lifecycle-stages).

**Example commands for each test:**
```sh
docker compose run -e RELEASE_VERSION k6 run /tests/audit-service/audit-login.js
docker compose run -e RELEASE_VERSION k6 run /tests/audit-service/audit-presigned-url.js
docker compose run -e RELEASE_VERSION k6 run /tests/dicom-server/metadata.js
docker compose run -e RELEASE_VERSION k6 run /tests/export-clinical-metadata.js
docker compose run -e RELEASE_VERSION k6 run /tests/fence/presigned-url.js
docker compose run -e RELEASE_VERSION k6 run /tests/fence/service-account-patch.js
docker compose run -e RELEASE_VERSION k6 run /tests/ga4gh/drs-performance.js
docker compose run -e RELEASE_VERSION k6 run /tests/indexd/create-indexd-records.js
docker compose run -e RELEASE_VERSION k6 run /tests/indexd/drs-endpoint.js
docker compose run -e RELEASE_VERSION k6 run /tests/metadata-service/create-and-query.js
docker compose run -e RELEASE_VERSION k6 run /tests/metadata-service/filter-large-database.js
docker compose run -e RELEASE_VERSION k6 run /tests/portal/study-viewer.js
docker compose run -e RELEASE_VERSION k6 run /tests/sheepdog/export-clinical-metadata.js
docker compose run -e RELEASE_VERSION k6 run /tests/sheepdog/import-clinical-metadata.js
```

