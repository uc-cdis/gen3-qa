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
const fenceProps = require('./services/apis/fence/fenceProps');
const DEFAULT_TOKEN_EXP = 3600;
const inJenkins = (process.env.JENKINS_HOME !== '' && process.env.JENKINS_HOME !== undefined);
const bash = new Bash();

'use strict';


// get the tags passed in as arguments
let testTags = parseTestTags();
console.log('Tags:')
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
 * @returns {json}
 */
function createClient(clientName, userName, clientType) {
  let fenceCmd = `fence-create client-create --client ${clientName} --user ${userName} --urls https://${process.env.HOSTNAME}`;
  if (clientType === 'implicit') {
    fenceCmd = `${fenceCmd} --grant-types implicit --public`;
  }
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
  const secret = bash.runCommand(credsCmd,'sheepdog');
  console.error(secret);
  return {
    client: JSON.parse(secret).indexd_client != undefined ? JSON.parse(secret).indexd_client : 'gdcapi',
    password: JSON.parse(secret).indexd_password
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
  let client_dir = process.env.DATA_CLIENT_PATH || homedir;
  if (!fs.existsSync(`${client_dir}/gen3-client`)) {
    let msg = `Did not find a gen3-client executable in ${client_dir}`;
    if (inJenkins) {
      throw Error(msg);
    }
    console.log('WARNING: ' + msg);
  }
}

/**
 * Create the "test" and "QA" projects in the fence DB if they do not already
 * exist, and link them to the Google buckets used in the tests
 */
function createGoogleTestBuckets() {
  console.log('Ensure test buckets are linked to projects in this commons...');

  var bucketId = fenceProps.googleBucketInfo.QA.bucketId;
  var googleProjectId = fenceProps.googleBucketInfo.QA.googleProjectId;
  var projectAuthId = 'QA';
  var fenceCmd = `fence-create google-bucket-create --unique-name ${bucketId} --google-project-id ${googleProjectId} --project-auth-id ${projectAuthId} --public False`;
  console.log(`Running: ${fenceCmd}`);
  bash.runCommand(fenceCmd, 'fence');

  bucketId = fenceProps.googleBucketInfo.test.bucketId
  googleProjectId = fenceProps.googleBucketInfo.test.googleProjectId
  projectAuthId = 'test';
  fenceCmd = `fence-create google-bucket-create --unique-name ${bucketId} --google-project-id ${googleProjectId} --project-auth-id ${projectAuthId} --public False`;
  console.log(`Running: ${fenceCmd}`);
  response = bash.runCommand(fenceCmd, 'fence');

  console.log('Clean up Google Bucket Access Groups from previous runs...');
  bash.runJob('google-verify-bucket-access-group');
}

/**
 * Returns the list of tags that were passed in as arguments, including
 * "--invert" if it was passed in
 * Note: this function does not handle complex grep/invert combinations
 */
function parseTestTags() {
  tags = [];
  args = process.env.npm_package_scripts_test.split(' '); // all args
  args = args.map(item => item.replace(/(^"|"$)/g, '')); // remove quotes
  if (args.includes('--grep')) {
    // get tags and whether the grep is inverted
    args.map(item => {
      if (item.startsWith('@')) {
        // e.g. "@reqGoogle|@Performance"
        tags = tags.concat(item.split('|'));
      }
      else if (item == '--invert') {
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
  return !testTags.includes(tag) || (testTags.includes(tag) && !testTags.includes('--invert'));
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
    const basicClient = createClient('basic-test-client', 'test-client@example.com', 'basic');

    console.log('Delete then create another basic client...\n');
    deleteClient('basic-test-clientb');
    const basicClientb = createClient('basic-test-clientb', 'test-clientb@example.com', 'basic');

    console.log('Delete then create implicit client...\n');
    deleteClient('implicit-test-client');
    const implicitClient = createClient('implicit-test-client', 'test@example.com', 'implicit');

    //Setup environment variables
    process.env[`${fenceProps.clients.client.envVarsName}_ID`] = basicClient.client_id;
    process.env[`${fenceProps.clients.client.envVarsName}_SECRET`] = basicClient.client_secret;
    process.env[`${fenceProps.clients.clientb.envVarsName}_ID`] = basicClientb.client_id;
    process.env[`${fenceProps.clients.clientb.envVarsName}_SECRET`] = basicClientb.client_secret;
    process.env[`${fenceProps.clients.clientImplicit.envVarsName}_ID`] = implicitClient.client_id;

    // Export expired access token for main acct
    const mainAcct = users.mainAcct;
    const expAccessToken = apiUtil.getAccessToken(mainAcct.username, 1);
    process.env[mainAcct.envExpTokenName] = expAccessToken;

    // Export indexd credentials
    let indexd_cred = getIndexPassword();
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
    }

    // Create a program and project (does nothing if already exists)
    console.log('Creating program/project\n');
    await tryCreateProgramProject(3);

    done();
  }
  catch (ex) {
    console.error('Failed initialization', ex);
    process.exit(1);
  }
};
