Feature('OIDC Client tests @requires-fence');

const { expect } = require('chai');
const { Bash } = require('../../utils/bash.js');
const { checkPod, runUserSync, getAccessTokenHeader } = require('../../utils/apiUtil.js');
const { Client } = require('../../services/apis/fence/fenceProps.js');

const bash = new Bash();

Scenario('OIDC Client Expiration @clientExpiration', async ({ I, fence }) => {
  // create clients with various expirations
  const clientSettings = [
    ['jenkinsClientNoExpiration', null],
    ['jenkinsClient0Expiration0', 0],
    ['jenkinsClientShortExpiration', '0.00000000001'],
    ['jenkinsClientMediumExpiration', 4],
    ['jenkinsClientLongExpiration', 30],
  ];
  for (const settings of clientSettings) {
    const [clientName, expiresIn] = settings;
    console.log(`  Creating client '${clientName}' expiring in ${expiresIn} days`);
    const client = new Client({
      clientName,
      userName: 'test-user',
      clientType: 'client_credentials',
      arboristPolicies: null,
      expires_in: expiresIn,
    });
    settings.push(client.id);
    settings.push(client.secret);
    if (process.env.DEBUG === 'true') {
      console.log('Client settings:', settings);
    }

    // check that the client works (we can get an access token using the creds)
    await fence.do.getAccessTokenWithClientCredentials(client.id, client.secret);
  }

  // run the job that removes expired clients
  bash.runJob('fence-delete-expired-clients');
  await checkPod(I, 'fence-delete-expired-clients', 'gen3job,job-name=fence-delete-expired-clients');
  const jobLogs = bash.runCommand('g3kubectl logs -l app=gen3job,job-name=fence-delete-expired-clients');

  // the job should log that the 'jenkinsClientShortExpiration' client was removed
  expect(jobLogs).to.contain('Some expired OIDC clients have been deleted');
  expect(jobLogs).to.contain('jenkinsClientShortExpiration');
  // the job should log that the 'jenkinsClientMediumExpiration' client is expiring in <7 days
  expect(jobLogs).to.contain('Some OIDC clients are expiring soon');
  expect(jobLogs).to.contain('jenkinsClientMediumExpiration');
  // the job should not log anything about the other clients
  expect(jobLogs).not.to.contain('jenkinsClientNoExpiration');
  expect(jobLogs).not.to.contain('jenkinsClient0Expiration0');
  expect(jobLogs).not.to.contain('jenkinsClientLongExpiration');

  // check that the non-expired clients still work and that the expired one doesn't
  for (const settings of clientSettings) {
    const [clientName, _, clientId, clientSecret] = settings;
    const expectSuccess = clientName !== 'jenkinsClientShortExpiration';
    await fence.do.getAccessTokenWithClientCredentials(clientId, clientSecret, expectSuccess);
  }
});


Scenario('OIDC Client Rotation @clientRotation @requires-indexd', async ({ I, fence, indexd }) => {
  const clientName = 'jenkinsClientTester';
  console.log(`  Creating client '${clientName}'`);
  const creds1 = new Client({
    clientName,
    userName: 'test-user',
    clientType: 'client_credentials',
  });
  expect(creds1.id, 'No client ID').not.to.be.empty;
  expect(creds1.secret, 'No client secret').not.to.be.empty;
  if (process.env.DEBUG === 'true') {
    console.log(`Client credentials before rotating: (${creds1.id}, ${creds1.secret})`);
  }

  const creds2 = fence.do.rotateClientCredentials(clientName);
  expect(creds2.client_id, 'No client ID').not.to.be.empty;
  expect(creds2.client_secret, 'No client secret').not.to.be.empty;
  if (process.env.DEBUG === 'true') {
    console.log(`Client credentials after rotating: (${creds2.client_id}, ${creds2.client_secret})`);
  }

  // run usersync job - the client has some access in the user.yaml, but it didn't exist in the fence db
  // before this test. usersync does not grant access to clients that don't exist in fence db, so we need
  // to run usersync here now that the client has been created
  await runUserSync();
  await checkPod(I, 'usersync', 'gen3job,job-name=usersync');

  // check that both sets of credentials work:
  // - we can get an access token using the creds
  // - the token should have access to create a record in indexd, as stated in the user.yaml
  const indexdRecord = {
    filename: 'testfile',
    size: 9,
    md5: '73d643ec3f4beb9020eef0beed440ad0',
    urls: ['s3://mybucket/testfile'],
    authz: ['/programs/jnkns/projects/jenkins'],
  };
  console.log('Checking credentials obtained before rotating...');
  const client1AccessToken = await fence.do.getAccessTokenWithClientCredentials(creds1.id, creds1.secret);
  let ok = await indexd.do.addFileIndices([indexdRecord], getAccessTokenHeader(client1AccessToken), false);
  expect(ok, 'The token generated with the old creds should have access').to.be.true;

  console.log('Checking credentials obtained after rotating...');
  delete indexdRecord.did; // reset the GUID so a new record is created
  const client2AccessToken = await fence.do.getAccessTokenWithClientCredentials(creds2.client_id, creds2.client_secret);
  ok = await indexd.do.addFileIndices([indexdRecord], getAccessTokenHeader(client2AccessToken), false);
  expect(ok, 'The token generated with the new creds should have access').to.be.true;
});
