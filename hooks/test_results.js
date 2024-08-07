const { event } = require('codeceptjs');
const request = require('request');
const axios = require('axios');
const Influx = require('influx');
const os = require('os');
const dogapi = require('dogapi');

const influx = new Influx.InfluxDB({
  host: 'influxdb',
  database: 'ci_metrics',
});

const testEnvironment = process.env.KUBECTL_NAMESPACE || os.hostname();

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

async function writeMetrics(measurement, test) {
  // github metrics
  let prName = 'UNDEFINED';
  let repoName = 'UNDEFINED';
  try {
    prName = process.env.BRANCH_NAME.split('-')[1]; // eslint-disable-line prefer-destructuring
    repoName = process.env.JOB_NAME.split('/')[1]; // eslint-disable-line prefer-destructuring
  } catch {
    console.log('No PR number and repo name found. Running local?');
  }

  // Jenkins metrics
  // let numberOfPRsWaitingInTheQueue = 0;
  // if (process.env.JENKINS_HOME && process.env.RUNNING_LOCAL !== 'true') {
  //   numberOfPRsWaitingInTheQueue = await fetchJenkinsMetrics();
  // }

  // define information to write into time-series db
  const fieldInfo = measurement === 'run_time' ? test.duration / 1000 : 1;

  // writing metrics to influxdb
  const tsData = {};
  tsData[measurement] = fieldInfo;
  const metricTags = {
    repo_name: repoName,
    pr_num: prName,
    suite_name: test.parent.title.split(' ').join('_'),
    test_name: test.title.split(' ').join('_'),
    ci_environment: testEnvironment,
    // jenkins_queue_items_length: numberOfPRsWaitingInTheQueue,
  };
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

  // writing metrics to DataDog if running in Jenkins.
  if (process.env.JENKINS_HOME && process.env.RUNNING_LOCAL !== 'true') {
    const metricTagsDD = Object.keys(metricTags).map((key) => `"${key}:${metricTags[key]}"`);
    const options = {
      api_key: process.env.DD_API_KEY,
      app_key: process.env.DD_APP_KEY,
      api_host: 'ctds.ddog-gov.com',
    };

    dogapi.initialize(options);

    if (measurement === 'run_time') {
      // handle gauge metric unit
      dogapi.metric.send('planx.ci.run_time', test.duration / 1000, { tags: metricTagsDD, type: 'gauge' }, (err, results) => {
        console.dir(results);
      });
    } else {
      // handle counter metric unit
      dogapi.metric.send(`planx.ci.${measurement}`, 1, { tags: metricTagsDD, type: 'count' }, (err, results) => {
        console.dir(results);
      });
    }
  }
}

module.exports = async function () {
  event.dispatcher.on(event.test.after, async (test) => {
    // logs
    console.log('********');
    console.log(`TEST: ${test.title}`);
    console.log(`RESULT: ${test.state}`);
    // eslint-disable-next-line no-underscore-dangle
    console.log(`CURRENT RETRY - ${test._currentRetry}`);
    console.log(`TIMESTAMP: ${new Date()}`);
    // console.log(`JENKINS_QUEUE_LENGTH: ${JSON.stringify(await fetchJenkinsMetrics())}`);
    console.log(`TEST_DURATION: ${test.duration / 1000}s`);
    console.log('********');
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
