const marinerProps = require('../services/apis/mariner/marinerProps.js');

const I = actor();

// The auth header format might change to fix this bug:
// https://ctds-planx.atlassian.net/browse/PXP-6814
// Currently it is { Authorization: user.mainAcct.accessToken }
// Once the bug is fixed we can use the tokenHeader of user directly

module.exports = {
  async runWorkflow(user, workflow) {
    const response = await I.sendPostRequest(
      marinerProps.endpoints.rootEndPoint,
      workflow,
      { Authorization: user.accessToken },
    );
    return response.data.runID;
  },

  async fetchRunStatus(user, runId) {
    const response = await I.sendGetRequest(
      `${marinerProps.endpoints.rootEndPoint}/${runId}/status`,
      { Authorization: user.accessToken },
    );
    return response.data.status;
  },

  async fetchRunLogs(user, runId) {
    const response = await I.sendGetRequest(
      `${marinerProps.endpoints.rootEndPoint}/${runId}`,
      { Authorization: user.accessToken },
    );
    return response.data.log;
  },

  async fetchRunHistory(user) {
    const response = await I.sendGetRequest(
      marinerProps.endpoints.rootEndPoint,
      { Authorization: user.accessToken },
    );
    return response.data.runIDs;
  },

  async cancelRun(user, runId, workflow) {
    const response = await I.sendPostRequest(
      `${marinerProps.endpoints.rootEndPoint}/${runId}/cancel`,
      workflow,
      { Authorization: user.accessToken },
    );
    return response;
  },
};
