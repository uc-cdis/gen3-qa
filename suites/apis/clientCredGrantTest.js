/* eslint-disable max-len */

/*

1. create an OIDC client with the client_credential grant
fence-create with --grant-types `client_credentials`
which return client_id and secret_id

2. run usersync (The client will have been previously added to the Jenkins user.yaml and granted access to
what it will need for the test, but i think usersync will not grant the access if the client does not
exist in the Fence DB. So you need to run usersync again during the test, after creating the client)

3. get a client access token using the client ID and secret.

4. hit Fence’s /user endpoint and check the access

5. create an access request in Requestor

6. list Requestor requests

7. update an access request in Requestor

8. AfterSuite - delete the create client in step 1 with `client-delete` command
also delete the requests created in requestor
*/

Feature('Client_Credentials Grant Type @requires-fence');

const { expect } = require('chai');
const { runUserSync, checkPod, getAccessTokenHeader } = require('../../utils/apiUtil.js');
const { Bash, takeLastLine } = require('../../utils/bash.js');
const requestorTasks = require('../../services/apis/requestor/requestorTasks.js');
const requestorProps = require('../../services/apis/requestor/requestorProps.js');

const bash = new Bash();

const clientName = 'jenkinsClientTester';

async function getAccessToken(clientID, secretID) {
  const tokenReq = bash.runCommand(`curl --user "${clientID}:${secretID}" --request POST "https://${process.env.HOSTNAME}/user/oauth2/token?grant_type=client_credentials" -d scope="openid user"`);
  if (process.env.DEBUG === 'true') {
    console.log(`data : ${tokenReq}`);
  }
  const tokens = JSON.parse(tokenReq);
  const accessToken = tokens.access_token;
  console.log(`###Access_token : ${accessToken}`);
  if (process.env.DEBUG === 'true') {
    console.log(`###Access_Token : ${accessToken}`);
  }
  return accessToken;
}

function deleteClient() {
  const deleteClientCmd = `fence-create client-delete --client ${clientName}`;
  const deleteClientReq = bash.runCommand(deleteClientCmd, 'fence', takeLastLine);
  console.log(`Client deleted : ${deleteClientReq}`);
}

function createClient() {
  const createClientOIDC = 'fence-create client-create'
        + ` --client ${clientName}`
        + ' --grant-types client_credentials';

  const createClientReq = bash.runCommand(createClientOIDC, 'fence', takeLastLine);
  if (process.env.DEBUG === 'true') {
    console.dir(`###Client created : ${createClient}`);
  }
  const regex = /\('(.*)',\s'(.*)'\)/;
  const credentials = createClientReq.match(regex);
  expect(credentials, `Unable to get client credentials "${credentials}"`).to.not.to.be.empty;
  const clientID = credentials[1];
  const secretID = credentials[2];
  expect(clientID).to.not.to.be.empty;
  expect(secretID).to.not.to.be.empty;

  return {
    clientID,
    secretID,
  };
}

BeforeSuite(async ({ I }) => {
  I.cache = {};
  deleteClient();
});

AfterSuite(async ({ I }) => {
  // deleting the request created
  console.log('Deleting the request from the requestor DB ... ');
  if (process.env.DEBUG === 'true') {
    console.log(I.cache.requestID);
  }
  const deleteRequest = await requestorTasks.deleteRequest(I.cache.requestID);
  if (deleteRequest.status === 200) {
    console.log(`Request ${I.cache.requestID} deleted successfully`);
  }
  // delete the client jenkinsClientTester
  console.log('Deleting client created for the test ...');
  deleteClient();
});

Scenario('Client Credentials Grant Type', async ({ I, users }) => {
  // creating OIDC client for the test
  const { clientID, secretID } = createClient();
  if (process.env.DEBUG === 'true') {
    console.log(`Client ID: ${clientID}`);
    console.log(`Client Secret: ${secretID}`);
  }
  // running usersync job
  await runUserSync();
  await checkPod(I, 'usersync', 'gen3job,job-name=usersync');
  // getting the access_token from clientID and clientSecret
  const clientAccessToken = await getAccessToken(clientID, secretID);

  // create a access request in requestor DB and store the requestID in I.cache
  // create data for request
  const { username } = users.user0;
  const data = {
    username,
    policy_id: 'requestor_integration_test',
  };

  //  create a access request in requestor DB with the clientAccessToken
  const createRequest = await I.sendPostRequest(
    `${requestorProps.endpoint.requestEndPoint}`,
    data,
    getAccessTokenHeader(clientAccessToken),
  );
  if (process.env.DEBUG === 'true') {
    console.log(createRequest.data);
    console.log(createRequest.data.request_id);
  }
  expect(createRequest).to.have.property('status', 201);
  expect(createRequest.data).to.have.property('request_id');

  // cache the requestID in I.cache
  I.cache.requestID = createRequest.data.request_id;

  // list the requests created by clientAccessToken by the request_id
  const requestStatus = await requestorTasks.getRequestStatus(I.cache.requestID);
  console.log(`Status of the request is:${requestStatus}`);

  // update the access request from DRAFT to SIGNED status
  console.log('### Updating the status of the request');
  await requestorTasks.signedRequest(I.cache.requestID);
  const requestStatusSigned = await requestorTasks.getRequestStatus(I.cache.requestID);
  console.log(`Status of the request is:${requestStatusSigned}`);
});
