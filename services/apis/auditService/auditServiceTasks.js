const chai = require('chai');

const { expect } = chai;
const { smartWait } = require('../../../utils/apiUtil');

const auditServiceProps = require('./auditServiceProps.js');

const I = actor();

/**
 * wait until the audit-service has processed `nLogs` as expected
 */
async function waitForAuditLogs(category, userTokenHeader, params, nLogs) {
  /**
   * return true if the expected number of audit logs have been processed,
   * false otherwise
   */
  const areLogsThere = async function (_category, _userTokenHeader, _params, _nLogs) {
    // query audit logs
    const json = await module.exports.query(_category, _userTokenHeader, _params);
    if (json.data.length === _nLogs) {
      return true;
    } if (json.data.length > _nLogs) {
      // this should never happen
      console.error(`Expected to receive ${_nLogs} audit logs or less, bugt received ${json.data.length}.`);
    }
    console.log(`Expecting ${_nLogs} logs, received ${json.data.length} logs - waiting...`);
    return false;
  };

  const timeout = 120; // max number of seconds to wait
  const startWait = 1; // initial number of seconds to wait
  const errorMessage = `The audit-service did not process ${nLogs} logs as expected after ${timeout} seconds`;

  await smartWait(
    areLogsThere,
    [category, userTokenHeader, params, nLogs],
    timeout,
    errorMessage,
    startWait,
  );
}

module.exports = {
  async query(logCategory, userTokenHeader, params = [], expectedStatus = 200) {
    /**
     * Hit the audit-service query endpoint.
     * @param {string} logCategory - audit log category
     * @param {string} userTokenHeader - headers to use for authoriation
     * @param {string[]} params - optional query parameters
     * @param {boolean} expectedStatus - expected status code, if not 200
     * @returns {Promise<list>} - data returned by the audit-service
     */
    let url = `${auditServiceProps.endpoints.query}/${logCategory}`;
    if (params && params.length > 0) {
      url += `?${params.join('&')}`;
    }
    const response = await I.sendGetRequest(url, userTokenHeader);
    expect(response, 'Audit logs query failed').to.have.property('status', expectedStatus);

    if (expectedStatus === 200) {
      expect(response, 'No data in response').to.have.property('data');
      const json = response.data;
      expect(json, 'No data in JSON response').to.have.property('data');
      expect(json, 'No nextTimeStamp in JSON response').to.have.property('nextTimeStamp');
      return json;
    }

    return {};
  },

  async checkQueryResults(
    logCategory,
    userTokenHeader,
    params = [],
    nExpectedLogs,
    expectedResults,
  ) {
    /**
     * Check if querying the audit-service returns the logs we expect.
     * @param {string} logCategory - audit log category
     * @param {string} userTokenHeader - headers to use for authoriation
     * @param {string[]} params - optional query parameters
     * @param {int} nExpectedLogs - expected number of logs
     * @param {Object[]} expectedResults - values we expect to see in the logs
     */
    // we need some buffer time for the audit logs to be processed
    await waitForAuditLogs(logCategory, userTokenHeader, params, nExpectedLogs);

    // query audit logs starting at time 'timestamp'
    const json = await module.exports.query(logCategory, userTokenHeader, params);
    const receivedLogs = json.data;
    expect(receivedLogs.length, `Should receive exactly ${nExpectedLogs} audit logs but received ${receivedLogs}`).to.equal(nExpectedLogs);

    // check that the returned audit logs contain the data we expect.
    // the latest audit-service returns audit logs in the order they were
    // created, but some older versions might not, so we can't assume they're
    // in the right order.
    expectedResults.forEach((expectedResult) => {
      // check that we received a log that matches the current expected log.
      // found==true if all the fields in this received log match
      // the current expected log, false otherwise.
      const found = receivedLogs.some(
        (receivedLog) => Object.entries(expectedResult).every(
          ([field, expectedValue]) => receivedLog[field] === expectedValue,
        ),
      );
      expect(found, `Expected ${expectedResult} to be in audit logs ${receivedLogs}`).to.be.true;
    });
  },
};
