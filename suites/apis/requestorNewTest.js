Feature('RequestorNewAPI @requires-requestorNew');

/**
  This set of integration tests are the extension to the existing
  requestorTest suite. They test the flow of new features included
  in requestor service after version 1.5.1. The whole purpose of this
  new suite is to overcome the limitation of `runTestsIfServiceVersion`
  to only filter out at the test-suite level.
 */

const { expect } = require('chai');
const requestorTasks = require('../../services/apis/requestor/requestorTasks.js');

BeforeSuite(async ({
  I,
}) => {
  I.cache = {};
  I.cache.requestDidList = [];
});

Before(async ({
  home, users, login,
}) => {
  home.do.goToHomepage();
  login.complete.login(users.mainAcct);
});

AfterSuite(async ({ I }) => {
  console.log('Deleting all the requests created by this test with user cdis.autotest@gmail.com...');
  console.log(I.cache.requestDidList);
  I.cache.requestDidList.forEach(async (request) => {
    const deleteRequest = await requestorTasks.deleteRequest(request);
    if (deleteRequest === undefined) {
      console.log(`Request ${request} is deleted successfully`);
    }
  });
});

Scenario('User requests access for a policy with a signed status (and revoke it later) @requestorNew', async ({
  I, users, fence,
}) => {
  // Check that the user does not have access to policy 'requestor_integration_test'.
  let userInfo = await fence.do.getUserInfo(users.user0.accessToken);
  expect(userInfo.data.authz).to.not.have.property('/requestor_integration_test');

  const { accessTokenHeader } = users.mainAcct;
  // Create a request for a policy that is present in Arborist with a SIGNED status to test
  // if the access is granted at the "create" endpoint
  const createResponse = await requestorTasks.createRequestForPolicyID(accessTokenHeader, users.user0.username, 'requestor_integration_test', false, 'SIGNED');
  I.cache.requestDidList.push(createResponse.request_id);
  expect(createResponse).to.have.property('status_code', 201);

  const user0AccessToken = users.user0.accessToken;
  // Verify if access is given to the user -- There should be, since
  // the status in the previous step is set to SIGNED
  userInfo = await fence.do.getUserInfo(user0AccessToken);
  expect(userInfo.data.authz).to.have.property('/requestor_integration_test');
  expect(userInfo.data.authz['/requestor_integration_test']).to.deep.to.include({ method: 'access', service: 'jupyterhub' });

  // Create a request to 'revoke' a policy that is present in Arborist again
  // with request status set to SIGNED
  const createResponseSecond = await requestorTasks.createRequestForPolicyID(accessTokenHeader, users.user0.username, 'requestor_integration_test', true, 'SIGNED');
  I.cache.requestDidList.push(createResponseSecond.request_id);

  // Verify if access is revoked from the user
  userInfo = await fence.do.getUserInfo(user0AccessToken);
  expect(userInfo.data.authz).to.not.have.property('/requestor_integration_test');
});
