/*eslint-disable */
/**
 * Pre-test script for setup. Does the following:
 * 1. Fetch variables from commons required for testing
 * 2. Ensure a program and project exist
 */

const nconf = require('nconf');
const homedir = require('os').homedir();

const { Commons } = require('./utils/commons');
const { Bash } = require('./utils/bash');
const apiUtil = require('./utils/apiUtil.js');
const google = require('./utils/google.js');
const fenceProps = require('./services/apis/fence/fenceProps');

const inJenkins = (process.env.JENKINS_HOME !== '' && process.env.JENKINS_HOME !== undefined);
const bash = new Bash();

'use strict'; // eslint-disable-line chai-friendly/no-unused-expressions

/**
 * Returns the list of tags that were passed in as arguments, including
 * "--invert" if it was passed in
 * Note: this function does not handle complex grep/invert combinations
 */
function parseTestTags() {
  let tags = [];
  let args = process.argv; // process.env.npm_package_scripts_test.split(' '); // all args
  args = args.map((item) => item.replace(/(^"|"$)/g, '')); // remove quotes
  if (args.includes('--grep')) {
    // get tags and whether the grep is inverted
    args.forEach((item) => {
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

// get the tags passed in as arguments
const testTags = parseTestTags();
console.log('Tags:');
console.log(testTags);

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
 * @param {int} nAttempts - number of times to try creating the program/project
 * @returns {Promise<void>}
 */
async function tryCreateProgramProject(nAttempts) {
  console.log(`GEN3_SKIP_PROJ_SETUP: ${process.env.GEN3_SKIP_PROJ_SETUP}`);
  if (process.env.GEN3_SKIP_PROJ_SETUP !== 'true') {
    let success = false;
    for (let i = 0; i < nAttempts; i += 1) {
      if (success === true) {
        break;
      }
      await Commons.createProgramProject()
        .then(() => {         // eslint-disable-line
          console.log(`Successfully created program/project on attempt ${i}`);
          success = true;
        })
        .catch((err) => {
          console.log(
            `Failed to create program/project on attempt ${i}:\n`,
            JSON.stringify(err),
          );
          if (i === nAttempts - 1) {
            throw err;
          }
        });
    }
  }
}

/**
 * Create the "test" and "QA" projects in the fence DB if they do not already
 * exist, and link them to the Google buckets used in the tests
 */
function createGoogleTestBuckets() {
  const nAttempts = 3;
  for (let i = 0; i < nAttempts; i += 1) {
    try {
      console.log(`Attempt #${i}: Ensure test buckets are linked to projects in this commons...`);

      let { bucketId } = fenceProps.googleBucketInfo.QA;
      let { googleProjectId } = fenceProps.googleBucketInfo.QA;
      let projectAuthId = 'QA';
      let fenceCmd = `fence-create google-bucket-create --unique-name ${bucketId} --google-project-id ${googleProjectId} --project-auth-id ${projectAuthId} --public False`;
      console.log(`Running: ${fenceCmd}`);
      const responseQABucket = bash.runCommand(fenceCmd, 'fence');
      if (process.env.DEBUG === 'true') {
        console.log(`response fence-create google-bucket-create for QA Bucket: ${responseQABucket}`);
      }
      bucketId = fenceProps.googleBucketInfo.test.bucketId;
      googleProjectId = fenceProps.googleBucketInfo.test.googleProjectId;
      projectAuthId = 'test';
      fenceCmd = `fence-create google-bucket-create --unique-name ${bucketId} --google-project-id ${googleProjectId} --project-auth-id ${projectAuthId} --public False`;
      console.log(`Running: ${fenceCmd}`);
      const responseTestBucket = bash.runCommand(fenceCmd, 'fence');
      if (process.env.DEBUG === 'true') {
        console.log(`response fence-create google-bucket-create for Test Bucket: ${responseTestBucket}`);
      }
      bash.runJob('google-verify-bucket-access-group');

      // Wait to check google-manage-keys-job pod logs
      //console.log('waiting a few seconds before checking the results of the google-verify-bucket-access-group job');
      //apiUtil.sleepMS(5 * 1000).then(() => {
      //  console.log('Running gen3 job logs google-verify-bucket-access-group... ');
      //  bash.runCommand('set -i; source ~/.bashrc; gen3 job logs google-verify-bucket-access-group');
      //});

      console.log('Proceeding with the tests.');
      break;
    } catch (e) {
      console.log(`WARNING: unable to create Google test buckets in attempt #${i}. You can ignore this message if you do not want to run Google data access tests.`);
      console.log(e);
      if ((i === nAttempts - 1) && inJenkins) {
        throw e;
      }
    }
  }
}

async function setupGoogleProjectDynamic() {
  console.log('Creating program/project\n');
  // Update the id and SA email depending on the current namespace
  let namespace = process.env.NAMESPACE; // jenkins run
  if (process.env.RUNNING_LOCAL) {
    namespace = 'validationjobtest'; // local run
  }
  // a google project exists for each jenkins env
  const gProjectId = fenceProps.googleProjectDynamic.id;
  fenceProps.googleProjectDynamic.id = gProjectId.replace(
    'NAMESPACE',
    namespace,
  );
  const gProjectSvcAccountEmail = fenceProps.googleProjectDynamic.serviceAccountEmail;
  fenceProps.googleProjectDynamic.serviceAccountEmail = gProjectSvcAccountEmail.replace(
    'NAMESPACE',
    namespace,
  );
  if (process.env.DEBUG === 'true') {
    console.log(`googleProjectDynamic: ${fenceProps.googleProjectDynamic.id}`);
  }
  // Add the IAM access needed by the monitor service account
  const monitorRoles = [
    'roles/resourcemanager.projectIamAdmin',
    'roles/editor',
  ];
  for (const role of monitorRoles) {
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
      console.log(`WARNING: ${msg}`);
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
      const res = await google.deleteServiceAccountKey(key.name);
      console.log(`result: ${res}`);
    });
  }
}

/**
 * Returns true if the tag is included in the tests, false otherwise.
 * Should really be named `isNotExcluded` - since it returns true
 * if the tag is not mentioned or if the tag is mentioned and invert is not passed.
 */
function isIncluded(tag) {
  return (!testTags.includes(tag) && testTags.includes('--invert')) || (testTags.includes(tag) && !testTags.includes('--invert'));
}

module.exports = async function () {
  try {
    // get some vars from the commons
    console.log('Setting environment variables...\n');
    // annoying flag used by fenceProps ...
    if (isIncluded('@centralizedAuth')) {
      process.env.ARBORIST_CLIENT_POLICIES = 'true';
    }

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
    const basicVars = ['HOSTNAME'];
    const googleVars = [
      'GOOGLE_APP_CREDS_JSON',
    ];
    const submitDataVars = [
      'TEST_DATA_PATH',
    ];

    assertEnvVars(basicVars.concat(googleVars, submitDataVars));
    console.log('TEST_DATA_PATH: ', process.env.TEST_DATA_PATH);

    // If testedEnv is not defined, infer FQDN based on the NAMESPACE
    if (process.env['testedEnv'] === '' || typeof process.env['testedEnv'] === 'undefined') {
      process.env.testedEnv = `${process.env.NAMESPACE}.planx-pla.net`;
      console.log(`INFO: Setting testedEnv var to ${process.env.testedEnv}`);
    }

    if (process.env.DEBUG === 'true') {
      console.log(`isIncluded('@reqGoogle'): ${await isIncluded('@reqGoogle')}`);
    }
    if (isIncluded('@reqGoogle')) {
      createGoogleTestBuckets();
      await setupGoogleProjectDynamic();
    }

    //
    // may want to skip this if only running
    // DCFS tests or interactive tests ...
    //
    // Create a program and project (does nothing if already exists)
    await tryCreateProgramProject(3);

  } catch (ex) {
    console.error('Failed initialization', ex);
    process.exit(1);
  }
};
