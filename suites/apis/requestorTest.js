Feature('RequestorAPI');

/**
*   Create an access request for a policy that doesn’t exist in Arborist => 400 error.

*   The user does not have access. Create an access request for a policy that exists in Arborist. 
    Update the access request status. The user should now have access.
    For this test, we need a 2nd user that has access to update statuses in Requestor; 
    this is already set up since it’s also needed for the existing Study Viewer tests.
    
*   The user has access. Create a “revoke” access request. Update the access request status. The user should not have access anymore.

 */

const { expect } = require('chai');
const requestorTasks = require('../../services/apis/requestor/requestorTasks.js');



Before(async ({
    home, users, login
}) => {
    home.do.goToHomepage();
    login.complete.login(users.user0);
});


// Create an access request for a policy that doesn’t exist in Arborist => 400 error
Scenario('User requests access for a policy that does not exist in Arborist @requestor', async ({
    users,
}) => {
    response = await requestorTasks.createRequestFromPolicyID(users.user0, 'random-policy');
    expect(response).to.have.property('status_code', 400);
});


Scenario('User does not have access request for a policy and requests for access. @requestor', async ({
    users, fence
}) => {
    
    // Check that the user does not have access to policy 'programs.jnkns-read-storage'.
    userInfo = await fence.do.getUserInfo(users.user0.accessToken);
    expect(userInfo.data.authz).to.have.property("/programs/jnkns");
    expect(userInfo.data.authz["/programs/jnkns"]).to.deep.to.not.include({ method: 'read-storage', service: '*' })
    
    // Create a request for a policy that is present in Arborist
    response = await requestorTasks.createRequestFromPolicyID(users.user0, 'programs.jnkns-read-storage');
    expect(response).to.have.property('status_code', 201);
    
    // Check if the access is created -- It shouldn't since it is not signed yet
    userInfo = await fence.do.getUserInfo(users.user0.accessToken);
    expect(userInfo.data.authz["/programs/jnkns"]).to.deep.to.not.include({ method: 'read-storage', service: '*' })
    
    // Create a PUT request to sign the previous request using an authenticated user
    await requestorTasks.signedRequest(response.request_id);
    
    // Verify if access is given to the user -- There should be
    userInfo = await fence.do.getUserInfo(users.user0.accessToken);
    expect(userInfo.data.authz["/programs/jnkns"]).to.deep.to.include({ method: 'read-storage', service: '*' })
    
});



Scenario('User has access to a policy and tries to revoke access. @requestor', async ({
    users, fence
}) => {
    
    // Check that the user has access to policy 'programs.jnkns-read-storage'.
    userInfo = await fence.do.getUserInfo(users.user0.accessToken);
    expect(userInfo.data.authz).to.have.property("/programs/jnkns");
    expect(userInfo.data.authz["/programs/jnkns"]).to.deep.to.include({ method: 'read-storage', service: '*' })

    // Create a request to 'revoke' a policy that is present in Arborist
    response = await requestorTasks.createRequestFromPolicyID(users.user0, 'programs.jnkns-read-storage', revoke=true);

    // Check if the access is revoked -- It shouldn't since it is not signed yet
    userInfo = await fence.do.getUserInfo(users.user0.accessToken);
    expect(userInfo.data.authz).to.have.property("/programs/jnkns");
    expect(userInfo.data.authz["/programs/jnkns"]).to.deep.to.include({ method: 'read-storage', service: '*' })

    // Create a PUT request to sign the previous request using an authenticated user
    await requestorTasks.signedRequest(response.request_id);

    // Verify if access is given to the user -- There should be
    userInfo = await fence.do.getUserInfo(users.user0.accessToken);
    expect(userInfo.data.authz).to.have.property("/programs/jnkns");
    expect(userInfo.data.authz["/programs/jnkns"]).to.deep.to.not.include({ method: 'read-storage', service: '*' })

});



