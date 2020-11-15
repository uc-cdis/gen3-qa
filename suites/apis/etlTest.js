Feature('ETL');

Scenario('run ETL first time @etl', async ({ etl }) => {
  await etl.complete.runETLFirstTime();
}).retry(1);

Scenario('run ETL second time @etl', async ({ etl }) => {
  await etl.complete.runETLSecondTime();
}).retry(1);
