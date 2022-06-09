const { spawnSync } = require('child_process');
const fs = require('fs');
const { getJWTData, parseJwt, getAccessTokenFromApiKey } = require('../utils/apiUtil.js');

const args = process.argv.slice(2);

if (args.length < 2) {
  console.log('read instructions: https://github.com/uc-cdis/gen3-qa/blob/master/docs/loadtesting.md');
  process.exit(1);
}

const pathToCredentialsJson = args[0];
const testDescriptorFile = args[1];

async function runLoadTestScenario() {
  let testDescriptorData = fs.readFileSync(testDescriptorFile, 'utf8');
  testDescriptorData = JSON.parse(testDescriptorData.trim());
  console.log(`testDescriptorData: ${JSON.stringify(testDescriptorData)}`);

  const targetService = testDescriptorData.service;
  const loadTestScenario = testDescriptorData.load_test_scenario;
  const jwtData = await getJWTData(pathToCredentialsJson);
  const apiKey = jwtData[Object.keys(jwtData)[0]];
  let targetEnvironment = jwtData[Object.keys(jwtData)[1]];

  let token = '';
  if (Object.prototype.hasOwnProperty.call(testDescriptorData, 'override_access_token') && testDescriptorData.override_access_token !== 'test') {
    token = testDescriptorData.override_access_token;
    console.log(`Override token: ${token}`);
    const overrideJwtData = parseJwt(testDescriptorData.override_access_token);
    targetEnvironment = overrideJwtData.iss;
    console.log(`Target environment from override token: ${targetEnvironment}`);
    targetEnvironment = targetEnvironment.replace(/(^\w+:|^)\/\//, '').replace('/user', '');
    console.log(`Sanitized target environment from override token: ${targetEnvironment}`);
  } else {
    token = await getAccessTokenFromApiKey(apiKey, targetEnvironment)
      .then((ACCESS_TOKEN) => {
        console.log(ACCESS_TOKEN);
        return ACCESS_TOKEN;
      }).catch((reason) => {
        console.log(`Failed to get access token from API Key in ${targetEnvironment}. Response: ${reason.status} - ${reason.statusText}`);
        process.exit(1);
      });
  }

  let k6output = 'json';
  if (process.env.USE_DATADOG === 'true') {
    k6output = 'statsd';
  }

  // Set fixed list of args for the load test run
  const loadTestArgs = ['-e', `TARGET_ENVIRONMENT=${process.env.TARGET_ENVIRONMENT}`,
    '-e', `RELEASE_VERSION=${process.env.RELEASE_VERSION}`, '-e', `GEN3_HOST=${targetEnvironment}`,
    '-e', `ACCESS_TOKEN=${token}`, '-e', `VU_COUNT=${process.env.VU_COUNT}`, '-e', `DURATION=${process.env.DURATION}`,
    '--out', `${k6output}`, '--summary-export=result.json',
    `load-testing/${targetService}/${loadTestScenario}.js`];

  const browserifyArgs = ['node_modules/uuid/index.js', '-s', 'uuid'];
  console.log('generating js files for node libs...');
  const browserifyCmd = spawnSync('node_modules/browserify/bin/cmd.js', browserifyArgs, { stdio: 'pipe' });
  fs.writeFileSync(
    'load-testing/libs/uuid.js',
    browserifyCmd.output.toString().slice(1, -1),
    { encoding: 'utf8', flag: 'w' },
    (err) => {
      if (err) console.log(err);
      console.log(`browserify ${browserifyArgs}`);
    },
  );

  // Always make the apiKey available for long-running tests
  loadTestArgs.unshift(`API_KEY="${apiKey}"`);
  loadTestArgs.unshift('-e');

  // The first arg should always be 'run'
  loadTestArgs.unshift('run');
  console.log(`running: k6 ${loadTestArgs}`);
  spawnSync('xk6-browser', loadTestArgs, { stdio: 'inherit' });
}

runLoadTestScenario();
