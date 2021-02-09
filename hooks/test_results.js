const { event } = require('codeceptjs');
const request = require('request');
const Influx = require('influx');
const fetch = require('node-fetch');
// const stringify = require('json-stringify-safe');

const influx = new Influx.InfluxDB({
  host: 'influxdb',
  database: 'ci_metrics',
});

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
    const resp = await fetch('http://selenium-hub:4444/status');
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

  // logs
  console.log('********');
  console.log(`TEST: ${testName}`);
  console.log(`RESULT: ${test.state}`);
  console.log(`CURRENT RETRY - ${currentRetry}`);
  console.log(`TIMESTAMP: ${new Date()}`);
  console.log(`GRID_SESSION_COUNT: ${sessionCount}`);
  console.log(`TEST_DURATION: ${duration}s`);
  console.log('********');

  // define information to write into time-series db
  const fieldInfo = measurement === 'run_time' ? duration : 1;

  const tsData = {};
  tsData[measurement] = fieldInfo;

  // writing metrics
  await influx.writePoints(
    [{
      measurement,
      tags: {
        repo_name: repoName,
        pr_num: prName,
        suite_name: suiteName,
        test_name: testName,
        ci_environment: ciEnvironment,
        selenium_grid_sessions: sessionCount,
        run_time: duration,
      },
      fields: tsData,
    }],
    { precision: 's' },
  ).catch((err) => {
    console.error(`Error saving data to InfluxDB! ${err}`);
  });
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
      throw new Error(`THE TEST RESULT IS UNDEFINED! ABORT ALL TESTS AND FAIL THIS PR.`);
    }
    await writeMetrics('run_time', test, currentRetry);
  });

  event.dispatcher.on(event.suite.before, (suite) => {
    console.log('********');
    console.log(`SUITE: ${suite.title}`);
    if (suite.title === 'DrsAPI') {
      request(`https://${process.env.HOSTNAME}/index/ga4gh/drs/v1/objects`, { json: true }, (err, res) => {
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
  });
};
