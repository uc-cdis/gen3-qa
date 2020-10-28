/* eslint-disable import/prefer-default-export */
const { Bash, takeLastLine } = require('./bash');

const bash = new Bash();

exports.registerRasClient = (username) => {
  const registerClientCmd = 'fence-create'
    + ' --arborist http://arborist-service/ client-create'
    + ' --client ras-user1-test-client'
    + ` --user ${username}`
    + ` --urls https://${process.env.HOSTNAME}/user`
    + ' --policies programs.QA-admin programs.test-admin programs.DEV-admin programs.jnkns-admin'
    + ' --allowed-scopes openid user data google_credentials ga4gh_passport_v1';

  const registerClientForRASUser1 = bash.runCommand(registerClientCmd, 'fence', takeLastLine);
  console.log(`registerClientForRASUser1: ${registerClientForRASUser1}`);

  const re = /\('(.*)',\s'(.*)'\)/;
  const clientID = registerClientForRASUser1.match(re)[1];
  const secretID = registerClientForRASUser1.match(re)[2];

  return {
    clientID,
    secretID,
  };
};
