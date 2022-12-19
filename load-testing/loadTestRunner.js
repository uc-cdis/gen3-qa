const { spawnSync } = require('child_process');
const fs = require('fs');
const dummyjson = require('dummy-json');
const { getJWTData, parseJwt, getAccessTokenFromApiKey } = require('../utils/apiUtil.js');
const { fetchDIDList } = require('./indexd/indexdLTUtils.js');

const args = process.argv.slice(2);

if (args.length < 2) {
  console.log('read instructions: https://github.com/uc-cdis/gen3-qa/blob/master/docs/loadtesting.md');
  process.exit(1);
}

const pathToCredentialsJson = args[0];
const testDescriptorFile = args[1];
const customArgs = args[2];

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
  let influxDBHost = '';
  if (process.env.RUNNING_LOCAL === 'false') {
    influxDBHost = 'http://influxdb:8086/loadtests_metrics';
  } else {
    influxDBHost = 'http://localhost:8086/db0';
  }

  let k6output = `influxdb=${influxDBHost}`;
  if (process.env.USE_DATADOG === 'true') {
    k6output = 'statsd';
  }

  // Set fixed list of args for the load test run
  const loadTestArgs = ['-e', `RELEASE_VERSION=${process.env.RELEASE_VERSION}`, '-e', `GEN3_HOST=${targetEnvironment}`, '-e', `ACCESS_TOKEN=${token}`, '-e', `VIRTUAL_USERS="${JSON.stringify(testDescriptorData.virtual_users)}"`,
    '--out', `${k6output}`, '--summary-export=result.json',
    `load-testing/${targetService}/${loadTestScenario}.js`];

  // for additional debugging include the arg below
  // '--http-debug="full"'];

  // Expand load test args based on special flags
  // TODO: Move the custom args parsing to a separate utils script
  let listOfDIDs = null;
  if (customArgs === 'random-guids') {
    console.log(`testDescriptorData: ${JSON.stringify(testDescriptorData.indexd_record_acl)}`);
    listOfDIDs = await fetchDIDList(targetEnvironment, testDescriptorData.indexd_record_acl)
      .then(async (records) => {
        const dids = [];
        await records.forEach((record) => {
          dids.push(record.did);
        });
        return dids;
      }).catch((reason) => {
        console.log(reason);
        process.exit(1);
      });
  } else {
    listOfDIDs = testDescriptorData.presigned_url_guids ? testDescriptorData.presigned_url_guids : [''];
  }

  const mtlsDomain = testDescriptorData.MTLS_DOMAIN ? testDescriptorData.MTLS_DOMAIN : '';
  loadTestArgs.unshift(`MTLS_DOMAIN=${mtlsDomain}`);
  loadTestArgs.unshift('-e');
  const mtlsCert = testDescriptorData.MTLS_CERT ? testDescriptorData.MTLS_CERT : '';
  loadTestArgs.unshift(`MTLS_CERT=${mtlsCert}`);
  loadTestArgs.unshift('-e');
  const mtlsKey = testDescriptorData.MTLS_KEY ? testDescriptorData.MTLS_KEY : '';
  loadTestArgs.unshift(`MTLS_KEY=${mtlsKey}`);
  loadTestArgs.unshift('-e');

  const passportsList = testDescriptorData.passports_list ? testDescriptorData.passports_list : '';
  loadTestArgs.unshift(`PASSPORTS_LIST=${passportsList}`);
  loadTestArgs.unshift('-e');

  loadTestArgs.unshift(`TARGET_ENV=${targetEnvironment}`);
  loadTestArgs.unshift('-e');

  const indexdRecordAuthzList = (
    testDescriptorData.indexd_record_authz_list
      ? testDescriptorData.indexd_record_authz_list : 1);
  loadTestArgs.unshift(`AUTHZ_LIST=${indexdRecordAuthzList}`);
  loadTestArgs.unshift('-e');

  const minRecords = (testDescriptorData.minimum_records
    ? testDescriptorData.minimum_records : 1);
  loadTestArgs.unshift(`MINIMUM_RECORDS=${minRecords}`);
  loadTestArgs.unshift('-e');

  const recordChunkSize = (testDescriptorData.record_chunk_size
    ? testDescriptorData.record_chunk_size : 1);
  loadTestArgs.unshift(`RECORD_CHUNK_SIZE=${recordChunkSize}`);
  loadTestArgs.unshift('-e');

  const numParallelRequests = (testDescriptorData.num_parallel_requests
    ? testDescriptorData.num_parallel_requests : 1);
  loadTestArgs.unshift(`NUM_PARALLEL_REQUESTS=${numParallelRequests}`);
  loadTestArgs.unshift('-e');

  loadTestArgs.unshift(`GUIDS_LIST=${listOfDIDs.join()}`);
  loadTestArgs.unshift('-e');

  const presignedUrlProtocol = testDescriptorData.presigned_url_protocol ? testDescriptorData.presigned_url_protocol : '';
  console.log(`## presignedUrlProtocol: ${presignedUrlProtocol}`);
  loadTestArgs.unshift(`SIGNED_URL_PROTOCOL=${presignedUrlProtocol}`);
  loadTestArgs.unshift('-e');

  // TODO: Move this to a separate utils function
  if (loadTestScenario === 'service-account-patch') {
    loadTestArgs.unshift(`GOOGLE_SVC_ACCOUNT=${testDescriptorData.google_svc_account}`);
    loadTestArgs.unshift('-e');
    loadTestArgs.unshift(`GOOGLE_PROJECTS_LIST=${testDescriptorData.google_projects_to_patch.join()}`);
    loadTestArgs.unshift('-e');
  }

  // TODO: Move this to a separate utils function
  if (loadTestScenario === 'import-clinical-metadata') {
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

  // Always make the apiKey available for long-running tests
  loadTestArgs.unshift(`API_KEY="${apiKey}"`);
  loadTestArgs.unshift('-e');

  // The first arg should always be 'run'
  // dd_api_key-k6_load_testing
  loadTestArgs.unshift('run');
  console.log(`running: k6 ${loadTestArgs}`);
  spawnSync('k6', loadTestArgs, { stdio: 'inherit' });
}

runLoadTestScenario();
