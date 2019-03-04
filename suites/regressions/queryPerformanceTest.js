Feature('Query Performance Tests')
  .tag('@QueryPerformanceTests')
  .tag('@Performance');

const r = require('../../utils/regressions');

Data(r.bottomUpQueries)
  .Scenario(`Executing bottomUp query # ${process.env.DB}`, async (current, peregrine) => {
    const res = await peregrine.do.query(await current.nodes, null);
    peregrine.ask.resultSuccess(res);
  });

Data(r.topDownQueries)
  .Scenario(`Executing topDown query # ${process.env.DB}`, async (current, peregrine) => {
    const res = await peregrine.do.query(await current.nodes, null);
    peregrine.ask.resultSuccess(res);
  });
