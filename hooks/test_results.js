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
  event.dispatcher.on(event.test.after, async (test) => {
    // console.log(stringify(test));
    const suiteName = test.parent.title.split(' ').join('_');
    const testName = test.title.split(' ').join('_');
    const ciEnvironment = process.env.KUBECTL_NAMESPACE;
    const testResult = test.state;
    // eslint-disable-next-line no-underscore-dangle
    const retries = test._retries;
    // eslint-disable-next-line no-underscore-dangle
    const currentRetry = test._currentRetry;
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
    console.log(`TEST: ${testName}`);
    console.log(`RESULT: ${testResult}`);
    console.log(`CURRENT RETRY - ${currentRetry}`);
    console.log(`TIMESTAMP: ${new Date()}`);
    console.log(`GRID_SESSION_COUNT: ${sessionCount}`);
    console.log('********');
    // const duration = test.parent.tests[0].duration / 1000;
    // const error = test.parent.tests[0].err.message.substring(0, 50);
    if (testResult === 'failed' && retries <= currentRetry) {
      await influx.writePoints([
        {
          measurement: 'fail_count',
          tags: {
            repo_name: repoName,
            pr_num: prName,
            suite_name: suiteName,
            test_name: testName,
            ci_environment: ciEnvironment,
            selenium_grid_sessions: sessionCount,
            // run_time: duration,
            // err_msg: error,
          },
          fields: { fail_count: 1 },
        },
      ], {
        precision: 's',
      }).catch((err) => {
        console.error(`Error saving data to InfluxDB! ${err.stack}`);
      });
    }

    if (testResult === 'passed') {
      await influx.writePoints([
        {
          measurement: 'pass_count',
          tags: {
            repo_name: repoName,
            pr_num: prName,
            suite_name: suiteName,
            test_name: testName,
            ci_environment: ciEnvironment,
            selenium_grid_sessions: sessionCount,
            // run_time: duration,
            // err_msg: error,
          },
          fields: { pass_count: 1 },
        },
      ], {
        precision: 's',
      }).catch((err) => {
        console.error(`Error saving data to InfluxDB! ${err.stack}`);
      });
    }

    if (currentRetry > 0 && (testResult === 'passed' || retries === currentRetry)) {
      await influx.writePoints([
        {
          measurement: 'retry_count',
          tags: {
            repo_name: repoName,
            pr_num: prName,
            suite_name: suiteName,
            test_name: testName,
            ci_environment: ciEnvironment,
            // run_time: duration,
            // err_msg: error,
          },
          fields: { retry_count: currentRetry },
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

  event.dispatcher.on(event.suite.after, (suite) => {
    console.log('***AFTER SUITE****');
    console.log(`SUITE FILE: ${suite.file}`);
    const j = suite.file.split('/');
    const testSelectionLabel = `test-${j[j.length-2]}-${j[j.length-1]}`; // eslint-disable-line space-infix-ops
    suite.title = `${suite.title}: ${testSelectionLabel}`;
    console.log(`SUITE: ${suite.title}`);
  });
};
