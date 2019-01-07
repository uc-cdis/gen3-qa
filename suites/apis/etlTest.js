Feature('ETL');

Scenario('run ETL first time', async (I, etl) => {
  await etl.complete.runETLFirstTime();
});

Scenario('run ETL second time', async (I, etl) => {
  await etl.complete.runETLSecondTime();
});
