const nconf = require('nconf');
const { execSync } = require('child_process');
const homedir = require('os').homedir();

const commonsHelper = require('./actors/commons_helper');

function getCommonsVars(namespace) {
  // ssh into the commons/namespace to get access token and other stuff
  const username = namespace === 'default' ? 'qaplanetv1' : namespace;
  const execCommonsVars = `ssh ${username}@cdistest.csoc 'bash -s' < extract_envs_for_local.sh ${namespace}`;
  const commonsVars = execSync(execCommonsVars);
  return commonsVars.toString('utf8');
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

module.exports = async function (done) {
  console.log('SETUP/BOOTSTRAP OPERATIONS');
  // get some vars from the commons
  console.log('Setting environment variables...');
  const getResult = getCommonsVars(process.env.NAMESPACE);
  let commonsVarsJson;
  try {
    commonsVarsJson = JSON.parse(getResult);
  } catch (e) {
    console.log(getResult);
    throw Error('Unable to fetch variables from commons.');
  }

  // Create configuration values based on hierarchy the export them to the process
  nconf.overrides(commonsVarsJson);
  nconf.argv()
    .env()
    .file({
      file: 'auto-qa-config.json',
      dir: `${homedir}/.gen3`,
      search: true,
    });

  exportNconfVars();

  // Create a program and project (does nothing if already exists)
  console.log('Creating program/project');
  await commonsHelper.createProgramProject();
  done();
};
