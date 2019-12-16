const { spawn } = require('child_process');
const { getAccessTokenFromApiKey } = require('../utils/apiUtil.js');
const { getJWTData } = require('../utils/apiUtil.js');

const args = process.argv.slice(2);

if (args.length != 3) {
  console.log('read instructions');
}

var path_to_credentials_json = args[0];

target_service = args[1];
load_test_scenario = args[2];

async function runLoadTestScenario() {
  const { api_key, target_environment } = await getJWTData(path_to_credentials_json);

  const token = await getAccessTokenFromApiKey(api_key, target_environment)
    .then((ACCESS_TOKEN) => {
      console.log(ACCESS_TOKEN);
      return ACCESS_TOKEN;
    }).catch((reason) => {
      console.log(`Failed: ${reason.status} - ${reason.statusText}`);
      return Error(`Failed: ${reason.status} - ${reason.statusText}`);
    });
  spawn('k6', ['run', '-e', `GEN3_HOST=${target_environment}`, '-e', `ACCESS_TOKEN=${token}`, '--out', 'influxdb=http://localhost:8086/db0', `load-testing/${target_service}/${load_test_scenario}.js`], { stdio: 'inherit' });
}

runLoadTestScenario();
