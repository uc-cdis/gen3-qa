Feature('Query Performance Tests')
  .tag('@QueryPerformanceTests')
  .tag('@Performance');

const r = require('../../utils/regressions');

Data(r.bottomUpQueries)
  .Scenario(`Executing bottomUp query #`, async (current, peregrine) => {
    const res = await peregrine.do.query(await current.nodes, null);
    peregrine.ask.resultSuccess(res);
  });

Data(r.topDownQueries)
  .Scenario(`Executing topDown query #`, async (current, peregrine) => {
    const res = await peregrine.do.query(await current.nodes, null);
    peregrine.ask.resultSuccess(res);
  });
