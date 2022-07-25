const { event } = require('codeceptjs');
const { Bash } = require('../utils/bash');

const bash = new Bash();

module.exports = async function () {
  event.dispatcher.on(event.suite.before, (suite) => {
    console.log('*******');
    console.log(`SUITE: ${suite.title}`);
    if (suite.title === 'DRS RAS visa @requires-fence @requires-indexd') {
      const drsEnabled = bash.runCommand('gen3 secrets decode fence-config fence-config.yaml | yq .GA4GH_PASSPORTS_TO_DRS_ENABLED');
      if (drsEnabled !== true) {
        console.log('Skipping the RAS DRS tests since required configuration is not in fence-config.yaml');
        console.dir(suite.tests);
        suite.tests.forEach((test) => {
          test.run = function skip() { // eslint-disable-line func-names
            console.log(`Ignoring test - ${test.title}`);
            this.skip();
          };
        });
      }

      const updateCronjob = bash.runCommand('g3kubectl get cronjobs');
      if (process.env.DEBUG === 'true') {
        console.log(`${updateCronjob}`);
      }
      if (!(updateCronjob.includes('fence-visa-update') && updateCronjob.includes('fence-cleanup-expired-ga4gh-info'))) {
        console.log('Skipping the test since cronjobs is not deployed to the env.');
        console.dir(suite.tests);
        suite.tests.forEach((test) => {
          test.run = function skip() { // eslint-disable-line func-names
            console.log(`Ignoring test - ${test.title}`);
            this.skip();
          };
        });
      }
    }

    if (suite.title === 'Register User For Data Downloading @requires-portal') {
      const loginForDownload = bash.runCommand('gen3 secrets decode portal-config gitops.json | jq \'.explorerConfig[1].loginForDownload\'');
      const haveDropdown = bash.runCommand('gen3 secrets decode portal-config gitops.json | jq \'.explorerConfig[0].guppyConfig.dropdowns\'');
      if (!loginForDownload || loginForDownload !== 'true' || !haveDropdown || haveDropdown === 'null') {
        console.log('Skipping the Register User For Data Downloading tests since required configuration is not in gitops.json');
        console.dir(suite.tests);
        suite.tests.forEach((test) => {
          test.run = function skip() { // eslint-disable-line func-names
            console.log(`Ignoring test - ${test.title}`);
            this.skip();
          };
        });
      }
    }

    if (suite.title === 'nonDBGap Project Usersync @requires-fence @requires-indexd') {
      const dbGaPConfig = bash.runCommand('gen3 secrets decode fence-config fence-config.yaml | yq -r \'.dbGaP[] | select(."info".username=="qa-dcf") | ."allow_non_dbgap_whitelist"\'');
      if (!dbGaPConfig) {
        console.log('Skipping nonDBGap project usersync tests since the required configuration is not in fence-config.yaml');
        console.dir(suite.tests);
        suite.tests.forEach((test) => {
          test.run = function skip() { // eslint-disable-line func-names
            console.log(`Ignoring test - ${test.title}`);
            this.skip();
          };
        });
      }
    }
  });
};
