const { event } = require('codeceptjs');
const request = require('request');

module.exports = function () {
  event.dispatcher.on(event.test.finished, (test) => {
    console.log('********');
    console.log(`TEST: ${test.title}`);
    console.log(`RESULT: ${test.state}`);
    console.log(`RETRIES: ${test.retryNum}`);
    console.log('********');
  });

  event.dispatcher.on(event.suite.before, (suite) => {
    console.log('********');
    console.log(`SUITE: ${suite.title}`);
    if (suite.title === 'DrsAPI') {
      request(`https://${process.env.HOSTNAME}/index/ga4gh/drs/v1/objects`, { json: true }, (err, res) => {
        if (err) { console.log(err); }
        if (res.statusCode !== 200) {
          console.log('Skipping DRS tests since its endpoints are not enabled on this environment...');
          suite.tests.map((test) => {
            test.run = () => console.log(`Ignoring test - ${test.title}`);
            return test;
          });
        }
      });
    }
  });
};
