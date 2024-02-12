Feature('ETL @requires-tube');

const { expect } = require('chai');

const { Bash } = require('../../utils/bash.js');
const { checkPod } = require('../../utils/apiUtil.js');

const bash = new Bash();

BeforeSuite(async ({ etl }) => {
  // this shouldn't normally be necessary, but just in case any indices didn't
  // get properly cleaned up in a prior run (e.g. es proxy pod or pod running
  // integration tests crashed)
  try {
    etl.do.cleanUpIndices();
  } catch (error) {
    console.log(error);
  }
});

Scenario('run ETL first time @etl', async ({ I, sheepdog }) => {
  console.log(`${new Date()}: Before run ETL first time`);
  await sheepdog.do.runGenTestData(1);
  await bash.runJob('etl', '', false);
  await checkPod(I, 'etl', 'gen3job,job-name=etl', { nAttempts: 180, ignoreFailure: false, keepSessionAlive: false });  //180 attempts = 30 minutes
  console.log(`${new Date()}: After run ETL first time`);
});

Scenario('run ETL second time @etl', async ({ I, sheepdog, etl }) => {
  console.log(`${new Date()}: Before run ETL second time`);
  await sheepdog.do.runGenTestData(1);
  await bash.runJob('etl', '', false);
  await checkPod(I, 'etl', 'gen3job,job-name=etl', { nAttempts: 180, ignoreFailure: false, keepSessionAlive: false });  //180 attempts = 30 minutes
  console.log(`${new Date()}: After run ETL second time`);

  const aliases = bash.runCommand('g3kubectl get cm etl-mapping -o jsonpath=\'{.data.etlMapping\\.yaml}\' | yq \'.mappings[].name\' | xargs').split(' ');
  aliases.forEach((alias) => {
    expect(etl.do.existAlias(alias), `alias ${alias} does not exist`).to.equal(true);
    const index = etl.do.getIndexFromAlias(alias);
    etl.ask.hasVersionIncreased(index, 0);
  });
});

AfterSuite(async ({ etl }) => {
  try {
    console.log('cleaning up indices created by ETL runs');
    etl.do.cleanUpIndices();
  } catch (error) {
    console.log(error);
  }
});
