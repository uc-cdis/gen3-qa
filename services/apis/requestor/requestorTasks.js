const studyViewerProps = require('./requestorProps.js');
const users = require('../../../utils/user');

const I = actor();

module.exports = {

  async getRequestId() {
    const getResponse = await I.sendGetRequest(
      `${studyViewerProps.endpoint.userEndPoint}`,
      users.mainAcct.accessTokenHeader,
    );
    const responseData = getResponse.data;
    const reqID = responseData[0].request_id;
    console.log(`### request id: ${reqID}`);
    return reqID;
  },

  // update status
  async putRequest(reqIDPut) {
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
