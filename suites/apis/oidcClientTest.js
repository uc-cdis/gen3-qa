Feature('OIDC Client tests @requires-fence');

const { expect } = require('chai');
const { Bash } = require('../../utils/bash.js');
const { checkPod } = require('../../utils/apiUtil.js');
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
