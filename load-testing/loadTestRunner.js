const { spawn } = require('child_process');
const { getJWTData, getAccessTokenFromApiKey } = require('../utils/apiUtil.js');
const { fetchDIDList } = require('./indexd/indexdLTUtils.js');

const args = process.argv.slice(2);

if (args.length < 3) {
  console.log('read instructions: https://github.com/uc-cdis/gen3-qa/blob/master/docs/loadtesting.md');
  process.exit(1);
}

const pathToCredentialsJson = args[0];
const targetService = args[1];
const loadTestScenario = args[2];
const customArgs = args[3];

async function runLoadTestScenario() {
  const jwtData = await getJWTData(pathToCredentialsJson);
  const apiKey = jwtData[Object.keys(jwtData)[0]];
  const targetEnvironment = jwtData[Object.keys(jwtData)[1]];

  const token = await getAccessTokenFromApiKey(apiKey, targetEnvironment)
    .then((ACCESS_TOKEN) => {
      console.log(ACCESS_TOKEN);
      return ACCESS_TOKEN;
    }).catch((reason) => {
      console.log(`Failed: ${reason.status} - ${reason.statusText}`);
      process.exit(1);
    });

  // Set fixed list of args for the load test run
  const loadTestArgs = ['-e', `GEN3_HOST=${targetEnvironment}`, '-e', `ACCESS_TOKEN=${token}`, '--out', 'influxdb=http://localhost:8086/db0', `load-testing/${targetService}/${loadTestScenario}.js`];

  // Expand load test args based on special flags
  // TODO: Move the custom args parsing to a separate utils script
  if (customArgs === 'random-guids') {
    const listOfDIDs = await fetchDIDList(targetEnvironment)
      .then((records) => {
        const dids = [];
        records.forEach((record) => {
          dids.push(record.did);
        });
	  return dids;
      }).catch((reason) => {
        console.log(`Failed: ${reason.status} - ${reason.statusText}`);
        process.exit(1);
      });

    console.log(listOfDIDs);
    loadTestArgs.unshift(`GUIDS_LIST=${listOfDIDs.join()}`);
    loadTestArgs.unshift('-e');
  }

  // The first arg should always be 'run'
  loadTestArgs.unshift('run');
  console.log(`running: k6 ${loadTestArgs}`);
  spawn('k6', loadTestArgs, { stdio: 'inherit' });
}

runLoadTestScenario();
