const { event } = require('codeceptjs');
const request = require('request');
const axios = require('axios');
const Influx = require('influx');
const fetch = require('node-fetch');
const os = require('os');
const StatsD = require('hot-shots');
// const stringify = require('json-stringify-safe');

const influx = new Influx.InfluxDB({
  host: 'influxdb',
  database: 'ci_metrics',
});

const testEnvironment = process.env.KUBECTL_NAMESPACE || os.hostname();

let ddClient;
if (process.env.JENKINS_HOME && process.env.RUNNING_LOCAL !== 'true') {
  console.log('### ## Initializing DataDog Client...');
  ddClient = new StatsD({
    host: 'datadog-agent-cluster-agent.datadog',
    port: 8125,
    globalTags: { env: testEnvironment },
    errorHandler(error) {
      console.log('Socket errors caught here: ', error);
    },
  });
}

async function fetchJenkinsMetrics() {
  const jenkinsQueueLength = await axios.post(
    'https://jenkins.planx-pla.net/scriptText',
    'script=println(Hudson.instance.queue.items.length)',
    {
      auth: {
        username: process.env.JENKINS_USERNAME,
        password: process.env.JENKINS_USER_API_TOKEN,
      },
    },
  ).then((response) => response.data).catch((error) => {
    console.log(`error: ${JSON.stringify(error)}`);
  });

  return jenkinsQueueLength;
}

async function writeMetrics(measurement, test, currentRetry) {
  // test metrics
  const suiteName = test.parent.title.split(' ').join('_');
  const testName = test.title.split(' ').join('_');
  const ciEnvironment = process.env.KUBECTL_NAMESPACE;
  const duration = test.duration / 1000;

  // github metrics
  let prName = '';
  let repoName = '';
  try {
    prName = process.env.BRANCH_NAME.split('-')[1]; // eslint-disable-line prefer-destructuring
    repoName = process.env.JOB_NAME.split('/')[1]; // eslint-disable-line prefer-destructuring
  } catch {
    prName = 'UNDEFINED';
    repoName = 'UNDEFINED';
  }

  // selenium metrics
  let sessionCount = 0;
  if (process.env.RUNNING_IN_PROD_TIER === 'true') {
    console.log('INFO: Running in prod-tier environment. Ignore selenium-hub metrics.');
  } else {
    const resp = await fetch('http://localhost:4444/status');
    const respJson = await resp.json();

    const { nodes } = respJson.value;
    if (nodes.length > 0) {
      nodes.forEach((node) => {
        node.slots.forEach((slot) => {
          if (slot.session) {
            sessionCount += 1;
          }
        });
      });
    }
  }

  // Jenkins metrics
  let numberOfPRsWaitingInTheQueue = 0;
  if (process.env.JENKINS_HOME && process.env.RUNNING_LOCAL !== 'true') {
    numberOfPRsWaitingInTheQueue = await fetchJenkinsMetrics();
  }

  // logs
  console.log('********');
  console.log(`TEST: ${testName}`);
  console.log(`RESULT: ${test.state}`);
  console.log(`CURRENT RETRY - ${currentRetry}`);
  console.log(`TIMESTAMP: ${new Date()}`);
  console.log(`GRID_SESSION_COUNT: ${sessionCount}`);
  console.log(`JENKINS_QUEUE_LENGTH: ${JSON.stringify(numberOfPRsWaitingInTheQueue)}`);
  console.log(`TEST_DURATION: ${duration}s`);
  console.log('********');

  // define information to write into time-series db
  const fieldInfo = measurement === 'run_time' ? duration : 1;

  const tsData = {};
  tsData[measurement] = fieldInfo;
  const metricTags = {
    repo_name: repoName,
    pr_num: prName,
    suite_name: suiteName,
    test_name: testName,
    ci_environment: ciEnvironment,
    jenkins_queue_items_length: numberOfPRsWaitingInTheQueue,
    selenium_grid_sessions: sessionCount,
  };

  // writing metrics to influxdb
  await influx.writePoints(
    [{
      measurement,
      tags: metricTags,
      fields: tsData,
    }],
    { precision: 's' },
  ).catch((err) => {
    console.error(`Error saving data to InfluxDB! ${err}`);
  });

  // writing metrics to DataDog if ddClient is initialized
  if (ddClient) {
    // TODO: There are some awkward IFs here but they are supposed to stick around
    // while InfluxDB + Grafana co-exist with DataDog, once we spend a few months with
    // with enough historical metrics, we shall refactor and abandon all the InfluxDB-related code
    if (measurement === 'run_time') {
      // handle gauge metric unit
      ddClient.gauge('planx.ci.run_time', duration, metricTags);
    } else {
      // handle counter metric unit
      ddClient.increment(`planx.ci.${measurement}`, 1, metricTags, undefined);
    }
  }
}

