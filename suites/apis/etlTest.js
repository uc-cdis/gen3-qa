Feature('ETL');

const { Bash } = require('../../utils/bash.js');
const { checkPod } = require('../../utils/apiUtil.js');

const bash = new Bash();

BeforeSuite(async ({ etl }) => {
  etl.props.aliases.forEach(async (alias) => {
    const index = etl.do.getIndexFromAlias(alias);
    if (index !== 'error') {
      etl.do.deleteIndices(index);
      expect(etl.do.existAlias(alias), 'Fails to delete alias').to.equal(false);
    }
  });
});

Scenario('run ETL first time @etl', async () => {
  console.log(`${new Date()}: Before run ETL first time`);
  await bash.runJob('etl', '', false);
  await checkPod('etl', 'gen3job,job-name=etl', { nAttempts: 18, ignoreFailure: false });
  console.log(`${new Date()}: After run ETL first time`);
});

Scenario('run ETL second time @etl', async ({ sheepdog }) => {
  console.log(`${new Date()}: Before run ETL second time`);
  await sheepdog.do.runGenTestData(1);
  await bash.runJob('etl', '', false);
  await checkPod('etl', 'gen3job,job-name=etl', { nAttempts: 18, ignoreFailure: false });
  console.log(`${new Date()}: After run ETL second time`);
});

AfterSuite(async ({ etl }) => {
  etl.props.aliases.forEach((alias) => {
    if (etl.do.existAlias(alias)) {
      const index = etl.do.getIndexFromAlias(alias);
      console.error(index);
      etl.ask.hasVersionIncreased(index, 0);
    }
  });
});
