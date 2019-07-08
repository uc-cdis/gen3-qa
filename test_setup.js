/**
 * Pre-test script for setup. Does the following:
 * 1. Fetch variables from commons required for testing
 * 2. Ensure a program and project exist
 */

const nconf = require('nconf');
const homedir = require('os').homedir();
const fs = require('fs');

const { Commons } = require('./utils/commons');
const { Bash, takeLastLine } = require('./utils/bash');
const users = require('./utils/user');
const apiUtil = require('./utils/apiUtil');
const google = require('./utils/google.js');
const fenceProps = require('./services/apis/fence/fenceProps');

const DEFAULT_TOKEN_EXP = 3600;
const inJenkins = (process.env.JENKINS_HOME !== '' && process.env.JENKINS_HOME !== undefined);
const bash = new Bash();

'use strict';


// get the tags passed in as arguments
const testTags = parseTestTags();
console.log('Tags:');
console.log(testTags);


// let rootCas = require('ssl-root-cas/latest').create();
// rootCas
//   .addFile(__dirname + '/../compose-services/temp_creds/ca.pem')
// ;
//
// // will work with all https requests will all libraries (i.e. request.js)
// require('https').globalAgent.options.ca = rootCas;

/**
 * Runs a fence command for creating a client
 * @param {string} clientName - client name
 * @param {string} userName - user name
 * @param {string} clientType - client type (implicit or basic)
 * @param {string} arboristPolicies - space-delimited list of arborist policies to give to client
 * @returns {json}
 */
