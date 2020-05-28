const { event } = require('codeceptjs');
const request = require('request');
const Influx = require('influx');
const fetch = require('node-fetch');
// const stringify = require('json-stringify-safe');

const influx = new Influx.InfluxDB({
  host: 'influxdb',
  database: 'ci_metrics',
});

module.exports = function () {
  event.dispatcher.on(event.test.finished, async (test) => {
    // console.log(stringify(test));
    const suiteName = test.parent.title.split(' ').join('_');
    const testName = test.title.split(' ').join('_');
    let prName = '';
    let repoName = '';
    try {
      prName = process.env.BRANCH_NAME.split('-')[1]; // eslint-disable-line prefer-destructuring
      repoName = process.env.JOB_NAME.split('/')[1]; // eslint-disable-line prefer-destructuring
    } catch {
      prName = 'UNDEFINED';
      repoName = 'UNDEFINED';
    }
    const resp = await fetch('http://selenium-hub:4444/grid/api/sessions');
    const respJson = await resp.json();
    let sessionCount = 0;
    const { proxies } = respJson;
    if (proxies.length > 0) {
      proxies.forEach((proxy) => {
        sessionCount += proxy.sessions.value.length;
      });
    }
    console.log('********');
    console.log(`TEST: ${test.title}`);
    console.log(`RESULT: ${test.state}`);
    console.log(`RETRIES: ${test.retryNum}`);
    console.log(`TIMESTAMP: ${new Date()}`);
    console.log(`GRID_SESSION_COUNT: ${sessionCount}`);
    console.log('********');
    // const duration = test.parent.tests[0].duration / 1000;
    // const error = test.parent.tests[0].err.message.substring(0, 50);
    let testFailCount = 0;
    if (test.state === 'failed') {
      testFailCount = 1;
    }

    if (testFailCount > 0) {
      await influx.writePoints([
        {
          measurement: 'fail_count',
          tags: {
            repo_name: repoName,
            pr_num: prName,
            suite_name: suiteName,
            test_name: testName,
            selenium_grid_sessions: sessionCount,
            // run_time: duration,
            // err_msg: error,
          },
          fields: { fail_count: testFailCount },
        },
      ], {
        precision: 's',
      }).catch((err) => {
        console.error(`Error saving data to InfluxDB! ${err.stack}`);
      });
    }

    if (test.retryNum > 0) {
      await influx.writePoints([
        {
          measurement: 'retry_count',
          tags: {
            repo_name: repoName,
            pr_num: prName,
            suite_name: suiteName,
            test_name: testName,
            // run_time: duration,
            // err_msg: error,
          },
          fields: { retry_count: test.retryNum },
        },
      ], {
        precision: 's',
      }).catch((err) => {
        console.error(`Error saving data to InfluxDB! ${err.stack}`);
      });
    }
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
