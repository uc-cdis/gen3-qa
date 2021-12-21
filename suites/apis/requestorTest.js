Feature('RequestorAPI');

/**
*   Create an access request for a policy that doesn’t exist in Arborist => 400 error.

*   The user does not have access. Create an access request for a policy that exists in Arborist.
    Update the access request status. The user should now have access.
    For this test, we need a 2nd user that has access to update statuses in Requestor;
    this is already set up since it’s also needed for the existing Study Viewer tests.

*   The user has access. Create a “revoke” access request. Update the access request status.
    The user should not have access anymore.

 */

const { expect } = require('chai');
const requestorTasks = require('../../services/apis/requestor/requestorTasks.js');

// Create an access request for a policy that doesn’t exist in Arborist => 400 error
Scenario('User requests access for a policy that does not exist in Arborist @requestor', async ({
  home, login, users,
}) => {
  home.do.goToHomepage();
  login.complete.login(users.user0);
  const response = await requestorTasks.createRequestFromPolicyID(users.user0, 'random-policy');
  expect(response).to.have.property('status_code', 400);
});

Scenario('User does not have access request for a policy and requests for access followed by sending a Revoke request @requestor', async ({
  home, login, users, fence,
}) => {
  home.do.goToHomepage();
  login.complete.login(users.user0);

  // Check that the user does not have access to policy 'requestor_integration_test'.
  let userInfo = await fence.do.getUserInfo(users.user0.accessToken);
  expect(userInfo.data.authz).to.have.property('/requestor-integration-test');
  expect(userInfo.data.authz['/requestor-integration-test']).to.deep.to.not.include({ method: 'read', service: 'integration' });

  // Create a request for a policy that is present in Arborist
  const createResponse = await requestorTasks.createRequestFromPolicyID(users.user0, 'requestor_integration_test');
  expect(createResponse).to.have.property('status_code', 201);

  // Check if the access is created -- It shouldn't since it is not signed yet
  userInfo = await fence.do.getUserInfo(users.user0.accessToken);
  expect(userInfo.data.authz['/requestor-integration-test']).to.deep.to.not.include({ method: 'read', service: 'integration' });

  // Create a PUT request to sign the previous request using an authenticated user
  await requestorTasks.signedRequest(createResponse.request_id);

  // Verify if access is given to the user -- There should be
  userInfo = await fence.do.getUserInfo(users.user0.accessToken);
  expect(userInfo.data.authz['/requestor-integration-test']).to.deep.to.include({ method: 'read', service: 'integration' });

  // Create a request to 'revoke' a policy that is present in Arborist
  const revokeResponse = await requestorTasks.createRequestFromPolicyID(users.user0, 'requestor_integration_test', true);

  // Check if the access is revoked -- It shouldn't since it is not signed yet
  userInfo = await fence.do.getUserInfo(users.user0.accessToken);
  expect(userInfo.data.authz['/requestor-integration-test']).to.deep.to.include({ method: 'read', service: 'integration' });

  // Create a PUT request to sign the previous request using an authenticated user
  await requestorTasks.signedRequest(revokeResponse.request_id);

  // Verify if access is revoked from the user
  userInfo = await fence.do.getUserInfo(users.user0.accessToken);
  expect(userInfo.data.authz['/requestor-integration-test']).to.deep.to.not.include({ method: 'read', service: 'integration' });
});

// Create a revoke request for a policy that exists in Arborist
// but user does not have access to=> 400 error
Scenario('User sends a revoke request to a property he does not have access to @requestor', async ({
  home, login, users, fence,
}) => {
  home.do.goToHomepage();
  login.complete.login(users.user1);
  // Check that the user does not have access to policy 'requestor_integration_test'.
  const userInfo = await fence.do.getUserInfo(users.user1.accessToken);
  expect(userInfo.data.authz['/requestor-integration-test']).to.deep.to.not.include({ method: 'read', service: 'integration' });

  // Create a request to 'revoke' a policy to which user does not have access to
  const revokeResponse = await requestorTasks.createRequestFromPolicyID(users.user1, 'requestor_integration_test', true);
  expect(revokeResponse).to.have.property('status_code', 400);
});
