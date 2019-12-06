// Feature # 6 in the sequence of testing
// This test plan has a few pre-requisites: Check prereq.md for more details.
Feature('1. IndexD - DCF Staging testing for release sign off - https://ctds-planx.atlassian.net/browse/PXP-3836');

// To be executed with GEN3_SKIP_PROJ_SETUP=true -- No need to set up program / retrieve access token, etc.

const indexdProps = require('../../../services/apis/indexd/indexdProps.js');
const user = require('../../../utils/user.js');
const chai = require('chai');
const {interactive, ifInteractive} = require('../../../utils/interactive.js');
const { Gen3Response, getAccessTokenFromExecutableTest, getAccessTokenHeader, requestUserInput } = require('../../../utils/apiUtil');
const expect = chai.expect;

// Test elaborated for nci-crdc but it can be reused in other projects
const TARGET_ENVIRONMENT = process.env.GEN3_COMMONS_HOSTNAME || 'nci-crdc-staging.datacommons.io';

BeforeSuite(async(I) => {
    console.log('Setting up dependencies...');
    // making this data accessible in all scenarios through the actor's memory (the "I" object)
    I.cache = {};

    // Fetching public list of DIDs
    const http_resp = await I.sendGetRequest(
	`https://${TARGET_ENVIRONMENT}/index/index`
    ).then(res => new Gen3Response(res));

    I.cache.records = http_resp.body.records;
});

Scenario(`Get IndexD data from indexed files @manual`, ifInteractive(
    async(I, indexd) => {
	if (!I.cache.ACCESS_TOKEN) I.cache.ACCESS_TOKEN = await requestUserInput("Please provide your ACCESS_TOKEN: ");
	const guid = I.cache.records[0]['did'];
	// set a userAcct obj {} with an "accessTokenHeader" property to use Gen3-qa's IndexD testing API
        const http_resp = await indexd.do.getFile(
	    { did: guid },
	    { accessTokenHeader: getAccessTokenHeader(I.cache.ACCESS_TOKEN) });
	
	const result = await interactive (`
              1. [Automated] Send a HTTP GET request to retrieve the IndexD record data from GUID [${guid}].
              HTTP GET request to: https://${TARGET_ENVIRONMENT}${indexdProps.endpoints.get}

              Manual verification:
                Response status: ${http_resp.status} // Expect a HTTP 200
                Response data: ${JSON.stringify(http_resp)}
              // Expect response containing the index record details
            `);
	expect(result.didPass, result.details).to.be.true;
    }
));

/*get S3 public data record GET /index/<public_base_id> - PASS

get GC public data record GET /index/<public_base_id> - PASS

get S3 controlled data record GET /index/<controlled_base_id> - PASS

get GC controlled data record GET /index/<controlled_base_id> - PASS
*/
