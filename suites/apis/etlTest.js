Feature('ETL');

Scenario('run ETL first time @etl', async ({ etl }) => {
  console.log(`${new Date()}: Before run ETL first time`);
  await etl.complete.runETLFirstTime();
  console.log(`${new Date()}: After run ETL first time`);
}).retry(1);

Scenario('run ETL second time @etl', async ({ etl }) => {
  console.log(`${new Date()}: Before run ETL second time`);
  await etl.complete.runETLSecondTime();
  console.log(`${new Date()}: After run ETL second time`);
}).retry(1);
