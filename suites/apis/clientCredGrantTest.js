/* eslint-disable max-len */

/*

1. create an OIDC client with the client_credential grant
fence-create with --grant-types `client_credentials`
which return client_id and secret_id

2. run usersync (The client will have been previously added to the Jenkins user.yaml and granted access to
what it will need for the test, but i think usersync will not grant the access if the client does not
exist in the Fence DB. So you need to run usersync again during the test, after creating the client)

3. get a client access token using the client ID and secret.

4. create an access request in Requestor

5. list Requestor requests

6. update an access request in Requestor

7. AfterSuite - delete the create client in step 1 with `client-delete` command
also delete the requests created in requestor
*/

Feature('Client_Credentials Grant Type @requires-fence @requires-requestor');

const { expect } = require('chai');
const { runUserSync, checkPod, getAccessTokenHeader } = require('../../utils/apiUtil.js');
const { Bash } = require('../../utils/bash.js');
const { Client } = require('../../services/apis/fence/fenceProps.js');
const requestorTasks = require('../../services/apis/requestor/requestorTasks.js');
const requestorProps = require('../../services/apis/requestor/requestorProps.js');

const bash = new Bash();

BeforeSuite(async ({ I }) => {
  I.cache = {};
});

AfterSuite(async ({ I }) => {
  try {
    // deleting the request created
    console.log('Deleting the request from the requestor DB ... ');
    if (process.env.DEBUG === 'true') {
      console.log(I.cache.requestID);
    }
    const deleteRequest = await requestorTasks.deleteRequest(I.cache.requestID);
    if (deleteRequest.status === 200) {
      console.log(`Request ${I.cache.requestID} deleted successfully`);
    }

    // revoking the arborist policy for the user
    console.log('Revoking the arborist policy for the user0 ...');
    await bash.runCommand(`
        gen3 devterm curl -X DELETE arborist-service/user/dcf-integration-test-0@planx-pla.net/policy/requestor_client_credentials_test`);
  } catch (error) {
    console.log(error);
  }
});

Scenario('Client Credentials Grant Type interaction with Requestor @clientCreds', async ({ I, users, fence }) => {
  // creating OIDC client for the test
  // const { clientID, secretID } = fence.do.createClient(clientName, users.user0, 'client_credentials');
  const clientGrant = new Client({
    clientName: 'jenkinsClientTester',
    userName: 'users.user0',
    clientType: 'client_credentials',
    arboristPolicies: null,
  });
  const clientID = clientGrant.id;
  const secretID = clientGrant.secret;
  if (process.env.DEBUG === 'true') {
    console.log(`Client ID: ${clientID}`);
    console.log(`Client Secret: ${secretID}`);
  }
  // running usersync job
  // the client is added to useryaml and granted access
  // but if the client doesnt exist in fence db, usersync will not grant access to the client
  // so during the jenkins run, we need run usersync after the client is created
  await runUserSync();
  await checkPod(I, 'usersync', 'gen3job,job-name=usersync');
  // getting the access_token from clientID and clientSecret
  const clientAccessToken = await fence.do.getAccessTokenWithClientCredentials(clientID, secretID);

  // create data for request
  const { username } = users.user0;
  const data = {
    username,
    policy_id: 'requestor_client_credentials_test',
  };

  //  create a access request in requestor DB with the clientAccessToken
  const createRequest = await I.sendPostRequest(
    `${requestorProps.endpoint.requestEndPoint}`,
    data,
    getAccessTokenHeader(clientAccessToken),
  );
  // check if the request is successful
  expect(createRequest).to.have.property('status', 201);
  // check if the createRequest response contains data
  if (process.env.DEBUG === 'true') {
    console.log(createRequest.data);
  }
  // check if the response data consists of 'request_id'. If expect fails, show data
  expect(createRequest.data, createRequest.data).to.have.property('request_id');

  // cache the requestID in I.cache
  I.cache.requestID = createRequest.data.request_id;

  // get the request created by clientAccessToken by the request_id
  const requestStatus = await requestorTasks.getRequestStatus(I.cache.requestID);
  console.log(`Status of the request is:${requestStatus}`);

  // update the access request from DRAFT to SIGNED status
  console.log('### Updating the status of the request');
  await requestorTasks.signedRequest(I.cache.requestID);
  const requestStatusSigned = await requestorTasks.getRequestStatus(I.cache.requestID);
  console.log(`Status of the request is:${requestStatusSigned}`);

  // getting the list of users access request
  const list = await requestorTasks.getRequestList(clientAccessToken);
  if (process.env.DEBUG === 'true') {
    console.log(list.data);
  }
  if (list.data.length > 0) {
    list.data.forEach(async (obj) => {
      expect(obj).to.have.property('request_id');
    })}
});
