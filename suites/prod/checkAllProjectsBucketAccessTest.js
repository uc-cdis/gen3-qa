/*
 Bucket Access test for ALL projects and protocols (PXP-7076)
 This automation should be utilized on every release to run a PreSigned URL request
 against an indexd record from each Project (acl / authz).

 How to run:
 $ export GEN3_SKIP_PROJ_SETUP=true RUNNING_LOCAL=true
 $ npm test -- suites/prod/checkAllProjectsBucketAccessTest.js

 The full list of indexd records can be filtered through the INDEXD_FILTER var.
 It supports the following 3 options:
 - acl
 - authz
 - all (default)
 e.g.,
 $ export INDEXD_FILTER=acl GEN3_SKIP_PROJ_SETUP=true RUNNING_LOCAL=true
 $ npm test -- suites/prod/checkAllProjectsBucketAccessTest.js

 Note: The DEBUG level is enabled by default in the logger configuration.
 To tail the logs and focus only on successful or Failed checks
 just run the command below:
 $ tail -f all-projects-bucket-access-check.log | grep -E "Successfully|Failed"
*/
Feature('CheckAllProjectsBucketAccess');

const bar = require('cli-progress');
const axios = require('axios');
const log4js = require('log4js');
const {
  requestUserInput,
  parseJwt,
  getAccessTokenHeader,
  sleepMS,
} = require('../../utils/apiUtil');

log4js.configure({
  appenders: {
    accessCheck: { // eslint-disable-line no-undef
      type: 'file',
      filename: 'all-projects-bucket-access-check.log',
    },
    console: { type: 'console' },
  },
  categories: {
    default: { appenders: ['accessCheck', 'console'], level: 'debug' },
  },
});
const logger = log4js.getLogger('accessCheck');
const progressBar = new bar.SingleBar({}, bar.Presets.shades_classic);

const indexdFilter = process.env.INDEXD_FILTER || 'all';
let numOfCompletedChecks = 0;

async function checkAccess(I, a, indexdQueryParam) {
  // fetch indexd GUID from a record
  const indexdLookupResp = await I.sendGetRequest(
    `https://${I.cache.environment}/index/index?${indexdQueryParam}=${a}`,
  );
  if (indexdLookupResp.data.records.length > 0) {
    // TODO: parameterize sample size
    // sampling - Randomly picking one indexd record from the acl query
    const aGUID = indexdLookupResp.data.records[
      Math.floor(Math.random() * indexdLookupResp.data.records.length)
    ].did;
    logger.info(`picking one indexd record with GUID ${aGUID} from ${indexdQueryParam} ${a}`);
    // shoot pre signed url against fence with the GUID

    const listOfProtocols = ['s3', 'gs'];

    for (const protocol of listOfProtocols) {
      logger.debug(`checking guid ${aGUID} with protocol ${protocol}...`);
      const preSignedURLResp = await I.sendGetRequest(
        `https://${I.cache.environment}/user/data/download/${aGUID}?protocol=${protocol}`,
        getAccessTokenHeader(I.cache.ACCESS_TOKEN),
      );
      // TODO: 401 Token Expired check to prompt the user for a new access token
      // if we expect this check to take longer than 20 minutes
      logger.debug(`preSignedURLResp: ${JSON.stringify(preSignedURLResp.data)}`);

      let httpGetCheck = {};
      try {
        httpGetCheck = await axios.get(preSignedURLResp.data.url);
        // logger.debug(`http GET Check for ${aGUID}: ${httpGetCheck}`);
      } catch (error) {
        // Error 😨
        if (error.response) {
          logger.error(`Failed to obtain a successful access check against GUID ${aGUID} from ${indexdQueryParam} ${a} - Status Code: ${error.response.status}`);
          logger.error(`Details: ${error.response.data}`);
        } else {
          logger.error(`Failed to process HTTP GET request for GUID ${aGUID}`);
        }
      }
      if (httpGetCheck.status === 200) {
        logger.debug(`Successfully verified the access for ${indexdQueryParam} ${a}!`);
      } else if (httpGetCheck.status === 400) {
        logger.debug(`http.status: ${httpGetCheck.status} - Successfully verified the access for ${indexdQueryParam} ${a} with message <Bucket is a requester pays bucket but no user project provided>.!`);
      }
    }
  } else {
    logger.warn(`Zero indexd records found for ${indexdQueryParam} ${a}`);
  }
  numOfCompletedChecks += 1;
  progressBar.update(numOfCompletedChecks);

  // Sleep for a sec to avoid stressing fence
  await sleepMS(1000);
}

BeforeSuite(async ({ I }) => {
  logger.info('Initializing cache object...');
  I.cache = {};
});

Scenario('Fetch list of projects (acl/authz) from environment @manual @prjsBucketAccess', async ({ I }) => {
  if (process.env.RUNNING_IN_PROD_TIER === 'true') {
    I.cache.ACCESS_TOKEN = process.env.ACCESS_TOKEN;
  } else {
    I.cache.ACCESS_TOKEN = await requestUserInput('Please provide your ACCESS_TOKEN: ');
  }
  const accessTokenJson = parseJwt(I.cache.ACCESS_TOKEN);
  const username = accessTokenJson.context.user.name;
  const environment = accessTokenJson.iss.split('/')[2];
  I.cache.environment = environment;

  logger.info(`Using ${username}'s access token to obtain list of projects (acl/authz) from ${environment}...`);
  const userInfoResp = await I.sendGetRequest(
    `https://${environment}/user/user`,
    getAccessTokenHeader(I.cache.ACCESS_TOKEN),
  );
  I.cache.numOfChecks = 0;
  if (indexdFilter === 'acl' || indexdFilter === 'all') {
    const acl = Object.keys(userInfoResp.data.project_access);
    logger.info(`acl: ${acl}`);
    // Appending * (for admins)
    acl.push('*');
    logger.info(`number of acl items: ${acl.length}`);
    I.cache.acls = acl;
    I.cache.numOfChecks += acl.length;
  }
  if (indexdFilter === 'authz' || indexdFilter === 'all') {
    const authz = Object.keys(userInfoResp.data.authz).filter((a) => a.includes('/programs/'));
    logger.info(`authz: ${authz}`);
    logger.info(`number of authz items: ${authz.length}`);
    I.cache.authzs = authz;
    I.cache.numOfChecks += authz.length;
  }
  progressBar.start(I.cache.numOfChecks, 0);
});

Scenario('Run PreSigned URL checks against an indexd record from each project @manual @prjsBucketAccess', async ({ I }) => {
  if (!I.cache.ACCESS_TOKEN) I.cache.ACCESS_TOKEN = await requestUserInput('Please provide your ACCESS_TOKEN: ');

  if (I.cache.acls) {
    for (let i = 0; i < I.cache.acls.length; i++) { // eslint-disable-line no-plusplus
      const acl = I.cache.acls[i];
      await checkAccess(I, acl, 'acl');
    }
  }
  if (I.cache.authzs) {
    for (let i = 0; i < I.cache.authzs.length; i++) { // eslint-disable-line no-plusplus
      const authz = I.cache.authzs[i];
      await checkAccess(I, authz, 'authz');
    }
  }
});
