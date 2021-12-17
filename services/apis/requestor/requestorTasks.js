const studyViewerProps = require('./requestorProps.js');
const users = require('../../../utils/user');

const I = actor();

module.exports = {

  async getRequestId() {
    const getResponse = await I.sendGetRequest(
      `${studyViewerProps.endpoint.userEndPoint}`,
      users.user0.accessTokenHeader,
    );
    const responseData = getResponse.data;
    const reqID = responseData[0].request_id;
    console.log(`### request id: ${reqID}`);
    return reqID;
  },

  async createRequestFromPolicyID(user, policyID, revoke = false) {
    console.log(`### creating request for a policy id: ${policyID}`);
    const endPoint = revoke ? `${studyViewerProps.endpoint.requestEndPoint}?revoke` : `${studyViewerProps.endpoint.requestEndPoint}`;
    const getResponse = await I.sendPostRequest(
      endPoint,
      {
        username: user.username,
        policy_id: policyID,
      },
      user.accessTokenHeader,
    );
    const responseData = getResponse.data;
    responseData.status_code = getResponse.status;
    console.log(`### responseData: ${JSON.stringify(responseData)}`);
    return responseData;
  },

  // get the request ID status
  async getRequestStatus(requestID) {
    console.log(`### get request id: ${requestID}`);
    const getResponse = await I.sendGetRequest(
      `${studyViewerProps.endpoint.requestEndPoint}/${requestID}`,
      users.mainAcct.accessTokenHeader,
    );
    const responseData = getResponse.data;
    console.log(`### responseData: ${JSON.stringify(responseData)}`);
    const reqStatus = responseData.status;
    console.log(`### request status: ${reqStatus}`);
    return reqStatus;
  },

  // update to APPROVED status
  async approvedStatus(reqIDPut) {
    console.log(`### put request id: ${reqIDPut}`);
    await I.sendPutRequest(
      `${studyViewerProps.endpoint.requestEndPoint}/${reqIDPut}`,
      { status: 'APPROVED' },
      users.mainAcct.accessTokenHeader,
    );
  },

  // update to SIGNED status
  async signedRequest(reqIDPut) {
    // const reqIDPut = await this.getRequestId();
    console.log(`### put request id: ${reqIDPut}`);
    // sending PUT request /requestor/request/${req_id} endpoint
    await I.sendPutRequest(
      `${studyViewerProps.endpoint.requestEndPoint}/${reqIDPut}`,
      { status: 'SIGNED' },
      users.mainAcct.accessTokenHeader,
    );
  },

  async deleteRequest(reqIDDel) {
    // const reqIDDel = await this.getRequestId();
    console.log(`### delete request id: ${reqIDDel}`);
    await I.sendDeleteRequest(
      `${studyViewerProps.endpoint.requestEndPoint}/${reqIDDel}`,
      users.mainAcct.accessTokenHeader,
    );
  },
};
