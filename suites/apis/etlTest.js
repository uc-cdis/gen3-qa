Feature('ETL @requires-tube');

const { expect } = require('chai');

const { Bash } = require('../../utils/bash.js');
const { checkPod } = require('../../utils/apiUtil.js');

const bash = new Bash();

BeforeSuite(async ({ etl }) => {
  // this shouldn't normally be necessary, but just in case any indices didn't
  // get properly cleaned up in a prior run (e.g. es proxy pod or pod running
  // integration tests crashed)
  etl.do.cleanUpIndices();
});

Scenario('run ETL first time @etl', async ({ I }) => {
  console.log(`${new Date()}: Before run ETL first time`);
  await bash.runJob('etl', '', false);
  await checkPod(I, 'etl', 'gen3job,job-name=etl', { nAttempts: 80, ignoreFailure: false, keepSessionAlive: false });
  console.log(`${new Date()}: After run ETL first time`);
});

Scenario('run ETL second time @etl', async ({ I, sheepdog, etl }) => {
  console.log(`${new Date()}: Before run ETL second time`);
  await sheepdog.do.runGenTestData(1);
  await bash.runJob('etl', '', false);
  await checkPod(I, 'etl', 'gen3job,job-name=etl', { nAttempts: 80, ignoreFailure: false, keepSessionAlive: false });
  console.log(`${new Date()}: After run ETL second time`);

  const etlMappingNames = bash.runCommand('g3kubectl get cm etl-mapping -o jsonpath=\'{.data.etlMapping\\.yaml}\' | yq \'.mappings[].name\' | xargs').split(' ');
  const aliases = [];
  etlMappingNames.forEach((etlMappingName) => {
    aliases.push(etlMappingName, `${etlMappingName}-array-config`);
  });
  aliases.forEach((alias) => {
    if (etl.do.existAlias(alias)) {
      const index = etl.do.getIndexFromAlias(alias);
      etl.ask.hasVersionIncreased(index, 0);
    }
  });
});

AfterSuite(async ({ etl }) => {
  console.log('cleaning up indices created by ETL runs');
  etl.do.cleanUpIndices();
});
