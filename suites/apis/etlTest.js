Feature('ETL @requires-tube');

const { expect } = require('chai');

const { Bash } = require('../../utils/bash.js');
const { checkPod } = require('../../utils/apiUtil.js');

const bash = new Bash();
let aliases = [];

BeforeSuite(async ({ etl }) => {
  const etlMappingNames = bash.runCommand(`g3kubectl get cm etl-mapping -o jsonpath='{.data.etlMapping\\.yaml}' | yq '.mappings[].name' | xargs`).split(" ");

  etlMappingNames.forEach((etlMappingName) => {
    aliases.push(etlMappingName, `${etlMappingName}-array-config`);
  });

  aliases.forEach((alias) => {
    if (etl.do.existAlias(alias)) {
      console.warn(`WARNING: alias ${alias} exists prior to running ETL tests`);
      const index = etl.do.getIndexFromAlias(alias);
      console.log(`deleting all index versions associated with alias ${alias}`);
      etl.do.deleteAllIndexVersions(index);
      expect(etl.do.existAlias(alias), 'Fails to delete alias').to.equal(false);
    }
  });
});

Scenario('run ETL first time @etl', async ({ I }) => {
  console.log(`${new Date()}: Before run ETL first time`);
  await bash.runJob('etl', '', false);
  await checkPod(I, 'etl', 'gen3job,job-name=etl', { nAttempts: 80, ignoreFailure: false, keepSessionAlive: false });
  console.log(`${new Date()}: After run ETL first time`);
});

Scenario('run ETL second time @etl', async ({ I, sheepdog }) => {
  console.log(`${new Date()}: Before run ETL second time`);
  await sheepdog.do.runGenTestData(1);
  await bash.runJob('etl', '', false);
  await checkPod(I, 'etl', 'gen3job,job-name=etl', { nAttempts: 80, ignoreFailure: false, keepSessionAlive: false });
  console.log(`${new Date()}: After run ETL second time`);
});

AfterSuite(async ({ etl }) => {
  console.log("cleaning up indices created by ETL runs");
  aliases.forEach((alias) => {
    if (etl.do.existAlias(alias)) {
      console.log(`deleting all index versions associated with alias ${alias}`);
      const index = etl.do.getIndexFromAlias(alias);
      etl.ask.hasVersionIncreased(index, 0);
      etl.do.deleteAllIndexVersions(index);
      expect(etl.do.existAlias(alias), 'Fails to delete alias').to.equal(false);
    }
  });
});
