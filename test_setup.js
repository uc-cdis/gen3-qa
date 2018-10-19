/**
 * Pre-test script for setup. Does the following:
 * 1. Fetch variables from commons required for testing
 * 2. Ensure a program and project exist
 */

const nconf = require('nconf');
const homedir = require('os').homedir();

const commonsUtil = require('./utils/commonsUtil');
const usersUtil = require('./utils/usersUtil');
const fenceProps = require('./services/apis/fence/fenceProps');

const DEFAULT_TOKEN_EXP = 1800;
const inJenkins = (process.env.JENKINS_HOME !== '' && process.env.JENKINS_HOME !== undefined);

/**
 * Runs a fence command for fetching access token for a user
 * @param {string} namespace - namespace to get token from
 * @param {string} username - username to fetch token for
 * @param {number} expiration - life duration for token
 * @returns {string}
 */
function getAccessToken(namespace, username, expiration) {
  const fenceCmd = `g3kubectl exec $(gen3 pod fence ${namespace}) -- fence-create token-create --scopes openid,user,fence,data,credentials,google_service_account --type access_token --exp ${expiration} --username ${username}`;
  const accessToken = commonsUtil.runCommand(fenceCmd, namespace);
  return accessToken.trim();
}

function createClient(namespace, clientName, userName) {
  const fenceCmd = `g3kubectl exec $(gen3 pod fence ${namespace}) -- fence-create client-create --client ${clientName} --user ${userName} --urls https://${process.env.HOSTNAME} --auto-approve`;
  const resCmd = commonsUtil.runCommand(fenceCmd, namespace);
  const arr = resCmd.replace(/[()']/g, '').split(',').map(val => val.trim());
  return { client_id: arr[0], client_secret: arr[1] };
}

function deleteClient(namespace, clientName) {
  const cmdDelete = `g3kubectl exec $(gen3 pod fence ${namespace}) -- fence-create client-delete --client ${clientName}`;
  commonsUtil.runCommand(cmdDelete, namespace);
}

/**
 * Gets indexd password for a commons
 * @param {string} namespace
 * @returns {string}
 */
function getIndexPassword(namespace) {
  const credsCmd = 'g3kubectl get secret sheepdog-creds -o json';
  const secret = commonsUtil.runCommand(credsCmd, namespace);
  let credsString = JSON.parse(secret).data['creds.json'];
  credsString = Buffer.from(credsString, 'base64').toString('utf8');
  return JSON.parse(credsString).indexd_password;
}

/**
 * Export to environment all variables configured in nconf
 */
function exportNconfVars() {
  const nconfVars = nconf.get();
  for (const key of Object.keys(nconfVars)) {
    if (typeof nconfVars[key] !== 'string') {
      process.env[key] = JSON.stringify(nconfVars[key]);
    } else {
      process.env[key] = nconfVars[key];
    }
  }
}

/**
 * Assert that given environment variables are defined
 * @param {string[]} varNames
 */
function assertEnvVars(varNames) {
  varNames.forEach((name) => {
    if (process.env[name] === '' || process.env[name] === undefined) {
      if (inJenkins) {
        throw Error(`Missing required environment variable '${name}'`);
      }
      console.log(`WARNING: Env var '${name}' not defined!`);
    }
  });
}

module.exports = async function (done) {
  // get some vars from the commons
  console.log('Setting environment variables...\n');

  // Export access tokens
  for (const user of Object.values(usersUtil)) {
    if (!user.jenkinsOnly || inJenkins || process.env.NAMESPACE === 'default') {
      const at = getAccessToken(process.env.NAMESPACE, user.username, DEFAULT_TOKEN_EXP);
      process.env[user.envTokenName] = at;
    }
  }

  // delete client
  deleteClient(process.env.NAMESPACE, 'basic-test-client');
  // create client
  const client = createClient(process.env.NAMESPACE, 'basic-test-client', 'test-client@example.com');
  //console.log(`'${client.client_id}'`);
  //console.log(`'${client.client_secret}'`);

  process.env[`${fenceProps.clients.client.envVarsName}_ID`] = client.client_id;
  process.env[`${fenceProps.clients.client.envVarsName}_SECRET`] = client.client_secret;
  process.env[`${fenceProps.clients.clientImplicit.envVarsName}_ID`] = '6lBQA5HvMTVqNhKfEwaV5DEw1VEkPitri9kwj34X';
  process.env[`${fenceProps.clients.clientImplicit.envVarsName}_SECRET`] = 'CByukkaXyviVGpnVRHaI41F1jdhl2WlwuIi78afD4hon7F236YMpBr8';

  // Export expired access token for main acct
  const mainAcct = usersUtil.mainAcct;
  const expAccessToken = getAccessToken(process.env.NAMESPACE, mainAcct.username, 1);
  process.env[mainAcct.envExpTokenName] = expAccessToken;

  // Export indexd credentials
  process.env.INDEX_USERNAME = 'gdcapi';
  process.env.INDEX_PASSWORD = getIndexPassword(process.env.NAMESPACE);

  // Create configuration values based on hierarchy then export them to the process
  nconf.argv()
    .env()
    .file({
      file: 'auto-qa-config.json',
      dir: `${homedir}/.gen3`,
      search: true,
    });

  exportNconfVars();

  // Assert required env vars are defined
  const basicVars = [mainAcct.envTokenName, mainAcct.envExpTokenName, 'INDEX_USERNAME', 'INDEX_PASSWORD', 'HOSTNAME'];
  const googleVars = [
    usersUtil.auxAcct1.envGoogleEmail,
    usersUtil.auxAcct2.envGoogleEmail,
    usersUtil.auxAcct1.envGooglePassword,
    usersUtil.auxAcct2.envGooglePassword,
    'GOOGLE_APP_CREDS_JSON',
  ];
  const submitDataVars = [
    'TEST_DATA_PATH',
  ];

  assertEnvVars(basicVars.concat(googleVars, submitDataVars));
  console.log('TEST_DATA_PATH: ', process.env.TEST_DATA_PATH);

  // Create a program and project (does nothing if already exists)
  console.log('Creating program/project\n');
  await commonsUtil.createProgramProject();
  done();
};
