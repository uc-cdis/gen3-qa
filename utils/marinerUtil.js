const marinerProps = require('../services/apis/mariner/marinerProps.js');
const user = require('./user.js');

const I = actor();

// The auth header format might change to fix this bug:
// https://ctds-planx.atlassian.net/browse/PXP-6814
const authHeader = { Authorization: user.mainAcct.accessToken };

module.exports = {
  async runWorkflow(workflow) {
    const response = await I.sendPostRequest(
      marinerProps.endpoints.rootEndPoint,
      workflow,
      authHeader,
    );
    return response.data.runID;
  },

  async fetchRunStatus(runId) {
    const response = await I.sendGetRequest(
      `${marinerProps.endpoints.rootEndPoint}/${runId}/status`,
      authHeader,
    );
    return response.data.status;
  },

  async fetchRunLogs(runId) {
    const response = await I.sendGetRequest(
      `${marinerProps.endpoints.rootEndPoint}/${runId}`,
      authHeader,
    );
    return response.data.log;
  },

  async fetchRunHistory() {
    const response = await I.sendGetRequest(
      marinerProps.endpoints.rootEndPoint,
      authHeader,
    );
    return response.data.runIDs;
  },

  async cancelRun(runId, workflow) {
    const response = await I.sendPostRequest(
      `${marinerProps.endpoints.rootEndPoint}/${runId}/cancel`,
      workflow,
      authHeader,
    );
    return response;
  },
};
