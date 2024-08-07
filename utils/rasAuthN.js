const chai = require('chai');

/* eslint-disable import/prefer-default-export */
const { Bash, takeLastLine } = require('./bash');

const { expect } = chai;
const bash = new Bash();

exports.registerRasClient = (
  username,
  scopes = 'openid user data google_credentials ga4gh_passport_v1',
) => {
  // 5 random chars to use in the client name so we don't run into
  // "client already exists" issues
  const rand = (Math.random() + 1).toString(36).substring(2, 7);

  const registerClientCmd = 'fence-create'
    + ' --arborist http://arborist-service/ client-create'
    + ` --client ras-test-client-${rand}`
    + ` --user ${username}`
    + ` --urls https://${process.env.HOSTNAME}/user`
    + ' --policies programs.QA-admin programs.test-admin programs.DEV-admin programs.jnkns-admin'
    + ` --allowed-scopes ${scopes}`;

  const registerClientForRASUser1 = bash.runCommand(registerClientCmd, 'fence', takeLastLine);
  if (process.env.DEBUG === 'true') {
    console.log(`registerClientForRASUser1: ${registerClientForRASUser1}`);
  }
  const re = /\('(.*)',\s'(.*)'\)/;
  const groups = registerClientForRASUser1.match(re);
  expect(groups, `Unable to get client ID and secret from "${registerClientForRASUser1}"`).to.not.to.be.empty;
  const clientID = groups[1];
  const secretID = groups[2];
  expect(clientID).to.not.to.be.empty;
  expect(secretID).to.not.to.be.empty;

  return {
    clientID,
    secretID,
  };
};
