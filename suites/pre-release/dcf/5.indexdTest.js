// Feature # 6 in the sequence of testing
// This test plan has a few pre-requisites: Check prereq.md for more details.
Feature('5. IndexD - DCF Staging testing for release sign off - PXP-3836');

// To be executed with GEN3_SKIP_PROJ_SETUP=true
// No need to set up program / retrieve access token, etc.

const { expect } = require('chai');
const indexdProps = require('../../../services/apis/indexd/indexdProps.js');
const { interactive, ifInteractive } = require('../../../utils/interactive.js');
const {
  Gen3Response, getAccessTokenHeader, requestUserInput,
} = require('../../../utils/apiUtil');

let httpStatus;

// Test elaborated for nci-crdc but it can be reused in other projects
const TARGET_ENVIRONMENT = process.env.GEN3_COMMONS_HOSTNAME || 'nci-crdc-staging.datacommons.io';

BeforeSuite(async ({ I }) => {
  console.log('Setting up dependencies...');
  // making this data accessible in all scenarios through the actor's memory (the "I" object)
  I.cache = {};
});

Scenario('Get public data record @manual', ifInteractive(
  async ({ I, indexd }) => {
    if (!I.cache.ACCESS_TOKEN) I.cache.ACCESS_TOKEN = await requestUserInput('Please provide your ACCESS_TOKEN: ');
    // Fetching public list of DIDs
    const indexHttpResp = await I.sendGetRequest(
      `https://${TARGET_ENVIRONMENT}/index/index?acl=*`,
    ).then((res) => new Gen3Response(res));

    const guid = indexHttpResp.body.records[0].did;
    // set a userAcct obj {} with an "accessTokenHeader" property
    // to use Gen3-qa's IndexD testing API
    const httpResp = await indexd.do.getFile(
      { did: guid },
      { accessTokenHeader: getAccessTokenHeader(I.cache.ACCESS_TOKEN) },
    );
    console.log(httpResp);
    if ((httpResp.length) !== 0) {
      httpStatus = 200;
    }
    const result = await interactive(`
              1. [Automated] Send a HTTP GET request to retrieve the IndexD record data from GUID [${guid}].
              HTTP GET request to: https://${TARGET_ENVIRONMENT}${indexdProps.endpoints.get}/${guid}

              Manual verification:
                Response status: ${httpStatus} // Expect a HTTP 200
                Response data: ${JSON.stringify(httpResp)}
              // Expect response containing the index record details
            `);
    expect(result.didPass, result.details).to.be.true;
  },
));

Scenario('Get controlled data record @manual', ifInteractive(
  async ({ I, indexd }) => {
    if (!I.cache.ACCESS_TOKEN) I.cache.ACCESS_TOKEN = await requestUserInput('Please provide your ACCESS_TOKEN: ');
    // Fetching list of ACLs associated with the user
    const userHttpResp = await I.sendGetRequest(
      `https://${TARGET_ENVIRONMENT}/user/user`,
      { Authorization: `bearer ${I.cache.ACCESS_TOKEN}` },
    ).then((res) => new Gen3Response(res));

    const projectAccessList = userHttpResp.body.project_access;
    const projectAccess = Object.keys(projectAccessList)[0];

    // Fetching list of DIDs matching one of the ACLs from the user
    const indexHttpResp = await I.sendGetRequest(
      `https://${TARGET_ENVIRONMENT}/index/index?acl=${projectAccess}`,
    ).then((res) => new Gen3Response(res));

    const guid = indexHttpResp.body.records[0].did;
    // set a userAcct obj {} with an "accessTokenHeader" property
    // to use Gen3-qa's IndexD testing API
    const httpResp = await indexd.do.getFile(
      { did: guid },
      { accessTokenHeader: getAccessTokenHeader(I.cache.ACCESS_TOKEN) },
    );

    const result = await interactive(`
              1. [Automated] Send a HTTP GET request to retrieve the IndexD record data from GUID [${guid}].
              HTTP GET request to: https://${TARGET_ENVIRONMENT}${indexdProps.endpoints.get}/${guid}

              Manual verification:
                Response data: ${JSON.stringify(httpResp)}
              // Expect response containing the index record details
            `);
    expect(result.didPass, result.details).to.be.true;
  },
));