function createClient(clientName, userName, clientType, arboristPolicies = null) {
  let fenceCmd = 'fence-create';

  if (arboristPolicies) {
    fenceCmd = `${fenceCmd} --arborist http://arborist-service/`;
  }

  fenceCmd = `${fenceCmd} client-create --client ${clientName} --user ${userName} --urls https://${process.env.HOSTNAME}`;

  if (clientType === 'implicit') {
    fenceCmd = `${fenceCmd} --grant-types implicit --public`;
  }
  if (arboristPolicies) {
    fenceCmd = `${fenceCmd} --policies ${arboristPolicies}`;
  }
  console.log(`running: ${fenceCmd}`);
  const resCmd = bash.runCommand(fenceCmd, 'fence', takeLastLine);
  const arr = resCmd.replace(/[()']/g, '').split(',').map(val => val.trim());
  return { client_id: arr[0], client_secret: arr[1] };
}

/**
 * Runs a fence command for delete a client
 * @param {string} clientName - client name
 */
function deleteClient(clientName) {
  bash.runCommand(`fence-create client-delete --client ${clientName}`, 'fence', takeLastLine);
}

/**
 * Gets indexd password for a commons
 * @returns {string}
 */
function getIndexPassword() {
  const credsCmd = 'cat /var/www/sheepdog/creds.json';
  const secret = bash.runCommand(credsCmd, 'sheepdog');
  console.error(secret);
  return {
    client: JSON.parse(secret).indexd_client != undefined ? JSON.parse(secret).indexd_client : 'gdcapi',
    password: JSON.parse(secret).indexd_password,
  };
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
    await Commons.createProgramProject()
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

/**
 * Checks if the gen3-client executable is present in the workspace.
 * During a local run, checks in the homedir instead.
 * It is needed for the data upload test suite
 */
function assertGen3Client() {
  // check if the client is set up in the workspace
  console.log('Looking for data client executable...');
  const client_dir = process.env.DATA_CLIENT_PATH || homedir;
  if (!fs.existsSync(`${client_dir}/gen3-client`)) {
    const msg = `Did not find a gen3-client executable in ${client_dir}`;
    if (inJenkins) {
      throw Error(msg);
    }
    console.log(`WARNING: ${  msg}`);
  }
}

/**
 * Create the "test" and "QA" projects in the fence DB if they do not already
 * exist, and link them to the Google buckets used in the tests
 */
function createGoogleTestBuckets() {
  try {
    console.log('Ensure test buckets are linked to projects in this commons...');

    let bucketId = fenceProps.googleBucketInfo.QA.bucketId;
    let googleProjectId = fenceProps.googleBucketInfo.QA.googleProjectId;
    let projectAuthId = 'QA';
    let fenceCmd = `fence-create google-bucket-create --unique-name ${bucketId} --google-project-id ${googleProjectId} --project-auth-id ${projectAuthId} --public False`;
    console.log(`Running: ${fenceCmd}`);
    bash.runCommand(fenceCmd, 'fence');

    bucketId = fenceProps.googleBucketInfo.test.bucketId;
    googleProjectId = fenceProps.googleBucketInfo.test.googleProjectId;
    projectAuthId = 'test';
    fenceCmd = `fence-create google-bucket-create --unique-name ${bucketId} --google-project-id ${googleProjectId} --project-auth-id ${projectAuthId} --public False`;
    console.log(`Running: ${fenceCmd}`);
    response = bash.runCommand(fenceCmd, 'fence');

    console.log('Clean up Google Bucket Access Groups from previous runs...');
    bash.runJob('google-verify-bucket-access-group');
  } catch (e) {
    if (inJenkins) {
      throw e;
    }
    console.log('WARNING: unable to create Google test buckets. You can ignore this message if you do not want to run Google data access tests.');
  }
}

async function setupGoogleProjectDynamic() {
  // Update the id and SA email depending on the current namespace
  if (process.env.RUNNING_LOCAL) { // local run
    namespace = 'validationjobtest';
  } else { // jenkins run. a google project exists for each jenkins env
    namespace = process.env.NAMESPACE;
  }
  fenceProps.googleProjectDynamic.id = fenceProps.googleProjectDynamic.id.replace(
    'NAMESPACE',
    namespace,
  );
  fenceProps.googleProjectDynamic.serviceAccountEmail = fenceProps.googleProjectDynamic.serviceAccountEmail.replace(
    'NAMESPACE',
    namespace,
  );
  console.log(`googleProjectDynamic: ${fenceProps.googleProjectDynamic.id}`);

  // Add the IAM access needed by the monitor service account
  const monitorRoles = [
    'roles/resourcemanager.projectIamAdmin',
    'roles/editor',
  ];
  for (let role of monitorRoles) {
    const res = await google.updateUserRole(
      fenceProps.googleProjectDynamic.id,
      {
        role,
        members: [`serviceAccount:${fenceProps.monitorServiceAccount}`],
      },
    );
    if (res.code) {
      console.error(res);
      const msg = `Failed to update monitor SA roles in Google project ${fenceProps.googleProjectDynamic.id} (owner ${fenceProps.googleProjectDynamic.owner}).`;
      if (inJenkins) {
        throw Error(msg);
      }
      console.log(`WARNING: ${  msg}`);
    }
  }

  // If there are existing keys on the "user service account", delete them
  const saName = `service-account@gen3qa-${namespace}.iam.gserviceaccount.com`;
  const saKeys = await google.listServiceAccountKeys(fenceProps.googleProjectDynamic.id, saName);
  if (!saKeys.keys) {
    console.error(saKeys);
    console.log(`WARNING: cannot get list of keys on service account ${saName}.`);
  } else {
    saKeys.keys.map(async (key) => {
      res = await google.deleteServiceAccountKey(key.name);
    });
  }
}

/**
 * Returns the list of tags that were passed in as arguments, including
 * "--invert" if it was passed in
 * Note: this function does not handle complex grep/invert combinations
 */
function parseTestTags() {
  let tags = [];
  let args = process.env.npm_package_scripts_test.split(' '); // all args
  args = args.map(item => item.replace(/(^"|"$)/g, '')); // remove quotes
  if (args.includes('--grep')) {
    // get tags and whether the grep is inverted
    args.map((item) => {
      if (item.startsWith('@')) {
        // e.g. "@reqGoogle|@Performance"
        tags = tags.concat(item.split('|'));
      } else if (item === '--invert') {
        tags.push(item);
      }
    });
  }
  return tags;
}

/**
 * Returns true if the tag is included in the tests, false otherwise
 */
function isIncluded(tag) {
  console.log(testTags);
  console.log(tag);
  console.log(testTags.includes(tag));
  console.log(testTags.includes('--invert'));
  console.log((!testTags.includes(tag) && testTags.includes('--invert')) || (testTags.includes(tag) && !testTags.includes('--invert')));
  return (!testTags.includes(tag) && testTags.includes('--invert')) || (testTags.includes(tag) && !testTags.includes('--invert'));
}

module.exports = async function (done) {
  try {
    // get some vars from the commons
    console.log('Setting environment variables...\n');

    // Export access tokens
    for (const user of Object.values(users)) {
      const at = apiUtil.getAccessToken(user.username, DEFAULT_TOKEN_EXP);
      // make sure the access token looks valid - base64 encoded JSON :-p
      const token = apiUtil.parseJwt(at);
      process.env[user.envTokenName] = at;
    }

    console.log('Delete then create basic client...\n');
    deleteClient('basic-test-client');
    let basicClient;
    if (isIncluded('@centralizedAuth')) {
      basicClient = createClient(
        'basic-test-client', 'test-client@example.com', 'basic',
        arboristPolicies = 'abc-admin gen3-admin',
      );
    } else {
      basicClient = createClient(
        'basic-test-client', 'test-client@example.com', 'basic',
      );
    }

    console.log('Delete then create another basic client...\n');
    deleteClient('basic-test-abc-client');
    let basicAbcClient;
    if (isIncluded('@centralizedAuth')) {
      basicAbcClient = createClient(
        'basic-test-abc-client', 'test-abc-client@example.com', 'basic',
        arboristPolicies = 'abc-admin',
      );
    } else {
      basicAbcClient = createClient(
        'basic-test-abc-client', 'test-abc-client@example.com', 'basic',
      );
    }

    console.log('Delete then create implicit client...\n');
    deleteClient('implicit-test-client');
    const implicitClient = createClient(
      'implicit-test-client', 'test@example.com', 'implicit',
    );

    // Setup environment variables
    process.env[`${fenceProps.clients.client.envVarsName}_ID`] = basicClient.client_id;
    process.env[`${fenceProps.clients.client.envVarsName}_SECRET`] = basicClient.client_secret;
    process.env[`${fenceProps.clients.abcClient.envVarsName}_ID`] = basicAbcClient.client_id;
    process.env[`${fenceProps.clients.abcClient.envVarsName}_SECRET`] = basicAbcClient.client_secret;
    process.env[`${fenceProps.clients.clientImplicit.envVarsName}_ID`] = implicitClient.client_id;

    // Export expired access token for main acct
    const mainAcct = users.mainAcct;
    const expAccessToken = apiUtil.getAccessToken(mainAcct.username, 1);
    process.env[mainAcct.envExpTokenName] = expAccessToken;

    // Export indexd credentials
    const indexd_cred = getIndexPassword();
    process.env.INDEX_USERNAME = indexd_cred.client;
    process.env.INDEX_PASSWORD = indexd_cred.password;

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
      'GOOGLE_APP_CREDS_JSON',
    ];
    const submitDataVars = [
      'TEST_DATA_PATH',
    ];

    assertEnvVars(basicVars.concat(googleVars, submitDataVars));
    console.log('TEST_DATA_PATH: ', process.env.TEST_DATA_PATH);

    if (isIncluded('@dataClientCLI')) {
      assertGen3Client();
    }

    if (isIncluded('@reqGoogle')) {
      createGoogleTestBuckets();
      await setupGoogleProjectDynamic();
    }

    // Create a program and project (does nothing if already exists)
    console.log('Creating program/project\n');
    await tryCreateProgramProject(3);

    done();
  } catch (ex) {
    console.error('Failed initialization', ex);
    process.exit(1);
  }
};