module.exports = function () {
  event.dispatcher.on(event.test.after, async (test) => {
    // console.log(stringify(test));
    const testResult = test.state;
    // eslint-disable-next-line no-underscore-dangle
    const retries = test._retries;
    // eslint-disable-next-line no-underscore-dangle
    const currentRetry = test._currentRetry;
    if (testResult === 'failed' && retries <= currentRetry) {
      await writeMetrics('fail_count', test, currentRetry);
    }
    if (testResult === 'passed') {
      await writeMetrics('pass_count', test, currentRetry);
    }
    if (currentRetry > 0 && (testResult === 'passed' || retries === currentRetry)) {
      await writeMetrics('retry_count', test, currentRetry);
    }
    if (testResult === undefined) {
      // If there are any Selenium failures, we cannot let the test fail silently.
      // We need to force return an exit code 1.
      throw new Error('THE TEST RESULT IS UNDEFINED! ABORT ALL TESTS AND FAIL THIS PR.');
    }
    await writeMetrics('run_time', test, currentRetry);
  });

  event.dispatcher.on(event.suite.before, (suite) => {
    console.log('********');
    console.log(`SUITE: ${suite.title}`);
    if (suite.title === 'DrsAPI') {
      request(`https://${process.env.HOSTNAME}/ga4gh/drs/v1/objects`, { json: true }, (err, res) => {
        if (err) { console.log(err); }
        if (res.statusCode !== 200) {
          console.log('Skipping DRS tests since its endpoints are not enabled on this environment...');
          suite.tests.forEach((test) => {
            test.run = function skip() { // eslint-disable-line func-names
              console.log(`Ignoring test - ${test.title}`);
              this.skip();
            };
          });
        }
      });
    }
    // Not all environments that are tested through the nightly build support the PFB Export feature
    if (suite.title === 'PFB Export') {
      request(`https://${process.env.HOSTNAME}/data/config/gitops.json`, { json: true }, (err, res) => {
        if (err) { console.log(err); }
        let areThereAnyExportToPFBButtons = false;
        if (res.statusCode === 200) {
          let explorerConfigPropertyName;
          if (Object.prototype.hasOwnProperty.call(res.body, 'dataExplorerConfig')) {
            explorerConfigPropertyName = 'dataExplorerConfig';
          } else if (Object.prototype.hasOwnProperty.call(res.body, 'fileExplorerConfig')) {
            explorerConfigPropertyName = 'fileExplorerConfig';
          } else {
            console.log('could not find any explorer config...');
          }
          if (explorerConfigPropertyName) {
            console.log(`### ## res.body[explorerConfigPropertyName]: ${JSON.stringify(res.body[explorerConfigPropertyName])}`);
            res.body[explorerConfigPropertyName].buttons.forEach((button) => {
              console.log(`## ### BUTTON : ${JSON.stringify(button)}`);
              if (button.type === 'export-to-pfb') {
                areThereAnyExportToPFBButtons = true;
              }
            });
          }
        }
        if (!areThereAnyExportToPFBButtons) {
          console.log('Skipping PFB Export test scenarios since its config does not contain any export-to-pfb buttons...');
          suite.tests.forEach((test) => {
            test.run = function skip() { // eslint-disable-line func-names
              console.log(`Ignoring test - ${test.title}`);
              this.skip();
            };
          });
        }
      });
    }
  });
};
