const fs = require('fs');
const path = require('path');
const { expect } = require('chai');
const { sleepMS } = require('../../utils/apiUtil.js');
const util = require('../../utils/marinerUtil.js');

Feature('Mariner');

Scenario('Run no_input_test workflow @mariner',
  async () => {
    const wfJson = JSON.parse(fs.readFileSync(path.resolve(__dirname, './workflows/no_input_test/request_body.json')));
    const runId = await util.runWorkflow(wfJson);
    let retryCount = 3;
    let status = 'unknown';
    do {
      try {
        status = await util.fetchRunStatus(runId);
      } catch (error) {
        retryCount -= 1;
        await sleepMS(10000);
      }
    } while (status !== 'running' && retryCount > 0);
    expect(status).to.equal('running');
  });
