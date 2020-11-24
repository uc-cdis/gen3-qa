Feature('ETL');

Scenario('run ETL first time @etl', async ({ etl }) => {
  console.log(`${Date.now()}: Before run ETL first time`);
  await etl.complete.runETLFirstTime();
  console.log(`${Date.now()}: After run ETL first time`);
}).retry(1);

Scenario('run ETL second time @etl', async ({ etl }) => {
  console.log(`${Date.now()}: Before run ETL second time`);
  await etl.complete.runETLSecondTime();
  console.log(`${Date.now()}: After run ETL second time`);
}).retry(1);
