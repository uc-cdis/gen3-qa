const chai = require('chai');

const auditServiceProps = require('./auditServiceProps.js');
const { smartWait } = require('../../../utils/apiUtil');
const { Bash } = require('../../../utils/bash.js');

const bash = new Bash();
const { expect } = chai;
const I = actor();

async function waitForAuditLogs(category, userTokenHeader, params, nLogs) {
  /**
   * Wait until the audit-service has processed `nLogs` as expected.
   * @param {string} category - audit log category
   * @param {string} userTokenHeader - headers to use for authoriation
   * @param {string[]} params - optional query parameters
   * @param {boolean} nLogs - number of logs we expect to receive
   */
  const areLogsThere = async function (_category, _userTokenHeader, _params, _nLogs) {
    /**
     * Return true if the expected number of audit logs have been processed,
     * false otherwise
     * @param {string} _category - audit log category
     * @param {string} _userTokenHeader - headers to use for authoriation
     * @param {string[]} _params - optional query parameters
     * @param {boolean} _nLogs - number of logs we expect to receive
     * @returns {boolean}
     */
    // query audit logs
    const json = await module.exports.query(_category, _userTokenHeader, _params);
    if (json.data.length === _nLogs) {
      return true;
    } if (json.data.length > _nLogs) {
      // this should never happen
      console.error(`Expected to receive ${_nLogs} audit logs or less, but received ${json.data.length}.`);
    }
    console.log(`Expecting ${_nLogs} logs, received ${json.data.length} logs - waiting...`);
    return false;
  };

  // wait up to 5 min - it can take very long for the SQS to return
  // messages to the audit-service...
  const timeout = 300;
  await smartWait(
    areLogsThere,
    [category, userTokenHeader, params, nLogs],
    timeout,
    `The audit-service did not process ${nLogs} logs as expected after ${timeout} seconds`, // error message
    1, // initial number of seconds to wait
  );
}

async function waitForFenceToRoll() {
  /**
   * Wait until both fence and presigned-url-fence pods are ready.
   */
  const isFenceReady = async function () {
    /**
     * Return true if both fence and presigned-url-fence pods are ready,
     * false otherwise.
     * @returns {boolean}
     */
    for (const service of ['fence', 'presigned-url-fence']) {
      // get the status of the most recently started pod
      const res = await bash.runCommand(`g3kubectl get pods -l app=${service} --sort-by=.metadata.creationTimestamp`);
      if (process.env.DEBUG === 'true') {
        console.log(res);
      }
      let notReady = true;
      try {
        notReady = res.includes('0/1') || res.includes('Terminating');
      } catch (err) {
        console.error(`Unable to parse output. Error: ${err}. Output:`);
        console.error(res);
      }
      if (notReady) {
        return false;
      }
    }
    return true;
  };

  console.log('Waiting for pods to be ready');
  const timeout = 300; // wait up to 5 min
  await smartWait(
    isFenceReady,
    [],
    timeout,
    `Fence and presigned-url-fence pods are not ready after ${timeout} seconds`, // error message
    1, // initial number of seconds to wait
  );
}

module.exports = {
  async configureFenceAuditLogging(enable) {
    /**
     * Update the fence-config secret to enable or disable audit logging.
     * @param {boolean} enable - if true enable audit logging, otherwise disable it.
     */
    console.log(`Updating the fence-config secret to ${enable === true ? 'enable' : 'disable'} audit logging`);

    // dump the current secret in a temp file.
    // remove the first and last lines ("-------- fence-config.yaml:" and
    // "--------") because they are added again when we edit the secret, and
    // duplicates cause errors.
    await bash.runCommand('gen3 secrets decode fence-config > fence_config_tmp.yaml; sed -i \'1d;$d\' fence_config_tmp.yaml');

    // add the config we need at the bottom of the file - it will override
    // any audit config already defined.
    const enableString = enable === true ? 'true' : 'false';
    await bash.runCommand(`cat - >> "fence_config_tmp.yaml" <<EOM
ENABLE_AUDIT_LOGS:
  presigned_url: ${enableString}
  login: ${enableString}
EOM`);

    // update the secret
    const res = bash.runCommand('g3kubectl get secret fence-config -o json | jq --arg new_config "$(cat fence_config_tmp.yaml | base64)" \'.data["fence-config.yaml"]=$new_config\' | g3kubectl apply -f -');
    expect(res, 'Unable to update fence-config secret').to.equal('secret/fence-config configured');

    // roll Fence
    await bash.runCommand('rm fence_config_tmp.yaml; gen3 roll fence; gen3 roll presigned-url-fence');

    // wait for the pods to roll
    await waitForFenceToRoll();
  },

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
    expectedResults,
  ) {
    /**
     * Check if querying the audit-service returns the logs we expect.
     * @param {string} logCategory - audit log category
     * @param {string} userTokenHeader - headers to use for authoriation
     * @param {string[]} params - optional query parameters
     * @param {Object[]} expectedResults - values we expect to see in the logs
     */
    // we need some buffer time for the audit logs to be processed
    const nExpectedLogs = expectedResults.length;
    await waitForAuditLogs(logCategory, userTokenHeader, params, nExpectedLogs);

    // query audit logs
    const json = await module.exports.query(logCategory, userTokenHeader, params);
    const receivedLogs = json.data;
    if (process.env.DEBUG === 'true') {
      console.log('Received logs:');
      console.log(receivedLogs);
    }
    expect(receivedLogs.length, `Should receive exactly ${nExpectedLogs} audit logs, but received ${receivedLogs.length} logs`).to.equal(nExpectedLogs);

    // check that the returned audit logs contain the data we expect.
    // the latest audit-service returns audit logs in the order they were
    // created, but some older versions might not, and AWS SQS might shuffle
    // the messages, so we can't assume they're in the right order.
    expectedResults.forEach((expectedResult) => {
      if (process.env.DEBUG === 'true') {
        console.log('Checking expected result:');
        console.log(expectedResult);
      }
      // check that we received a log that matches the current expected log.
      // found==true if we found a received log for which all the fields match
      // the current expected log, false otherwise.
      const found = receivedLogs.some(
        (receivedLog) => Object.entries(expectedResult).every(
          ([field, expectedValue]) => receivedLog[field] === expectedValue,
        ),
      );
      expect(found, 'The audit log I expect is not in the logs I received').to.be.true;
    });
  },
};
