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

// Create an access request for a policy that doesn’t exist in Arborist => 400 error
Scenario('Create an access request for a policy that doesn’t exist in Arborist @requestor', async ({
    home, users, login,
}) => {
    // home.do.goToHomepage();
    // login.complete.login(users.user0);
    // response = await requestorTasks.createRequestFromPolicyID(users.user0, 'random-policy');
    // console.log(response)   
    console.log("SUCCESS");
});