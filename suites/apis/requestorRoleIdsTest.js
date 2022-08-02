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

Before(async ({
  home, users, login,
}) => {
  home.do.goToHomepage();
  login.complete.login(users.mainAcct);
});

Scenario('User requests access for resource_paths and role_ids with a signed status (and revoke it later) @requestorNew', async ({
  users, fence,
}) => {
  // Check that the user does not have access to policy 'requestor_integration_test'.
  let userInfo = await fence.do.getUserInfo(users.user0.accessToken);
  //expect(userInfo.data.authz).to.not.have.property('/requestor_integration_test');

  const { accessTokenHeader } = users.mainAcct;
  const resourcePaths = ['/requestor_integration_test', 'mds_gateway']
  const roleIds = ['workspace_user', 'mds_user']
  // Create a request for resource_paths + role_ids present in Arborist with a SIGNED status to test
  // if the access is granted at the "create" endpoint
  const createResponse = await requestorTasks.createRequestForResourcePathsAndRoleIds(accessTokenHeader, users.user0.username, resourcePaths, roleIds, false, 'SIGNED');
  expect(createResponse).to.have.property('status_code', 201);

  const user0AccessToken = users.user0.accessToken;
  // Verify if access is given to the user -- There should be, since
  // the status in the previous step is set to SIGNED
  userInfo = await fence.do.getUserInfo(user0AccessToken);
  // The policy_id should be of the format `[resource_paths]_[role_ids]`
  expect(userInfo.data.authz).to.have.property('/requestor_integration_test_mds_gateway_workspace_user_mds_user');
  expect(userInfo.data.authz['/requestor_integration_test']).to.deep.to.include({ method: 'access', service: 'jupyterhub' });


});