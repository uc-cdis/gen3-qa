Feature('Mariner');

/*
OVERVIEW
* Mariner is the workflow execution service of Gen3
* Docs - https://github.com/uc-cdis/mariner#how-to-use-mariner

FUNCTIONALITY
* Run a workflow - POST /ga4gh/wes/v1/runs
* Check status - /ga4gh/wes/v1/runs/<runID>/status
* Fetch run history - /ga4gh/wes/v1/runs
* Cancel run - /ga4gh/wes/v1/runs/<runID>/cancel
*/

const fs = require('fs');
const path = require('path');
const { expect } = require('chai');
const { sleepMS } = require('../../utils/apiUtil.js');
const user = require('../../utils/user.js');
const { runWorkflow, fetchRunStatus, cancelRun, fetchRunHistory } = require('../../utils/marinerUtil.js');

Scenario('Run no_input_test workflow @mariner',
  async () => {
    const wfJson = JSON.parse(fs.readFileSync(path.resolve(__dirname, './workflows/no_input_test/request_body.json')));
    const runId = await runWorkflow(user.mainAcct, wfJson);
    let retryCount = 6;
    let status = 'unknown';
    do {
      try {
        status = await fetchRunStatus(user.mainAcct, runId);
      } catch (error) {
        retryCount -= 1;
        await sleepMS(10000);
      }
    } while (status !== 'running' && retryCount > 0);
    expect(status).to.equal('running');
    //fetch run log and check the user
    const runloguser = await fetchRunLogsGetUser(user.mainAcct, runId);
    console.log(runlog);
    expect(runlog).to.have.nested.property('eventLog.events')
    //fetch run history
    const runIDs = await fetchRunHistory(user.mainAcct);
    expect(runIDs).to.be.an('array').that.includes(runId);
  });

Scenario('Cancel running no_input_test workflow @mariner',
  async () => {
    const wfJson = JSON.parse(fs.readFileSync(path.resolve(__dirname, './workflows/no_input_test/request_body.json')));
    const runId = await runWorkflow(user.mainAcct, wfJson);
    let retryCount = 6;
    let status = 'unknown';
    do {
      try {
        status = await fetchRunStatus(user.mainAcct, runId);
      } catch (error) {
        retryCount -= 1;
        await sleepMS(10000);
      }
    } while (status !== 'running' && retryCount > 0);
    expect(status).to.equal('running');
    const res = await cancelRun(user.mainAcct, runId, wfJson);
    console.log(res);
    do {
      try {
        status = await fetchRunStatus(user.mainAcct, runId);
      } catch (error) {
        retryCount -= 1;
        await sleepMS(10000);
      }
    } while (status !== 'cancelled' && retryCount > 0);
    expect(status).to.equal('cancelled');
    //fetch run history
    const runIDs = await fetchRunHistory(user.mainAcct);
    expect(runIDs).to.be.an('array').that.includes(runId);
  });
