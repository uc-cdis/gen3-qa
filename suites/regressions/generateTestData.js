Feature('Generate Test Data')
  .tag('@GenerateTestData')
  .tag('@Performance');

const r = require('../../utils/regressions');

Scenario('Generate test data', async () => {
  await r.writeBottomUpQueries();
  await r.writeTopDownQueries();
  await r.writeLongestPath();
  await r.writeRepresentativeIDs();
});
