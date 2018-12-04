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
const atob = require('atob');
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

/**
 * Runs a fence command for creating a client
 * @param {string} namespace - namespace to get token from
 * @param {string} clientName - client name
 * @param {string} userName - user name
 * @param {string} clientType - client type (implicit or basic)
 * @returns {json}
 */
function createClient(namespace, clientName, userName, clientType) {
  let fenceCmd = `g3kubectl exec $(gen3 pod fence ${namespace}) -- fence-create client-create --client ${clientName} --user ${userName} --urls https://${process.env.HOSTNAME}`;
  if (clientType === 'implicit') {
    fenceCmd = `${fenceCmd} --grant-types implicit --public`;
  }
  const resCmd = commonsUtil.runCommand(fenceCmd, namespace);
  const arr = resCmd.replace(/[()']/g, '').split(',').map(val => val.trim());
  return { client_id: arr[0], client_secret: arr[1] };
}

/**
 * Runs a fence command for delete a client
 * @param {string} namespace - namespace to get token from
 * @param {string} clientName - client name
 */
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

/**
 * Attempts to create a program and project
 * Throws an error if unable to do so
 * @param {string} nAttempts - number of times to try creating the program/project
 * @returns {Promise<void>}
 */
async function tryCreateProgramProject(nAttempts) {
  let success = false;
  for (const i of [...Array(nAttempts).keys()]) {
    if (success === true) {
      break;
    }
    await commonsUtil.createProgramProject()
      .then(() => {         // eslint-disable-line
        console.log(`Successfully created program/project on attempt ${i}`);
        success = true;
      })
      .catch((err) => {
        console.log(`Failed to create program/project on attempt ${i}:\n`, JSON.stringify(err));
        if (i === nAttempts - 1) {
          throw err;
        }
      });
  }
}

function parseJwt (token) {
  var base64Url = token.split('.')[1];
  var base64 = base64Url.replace('-', '+').replace('_', '/');
  return JSON.parse(atob(base64));
}

module.exports = async function (done) {
  console.log('Backing up current user.yaml...\n');
  // transfer user.yaml's and run sync on first one
  const backupUsersFileName = 'user.yaml.bak';
  const newUsersFile1 = 'test1_user.yaml';
  const newUsersFile2 = 'test2_user.yaml';
  commonsUtil.backupUserYaml(backupUsersFileName);

  console.log('Transferring new user.yaml files...\n');
  commonsUtil.scpFile(newUsersFile1);
  commonsUtil.scpFile(newUsersFile2);

  console.log('Running useryaml job to create users for integration tests...\n');
  // bootstrap: make sure users in this file exist in fence db before tests
  commonsUtil.setUserYaml(newUsersFile1);
  commonsUtil.runUseryamlJob();

  console.log('Running usersync job...\n');
  // return back to original user.yaml
  commonsUtil.runUsersyncJob();

  // get some vars from the commons
  console.log('Setting environment variables...\n');
  // Export access tokens
  for (const user of Object.values(usersUtil)) {
    if (!user.jenkinsOnly || inJenkins || process.env.NAMESPACE === 'default') {
      const at = getAccessToken(process.env.NAMESPACE, user.username, DEFAULT_TOKEN_EXP);
      // make sure the access token looks valid - base64 encoded JSON :-p
      const token = parseJwt(at);
      process.env[user.envTokenName] = at;
    }
  }

  console.log('Delete then create basic client...\n');
  deleteClient(process.env.NAMESPACE, 'basic-test-client');
  const basicClient = createClient(process.env.NAMESPACE, 'basic-test-client', 'test-client@example.com');

  console.log('Delete then create implicit client...\n');
  deleteClient(process.env.NAMESPACE, 'implicit-test-client');
  const implicitClient = createClient(process.env.NAMESPACE, 'implicit-test-client', 'test@example.com', 'implicit');

  // Setup enviroiment variables
  process.env[`${fenceProps.clients.client.envVarsName}_ID`] = basicClient.client_id;
  process.env[`${fenceProps.clients.client.envVarsName}_SECRET`] = basicClient.client_secret;
  process.env[`${fenceProps.clients.clientImplicit.envVarsName}_ID`] = implicitClient.client_id;

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
    usersUtil.user0.envGoogleEmail,
    usersUtil.user1.envGoogleEmail,
    usersUtil.user2.envGoogleEmail,
    usersUtil.auxAcct1.envGoogleEmail,
    usersUtil.auxAcct2.envGoogleEmail,
    usersUtil.user0.envGooglePassword,
    usersUtil.user1.envGooglePassword,
    usersUtil.user2.envGooglePassword,
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
  await tryCreateProgramProject(3);
  done();
};
