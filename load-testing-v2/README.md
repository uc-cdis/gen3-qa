The load-testing-v2 directory contains load tests written with Grafana Labs K6 Load Test Runner.  The interface with these tests is the docker-compose.yaml file.  `docker compose` is configured to run one test at a time.  All tests can be found in the ./tests directory. Each test is condifigured with defaults and can be ran by executing `docker compose run k6 run` followed by the path to the test.  For example `docker compose run k6 run /tests/audit-service/audit-login.js`.

If you need to pass in values, you can pass them into test execution as environment variables.  A way to do this is setting the value of the variable to an environment variable in the terminal you are using to execute the tests.  For example in a Linux terminal `export RELEASE_VERSION=v3.3.1`.  You, then, pass this value into the test using an `-e` flag like `docker compose run -e RELEASE_VERSION k6 run /tests/audit-service/audit-login`.  You can pass in multiple values this way but for most tests you won't need to.

The other two services configured in the docker-compose.yaml file are grafana and influxdb.  These two services can be options started using `docker compose up -d influxdb grafana`. You can then navigate your browser to localhost port 3000, logging in with default grafana credentials to be able to see the completed tests visualized in the Grafana dashboards which are defined in `./grafana`.  If you don't user `docker compose up` to start grafana and influxdb, running `docker compose run k6` will start influxdb, but not grafana.

**Populate Credentials**
The first step is to go log into the instance of Gen3 you are setting out to test.  Click the "Profile" button in the header in the top right corner. Then click "Create API key" button.  Click the "Copy" button to copy the credientials to your clipboard.  Now open `./utils/credentials.json`, select all and paste.  The `./utils/credentials.json` should now be populated with an api key that has about a one month lifespan.
Tests will use the api-key to retrieve an access token used by test execution.

For this to work your terminal needs to be cd into the `load-testing-v2` directory.

Each test is made up of 4 parts: `init`, `options`, `setup`, test execution.  
The `init` section is the very top of the tests which includes all impporting of external modules, loading the credentials.json file, setting/altering environment variables. Because of the design of K6, this is the only place the credentials.json can be loaded into the test.  This results in the file being loaded into every VU (Virtual User) instance of the test.  Since the file is small this isn't an issue.  If we create tests that need to import large test files, K6 has mechanisms for those senareios.  

The `init` section is also the only place for making any dynamic changes necessary to the values used in the creation of the options object that is exported. One of the main values that is set in the `init` for the `options` is the `__ENV.VIRTUAL_USERS`.  This environment variable contains the values that get pasted to the stage option.  This controls the stages of the test.  For example `{ "duration": "300s",  "target": 100 }` defines a stage that over 5 minutes (300 seconds) the test will work its way up to the number of target users.  It this case 100.  At that point it will continue to the next stage which is ofton something like `{ "duration": "30s", "target": 1 }` and starts dropping virtual users at a rate that it will reach the target of 1 user in 30 seconds.  Stages can be added or removed to create load necessary to exersize the functionality under test.  In some of the tests, the longer running stages are currently commented out, so be sure to review what stages are currently activive when running your tests.

`setup` is a function that is exported.  It is called by K6 after K6 retrieves the `options` and before it executes the test defined in the default function.  `setup` uniquely runs exactly once, unlike the `init` section which runs once per VU.  In most of our current tests `setup` is only used to retrieve and set ACCESS_TOKEN and GEN3_HOST derived from the credentials.json loaded in the `init`.  Since `setup` is called only once, it can be used to perform other environment set up necessary for all of the other test.  Lastly, the object returned by the setup function is passed into to default function/test definition.

The default function is typically where the main definition of the test with any assertions exists.  Lastly, none of our tests use this, but if necessary a `teardown` function can be defined.  For more information on the lifecycle of a K6 test please [click here](https://grafana.com/docs/k6/latest/using-k6/test-lifecycle/?form=MG0AV3#overview-of-the-lifecycle-stages).

**Example commands for each test:**
```
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
