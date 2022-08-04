Feature('RequestorRoleIdsAPI @requires-requestorRoleIds');

/**
  This Scenario tests a request with resource_paths and role_ids
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
  if (process.env.DEBUG === 'true') {
    console.log(I.cache.requestDidList);
  }
  I.cache.requestDidList.forEach(async (request) => {
    const deleteRequest = await requestorTasks.deleteRequest(request);
    if (deleteRequest === undefined) {
      console.log(`Request ${request} is deleted successfully`);
    }
  });
});

Scenario('User requests access for resource_paths and role_ids with a signed status (and revoke it later) @requestorRoleIds @heal', async ({
  I, users, fence,
}) => {
  // Check that the user does not have access to policy 'requestor_integration_test'.
  let userInfo = await fence.do.getUserInfo(users.user0.accessToken);
  expect(userInfo.data.authz).to.not.have.property('/requestor_integration_test_mds_gateway_workspace_user_mds_user');

  const { accessTokenHeader } = users.mainAcct;
  const resourcePaths = ['/requestor_integration_test', 'mds_gateway']
  const roleIds = ['workspace_user', 'mds_user']
  // Create a request for resource_paths + role_ids present in Arborist with a SIGNED status to test
  // if the access is granted at the "create" endpoint
  const createResponse = await requestorTasks.createRequestForResourcePathsAndRoleIds(accessTokenHeader, users.user0.username, resourcePaths, roleIds, false, 'SIGNED');
  I.cache.requestDidList.push(createResponse.request_id);
  expect(createResponse).to.have.property('status_code', 201);

  const user0AccessToken = users.user0.accessToken;
  // Verify if access is given to the user -- There should be, since
  // the status in the previous step is set to SIGNED
  userInfo = await fence.do.getUserInfo(user0AccessToken);
  // The policy_id should be of the format `[resource_paths]_[role_ids]`
  expect(userInfo.data.authz).to.have.property('/requestor_integration_test_mds_gateway_workspace_user_mds_user');
  expect(userInfo.data.authz['/requestor_integration_test_mds_gateway_workspace_user_mds_user']).to.deep.to.include({ method: 'access', service: 'jupyterhub' });


});