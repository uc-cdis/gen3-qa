const { spawnSync } = require('child_process');
const fs = require('fs');
const dummyjson = require('dummy-json');
const { getJWTData, getAccessTokenFromApiKey } = require('../utils/apiUtil.js');
const { fetchDIDList } = require('./indexd/indexdLTUtils.js');

const args = process.argv.slice(2);

if (args.length < 2) {
  console.log('read instructions: https://github.com/uc-cdis/gen3-qa/blob/master/docs/loadtesting.md');
  process.exit(1);
}

const pathToCredentialsJson = args[0];
const testDescriptorFile = args[1];
const customArgs = args[2];

async function generateLib(libName) {
  // generate libs
  spawnSync('which', ['browserify'], { stdio: 'inherit' });

  const browserifyArgs = [`node_modules/${libName}/index.js`, '-s', libName];
  console.log('generating js files for node libs...');
  const browserifyCmd = spawnSync('browserify', browserifyArgs, { stdio: 'pipe' });
  fs.writeFileSync(
    `load-testing/libs/${libName}.js`,
    browserifyCmd.output.toString().slice(1, -1),
    { encoding: 'utf8', flag: 'w' },
    (err) => {
      if (err) console.log(err);
      console.log(`browserify ${browserifyArgs}`);
    },
  );
}

async function runLoadTestScenario() {
  let testDescriptorData = fs.readFileSync(testDescriptorFile, 'utf8');
  testDescriptorData = JSON.parse(testDescriptorData.trim());
  console.log(`testDescriptorData: ${JSON.stringify(testDescriptorData)}`);

  const targetService = testDescriptorData.service;
  const loadTestScenario = testDescriptorData.load_test_scenario;
  const jwtData = await getJWTData(pathToCredentialsJson);
  const apiKey = jwtData[Object.keys(jwtData)[0]];
  const targetEnvironment = jwtData[Object.keys(jwtData)[1]];

  let token = '';
  if (Object.prototype.hasOwnProperty.call(testDescriptorData, 'override_access_token')) {
    token = testDescriptorData.override_access_token;
  } else {
    token = await getAccessTokenFromApiKey(apiKey, targetEnvironment)
      .then((ACCESS_TOKEN) => {
        console.log(ACCESS_TOKEN);
        return ACCESS_TOKEN;
      }).catch((reason) => {
        console.log(`Failed: ${reason.status} - ${reason.statusText}`);
        process.exit(1);
      });
  }

  let influxDBHost = '';
  if (process.env.RUNNING_LOCAL === 'false') {
    influxDBHost = 'http://influxdb:8086/loadtests_metrics';
  } else {
    influxDBHost = 'http://localhost:8086/db0';
  }
  // Set fixed list of args for the load test run
  const loadTestArgs = ['-e', `GEN3_HOST=${targetEnvironment}`, '-e', `ACCESS_TOKEN=${token}`, '-e', `VIRTUAL_USERS="${JSON.stringify(testDescriptorData.virtual_users)}"`, '--out', `influxdb=${influxDBHost}`, `load-testing/${targetService}/${loadTestScenario}.js`];

  // for additional debugging include the arg below
  // '--http-debug="full"'];

  // Expand load test args based on special flags
  // TODO: Move the custom args parsing to a separate utils script
  let listOfDIDs = null;
  if (customArgs === 'random-guids') {
    listOfDIDs = await fetchDIDList(targetEnvironment, testDescriptorData.indexd_record_acl)
      .then(async (records) => {
        const dids = [];
        await records.forEach((record) => {
          dids.push(record.did);
        });
        return dids;
      }).catch((reason) => {
        console.log(`Failed: ${JSON.stringify(reason)}`);
        process.exit(1);
      });
  } else {
    listOfDIDs = testDescriptorData.presigned_url_guids ? testDescriptorData.presigned_url_guids : [''];
  }
  console.log(listOfDIDs);
  loadTestArgs.unshift(`GUIDS_LIST=${listOfDIDs.join()}`);
  loadTestArgs.unshift('-e');

  // TODO: Move this to a separate utils function
  if (loadTestScenario === 'service-account-patch') {
    loadTestArgs.unshift(`GOOGLE_SVC_ACCOUNT=${testDescriptorData.google_svc_account}`);
    loadTestArgs.unshift('-e');
    loadTestArgs.unshift(`GOOGLE_PROJECTS_LIST=${testDescriptorData.google_projects_to_patch.join()}`);
    loadTestArgs.unshift('-e');
  }

  // TODO: Move this to a separate utils function
  if (loadTestScenario === 'import-clinical-metada') {
    loadTestArgs.unshift(`NUM_OF_RECORDS=${testDescriptorData.num_of_records}`);
    loadTestArgs.unshift('-e');
  }

  // TODO: Move this to a separate utils function
  if (loadTestScenario === 'create-and-query') {
    loadTestArgs.unshift(`MDS_TEST_DATA="${JSON.stringify(testDescriptorData.mds_test_data)}"`);
    loadTestArgs.unshift('-e');

    const basicAuth = testDescriptorData.basic_auth.username
      ? Buffer.from(`${testDescriptorData.basic_auth.username}:${testDescriptorData.basic_auth.password}`).toString('base64') : '';
    loadTestArgs.unshift(`BASIC_AUTH="${basicAuth}"`);
    loadTestArgs.unshift('-e');

    generateLib('uuid');
  }

  // TODO: Move this to a separate utils function
  if (loadTestScenario === 'filter-large-database') {
    if (!testDescriptorData.skip_json_creation) {
      const hbsTemplates = testDescriptorData.hbs_templates;

      // load json templates
      const templates = [];
      hbsTemplates.forEach((t) => {
        const templateJson = fs.readFileSync(t, { encoding: 'utf8' });
        templates.push(templateJson);
      });

      // Prepare specific values for randomicity
      const guidTypes = ['indexed_file_object', 'metadata_object'];
      const genders = ['Male', 'Female'];

      // crete tmp folder to store all the ransom jsons
      if (!fs.existsSync('load-testing/tmp')) {
        fs.mkdirSync('load-testing/tmp');
      }

      for (let i = 1; i <= testDescriptorData.num_of_jsons; i += 1) {
        const myMockdata = {
          guid_type: guidTypes[Math.floor(Math.random() * guidTypes.length)],
          gender: genders[Math.floor(Math.random() * genders.length)],
        };
        const randomJSON = dummyjson.parse(
          templates[Math.floor(Math.random() * templates.length)],
          { mockdata: myMockdata },
        );
        fs.writeFileSync(`load-testing/tmp/${i}.json`, randomJSON, (err) => {
          if (err) return console.log(err);
          console.log(`json ${i}.json has been created in the /tmp folder.`);
          return 'ok';
        });
      }
    }
    loadTestArgs.unshift(`NUM_OF_JSONS="${testDescriptorData.num_of_jsons}"`);
    loadTestArgs.unshift('-e');

    loadTestArgs.unshift(`API_KEY="${apiKey}"`);
    loadTestArgs.unshift('-e');

    generateLib('uuid');
  }

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

  // The first arg should always be 'run'
  loadTestArgs.unshift('run');
  console.log(`running: k6 ${loadTestArgs}`);
  spawnSync('k6', loadTestArgs, { stdio: 'inherit' });
}

runLoadTestScenario();
