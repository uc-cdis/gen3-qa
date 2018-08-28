const nconf = require('nconf');
const { execSync } = require('child_process');
const homedir = require('os').homedir();

const commonsHelper = require('./actors/commons_helper');
const usersHelper = require('./actors/users_helper');

const DEFAULT_TOKEN_EXP = 1800;
const inJenkins = (process.env.JENKINS_HOME !== '');

function userFromNamespace(namespace) {
  return namespace === 'default' ? 'qaplanetv1' : namespace;
}

function runCommand(cmd, namespace) {
  if (inJenkins) {
    if (process.env.GEN3_HOME) {
      const sourceCmd = `source "${process.env.GEN3_HOME}/gen3/lib/utils.sh"`; // eslint-disable-line no-template-curly-in-string
      const gen3LoadCmd = 'gen3_load "gen3/gen3setup"';
      console.log(sourceCmd);
      return execSync(`${sourceCmd}; ${gen3LoadCmd}; ${cmd}`, { shell: '/bin/bash' });
    }
  }
  const commonsUser = userFromNamespace(namespace);
  return execSync(`ssh ${commonsUser}@cdistest.csoc 'set -i; source ~/.bashrc; ${cmd}'`, { shell: '/bin/sh' });
}

function getAccessToken(namespace, username, expiration) {
  const fenceCmd = `g3kubectl exec $(gen3 pod fence ${namespace}) -- fence-create token-create --scopes openid,user,fence,data,credentials --type access_token --exp ${expiration} --username ${username}`;
  const accessToken = runCommand(fenceCmd, namespace);
  // const commonsUser = userFromNamespace(namespace);
  // const at = execSync(`ssh ${commonsUser}@cdistest.csoc < get_access_token.sh ${namespace} ${username} ${expiration}`, { shell: '/bin/bash' });
  return accessToken.toString('utf8').trim();
}

function getIndexPassword(namespace) {
  const credsCmd = 'g3kubectl get secret sheepdog-creds -o json';
  const secret = runCommand(credsCmd, namespace);
  let credsString = JSON.parse(secret.toString('utf8')).data['creds.json'];
  credsString = Buffer.from(credsString, 'base64').toString('utf8');
  return JSON.parse(credsString).indexd_password;
}

function exportNconfVars() {
  // Set the environment variables according to our nconf
  const nconfVars = nconf.get();
  for (const key of Object.keys(nconfVars)) {
    if (typeof nconfVars[key] !== 'string') {
      process.env[key] = JSON.stringify(nconfVars[key]);
    } else {
      process.env[key] = nconfVars[key];
    }
  }
}

function assertEnvVars(varNames) {
  varNames.forEach((name) => {
    if (process.env[name] === '') {
      throw Error(`Missing required environment variable '${name}'`);
    }
  });
}

module.exports = async function (done) {
  console.log('SETUP/BOOTSTRAP OPERATIONS');
  // get some vars from the commons
  console.log('Setting environment variables...');
  // Export access tokens
  for (const user of Object.values(usersHelper)) {
    if (inJenkins || !user.jenkinsOnly) {
      const at = getAccessToken(process.env.NAMESPACE, user.username, DEFAULT_TOKEN_EXP);
      process.env[user.envTokenName] = at;
    }
  }

  // Export expired access token for main acct
  const mainAcct = usersHelper.mainAcct;
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
  const localVars = [mainAcct.envTokenName, mainAcct.envExpTokenName, 'INDEX_USERNAME', 'INDEX_PASSWORD', 'HOSTNAME'];
  const jenkinsVars = [
    'GOOGLE_ACCT1_EMAIL',
    'GOOGLE_ACCT1_PASSWORD',
    'GOOGLE_ACCT2_EMAIL',
    'GOOGLE_ACCT2_PASSWORD',
    'GOOGLE_APP_CREDS_JSON',
    'TEST_DATA_PATH',
  ];
  assertEnvVars(localVars);
  if (inJenkins) {
    assertEnvVars(jenkinsVars);
  }

  // Create a program and project (does nothing if already exists)
  console.log('Creating program/project');
  await commonsHelper.createProgramProject();
  done();
};
