Feature('ETL');

BeforeSuite(async ({ etl }) => {
  etl.props.aliases.forEach(async (alias) => {
    const index = etl.do.getIndexFromAlias(alias);
    if (index !== 'error') {
      etl.do.deleteIndices(index);
      expect(etl.do.existAlias(alias), 'Fails to delete alias').to.equal(false);
    }
  });
});

Scenario('run ETL first time @etl', async ({ etl }) => {
  console.log(`${new Date()}: Before run ETL first time`);
  await etl.complete.runETLFirstTime();
  console.log(`${new Date()}: After run ETL first time`);
});

Scenario('run ETL second time @etl', async ({ etl }) => {
  console.log(`${new Date()}: Before run ETL second time`);
  await etl.complete.runETLSecondTime();
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
