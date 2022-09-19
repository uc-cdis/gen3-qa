const chai = require('chai');

const requestorProps = require('./requestorProps.js');
const users = require('../../../utils/user');

const { expect } = chai;
const I = actor();

module.exports = {

  async getRequestId() {
    const getResponse = await I.sendGetRequest(
      `${requestorProps.endpoint.userEndPoint}`,
      users.user0.accessTokenHeader,
    );
    const responseData = getResponse.data;
    expect(responseData).to.not.be.empty;
    const reqID = responseData[0].request_id;
    if (process.env.DEBUG === 'true') {
      console.log(`### request id: ${reqID}`);
    }
    return reqID;
  },

  /**
  * @param {string} adminUserTokenHeader - headers for user authorized in Requestor
  * @param {string} username - username to grant/revoke access for
  * @param {string} policyID - policyID of the policy to request/revoke access
  * @param {array} resourcePaths - resource_paths to request/revoke access
  * @param {array} roleIds - role_ids to request/revoke access
  * @param {boolean} revoke - set to true to create a revoke request
  */
  async createRequest(
    adminUserTokenHeader, username, policyID, resourcePaths = null, roleIds = null, revoke = false, requestStatus = null,
  ) {

    let data = {}
    // args should include policyID or resourcePaths+roleIds
    if (policyID && !(resourcePaths) && !(roleIds)) {
      console.log(`### creating request for a policy id: ${policyID} with revoke set as ${revoke}`);
      data = {
        username,
        policy_id: policyID,
      };
    } else if (resourcePaths && roleIds && !(policyID)) {
      console.log(`### creating request for a resource_paths: ${resourcePaths} and role_ids: ${roleIds} with revoke set as ${revoke}`);
      data = {
        username,
        resource_paths: resourcePaths,
        role_ids: roleIds,
      };
    } else {
      console.log(`### incorrect args in createRequest: must have policyID or resourcePaths+roleIds`);
      return null;
    }

    if (requestStatus) {
      data.status = requestStatus;
    }
    const endPoint = revoke ? `${requestorProps.endpoint.requestEndPoint}?revoke` : `${requestorProps.endpoint.requestEndPoint}`;
    const getResponse = await I.sendPostRequest(
      endPoint,
      data,
      adminUserTokenHeader,
    );
    const responseData = getResponse.data;
    responseData.status_code = getResponse.status;
    if (process.env.DEBUG === 'true') {
      console.log(`### responseData: ${JSON.stringify(responseData)}`);
    }
    return responseData;
  },

  // get the request ID status
  async getRequestStatus(requestID) {
    if (process.env.DEBUG === 'true') {
      console.log(`### get request id: ${requestID}`);
    }
    const getResponse = await I.sendGetRequest(
      `${requestorProps.endpoint.requestEndPoint}/${requestID}`,
      users.mainAcct.accessTokenHeader,
    );
    const responseData = getResponse.data;
    if (process.env.DEBUG === 'true') {
      console.log(`### responseData: ${JSON.stringify(responseData)}`);
    }
    const reqStatus = responseData.status;
    if (process.env.DEBUG === 'true') {
      console.log(`### request status: ${reqStatus}`);
    }
    return reqStatus;
  },

  // update to APPROVED status
  async approvedStatus(reqIDPut) {
    if (process.env.DEBUG === 'true') {
      console.log(`### put request id: ${reqIDPut}`);
    }
    await I.sendPutRequest(
      `${requestorProps.endpoint.requestEndPoint}/${reqIDPut}`,
      { status: 'APPROVED' },
      users.mainAcct.accessTokenHeader,
    );
  },

  // update to SIGNED status
  async signedRequest(reqIDPut) {
    // const reqIDPut = await this.getRequestId();
    if (process.env.DEBUG === 'true') {
      console.log(`### put request id: ${reqIDPut}`);
    }
    // sending PUT request /requestor/request/${req_id} endpoint
    await I.sendPutRequest(
      `${requestorProps.endpoint.requestEndPoint}/${reqIDPut}`,
      { status: 'SIGNED' },
      users.mainAcct.accessTokenHeader,
    );
  },

  async deleteRequest(reqIDDel) {
    // const reqIDDel = await this.getRequestId();
    if (process.env.DEBUG === 'true') {
      console.log(`### delete request id: ${reqIDDel}`);
    }
    return I.sendDeleteRequest(
      `${requestorProps.endpoint.requestEndPoint}/${reqIDDel}`,
      users.mainAcct.accessTokenHeader,
    );
  },
};
