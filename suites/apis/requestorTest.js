Feature('RequestorAPI @requires-requestor');

/**
  This set of integration tests test the flow of requestor service
  integrated with arborist's policy engine. We test scenarios where
  we request for granting and revoking of policies through the requestor
  service and verify if appropriate responses or errors are returned.
 */

const { expect } = require('chai');
const requestorTasks = require('../../services/apis/requestor/requestorTasks.js');

BeforeSuite(async ({
  I,
}) => {
  I.cache = {};
  // declaring empty array to store the request ids created by the test
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
  if (process.env.DEBUG === 'true') {
    console.log(I.cache.requestDidList);
  }
  I.cache.requestDidList.forEach(async (request) => {
    const deleteRequest = await requestorTasks.deleteRequest(request);
    if (deleteRequest.status === 200) {
      console.log(`Request ${request} is deleted successfully`);
    }
  });
});

// Create an access request for a policy that doesn’t exist in Arborist => 400 error
Scenario('User requests access for a policy that does not exist in Arborist @requestor', async ({
  users,
}) => {
  const { accessTokenHeader } = users.mainAcct;
  const response = await requestorTasks.createRequestForPolicyID(accessTokenHeader, users.user0.username, 'random-policy');
  expect(response).to.have.property('status_code', 400);
});

Scenario('User requests access for a policy followed by sending a Revoke request @requestor', async ({
  I, users, fence,
}) => {
  // Check that the user does not have access to policy 'requestor_integration_test'.
  let userInfo = await fence.do.getUserInfo(users.user0.accessToken);
  expect(userInfo.data.authz).to.not.have.property('/requestor_integration_test');

  const { accessTokenHeader } = users.mainAcct;
  // Create a request for a policy that is present in Arborist
  const createResponse = await requestorTasks.createRequestForPolicyID(accessTokenHeader, users.user0.username, 'requestor_integration_test');
  I.cache.requestDidList.push(createResponse.request_id);
  expect(createResponse).to.have.property('status_code', 201);

  // Check if the access is created -- It shouldn't since it is not signed yet
  userInfo = await fence.do.getUserInfo(users.user0.accessToken);
  expect(userInfo.data.authz).to.not.have.property('/requestor_integration_test');

  // Create a PUT request to sign the previous request using an authenticated user
  await requestorTasks.signedRequest(createResponse.request_id);

  const user0AccessToken = users.user0.accessToken;
  // Verify if access is given to the user -- There should be
  userInfo = await fence.do.getUserInfo(user0AccessToken);
  expect(userInfo.data.authz).to.have.property('/requestor_integration_test');
  expect(userInfo.data.authz['/requestor_integration_test']).to.deep.to.include({ method: 'access', service: 'jupyterhub' });

  // Create a request to 'revoke' a policy that is present in Arborist
  const revokeResponse = await requestorTasks.createRequestForPolicyID(accessTokenHeader, users.user0.username, 'requestor_integration_test', true);

  // Check if the access is revoked -- It shouldn't since it is not signed yet
  userInfo = await fence.do.getUserInfo(user0AccessToken);
  expect(userInfo.data.authz).to.have.property('/requestor_integration_test');
  expect(userInfo.data.authz['/requestor_integration_test']).to.deep.to.include({ method: 'access', service: 'jupyterhub' });

  // Create a PUT request to sign the previous request using an authenticated user
  await requestorTasks.signedRequest(revokeResponse.request_id);

  // Verify if access is revoked from the user
  userInfo = await fence.do.getUserInfo(user0AccessToken);
  expect(userInfo.data.authz).to.not.have.property('/requestor_integration_test');
});

// Create a revoke request for a policy that exists in Arborist
// but user does not have access to=> 400 error
Scenario('Send a revoke request for a policy the user does not have @requestor', async ({
  users, fence,
}) => {
  // Check that the user does not have access to policy 'requestor_integration_test'.
  const userInfo = await fence.do.getUserInfo(users.user1.accessToken);
  expect(userInfo.data.authz).to.not.have.property('/requestor_integration_test');

  // Create a request to 'revoke' a policy to which user does not have access to
  const revokeResponse = await requestorTasks.createRequestForPolicyID(users.mainAcct.accessTokenHeader, users.user1.username, 'requestor_integration_test', true);
  expect(revokeResponse).to.have.property('status_code', 400);
});
