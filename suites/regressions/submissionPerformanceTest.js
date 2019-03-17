Feature('Submission Performance Tests')
  .tag('@SubmissionPerformanceTests')
  .tag('@Performance');

const assert = require('assert');
const r = require('../../utils/regressions');

let data = [];

if (process.env.presignURLs) {
  const dataUrlsFromEnv = `${process.env.presignURLs}`.split(' ');
  data = r.getNodesFromURLs(dataUrlsFromEnv);
}

Data(data)
  .Scenario('Submission', async (current, sheepdog) => {
    const nodeAdded = await sheepdog.do.addNodeChunked(await current.nodes);
    assert.notStrictEqual(nodeAdded.addRes.body.message, 'internal server error');
  });
