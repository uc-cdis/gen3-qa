const { event } = require('codeceptjs');
const { Bash } = require('../utils/bash');

const bash = new Bash();

module.exports = async function () {
  event.dispatcher.on(event.suite.before, (suite) => {
    console.log('*******');
    console.log(`SUITE:${suite.title}`);
    if (suite.title === 'DRS RAS') {
      const drsEnabled = bash.runCommand('gen3 secrets decode fence-config fence-config.yaml | yq .GA4GH_PASSPORTS_TO_DRS_ENABLED');
      if (drsEnabled !== true) {
        console.log('Skipping the RAS DRS tests since required configuration is not in fence-config.yaml');
        suite.test.forEach((test) => {
          test.run = function skip() { // eslint-disable-line func-names
            console.log(`Ignoring test - ${test.title}`);
            this.skip();
          };
        });
      }

      const updateCronjob = bash.Command('g3kubectl get cronjob fence-visa-update > /dev/null 2>&1');
      if (!(updateCronjob)) {
        console.log('Skipping the test since cronjob is not deployed to the env.');
        suite.test.forEach((test) => {
          test.run = function skip() { // eslint-disable-line func-names
            console.log(`Ignoring test - ${test.title}`);
            this.skip();
          };
        });
      }

      const cleanupCronjob = bash.Command('g3kubectl get cronjob fence-cleanup-expired-ga4gh-info > /dev/null 2>&1');
      if (!(cleanupCronjob)) {
        console.log('Skipping the test since cronjob is not deployed to the env.');
        suite.test.forEach((test) => {
          test.run = function skip() { // eslint-disable-line func-names
            console.log(`Ignoring test - ${test.title}`);
            this.skip();
          };
        });
      }
    }
  });
};
