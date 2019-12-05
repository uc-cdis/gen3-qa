// Feature # 4 in the sequence of testing
// This test plan has a few pre-requisites: Check prereq.md for more details.
Feature('4. PreSigned URLs - DCF Staging testing for release sign off - https://ctds-planx.atlassian.net/browse/PXP-3836');

// To be executed with GEN3_SKIP_PROJ_SETUP=true -- No need to set up program / retrieve access token, etc.

const fenceProps = require('../../../services/apis/fence/fenceProps.js');
const user = require('../../../utils/user.js');
const chai = require('chai');
const {interactive, ifInteractive} = require('../../../utils/interactive.js');
const { Gen3Response, getAccessTokenFromExecutableTest, getAccessTokenHeader, requestUserInput } = require('../../../utils/apiUtil');
const expect = chai.expect;

// Test elaborated for nci-crdc but it can be reused in other projects
const TARGET_ENVIRONMENT = process.env.GEN3_COMMONS_HOSTNAME || 'nci-crdc-staging.datacommons.io';

BeforeSuite(async(I) => {
    console.log('Setting up dependencies...');
    I.cache = {};
    I.TARGET_ENVIRONMENT = TARGET_ENVIRONMENT;
    // Fetching public list of DIDs
    const http_resp = await I.sendGetRequest(
	`https://${TARGET_ENVIRONMENT}/index/index`
    ).then(res => new Gen3Response(res));

    I.cache.records = http_resp.body.records;
});

// TODO: Consolidate some of the common scenarios across other executable tests to avoid duplicates
// e.g., The "fetchDIDLists()" function is also included in suites/apis/dataStageOIDCFlowTest.js
// TODO: Verify better approach to find DIDs for positive and negative tests based on the "/index?acl=<acl>" API call

function fetchDIDLists(I) {
    // Only assemble the didList if the list hasn't been initialized
    return new Promise(async(resolve) => {
	if (!I.didList) {
	    const http_resp = await I.sendGetRequest(
		`https://${TARGET_ENVIRONMENT}/user/user`,
		{ Authorization: `bearer ${I.cache.ACCESS_TOKEN}` }
	    ).then(res => new Gen3Response(res));

	    project_access_list = http_resp.body.project_access;

	    // initialize dict of accessible DIDs
	    _200files = {};
	    // initialize dict of blocked DIDs
	    _401files = {};

	    // adding record DIDs to their corresponding ACL key
	    // ( I.cache.records is created in BeforeSuite() )
	    I.cache.records.forEach(record => {
		// console.log('ACLs for ' + record['did'] + ' - ' + record['acl']);
		// Filtering accessible DIDs by checking if the record acl is in the project access list
		let accessible_did = record['acl'].filter(acl => {
		    return project_access_list.hasOwnProperty(acl);
		});

		// Put DIDs urls and md5 hash into their respective lists (200 or 401)
		let _files = accessible_did.length > 0 ? _200files : _401files;
		_files[record['did']] = { "urls": record['urls'], "md5": record['md5'] };
	    });

//	    console.log('http 200 files: ' + JSON.stringify(_200files));
//	    console.log('http 401 files: ' + JSON.stringify(_401files));

	    I.didList = {};
	    I.didList['accessGrantedFiles'] = _200files;
	    I.didList['accessDeniedFiles'] = _401files;
	}
	resolve({
	    _200files: I.didList.accessGrantedFiles,
	    _401files: I.didList.accessDeniedFiles
	});
    });
}

function performPreSignedURLTest(cloud_provider, type_of_test, type_of_creds) {
    Scenario(`Perform ${cloud_provider} PreSigned URL ${type_of_test} test against DID with ${type_of_creds} credentials @manual`, ifInteractive(
	async(I, fence) => {
	    if (!I.cache.ACCESS_TOKEN) I.cache.ACCESS_TOKEN = await requestUserInput("Please provide your ACCESS_TOKEN: ");
	    // Obtain project access list to determine which files(DIDs) the user can access
	    // two lists: http 200 files and http 401 files
	    const {_200files, _401files} = await fetchDIDLists(I);

	    // positive: _200files | negative: _401files
	    let list_of_DIDs = type_of_test == "positive" ? _200files : _401files;
	    // AWS: s3:// | Google: gs://
	    let preSignedURL_prefix = cloud_provider == "AWS S3" ? 's3://' : 'gs://';

	    console.log('list_of_DIDs: ' + JSON.stringify(list_of_DIDs));

	    let filteredDIDs = Object.keys(list_of_DIDs).reduce(function (filtered, key) {
		list_of_DIDs[key]['urls'].forEach(url => {
		    if (url.startsWith(preSignedURL_prefix)) filtered[key] = list_of_DIDs[key];
		});
		return filtered;
	    }, {});

	    // Must have at least one sample to conduct this test
	    let selected_did = Object.keys(filteredDIDs)[0];
	    // PreSignedURL request
	    const signedUrlRes = await fence.do.createSignedUrl(
		`${selected_did}`,
		[],
		assembleCustomHeaders(I.cache.ACCESS_TOKEN)
	    );

	    // TODO: Run `wget` with PreSignedURL and check if md5 matches the record['md5']

	    let verification_message = type_of_test == "positive" ? `
                a. The HTTP response code is Ok/200.
                b. The response contain valid URLs to the files stored in AWS S3 or GCP Buckets.` : `
	        a. The HTTP response code is 401.
                b. The response contains a Fence error message.`;

	    const result = await interactive (`
              1. [Automated] Selected DID [${selected_did}] to perform a ${type_of_test} ${cloud_provider} PreSigned URL test with ${type_of_creds} credentials.
              2. [Automated] Executed an HTTP GET request (using the ACCESS_TOKEN provided).
              3. Verify if:${verification_message}
              Manual verification:
                HTTP Code: ${signedUrlRes.status}
                RESPONSE: ${JSON.stringify(signedUrlRes.body) || signedUrlRes.parsedFenceError}
            `);
	    expect(result.didPass, result.details).to.be.true;
	}
    ));
}

// Scenario #1 - Controlled Access Data - Google PreSignedURL test against DID the user can't access
performPreSignedURLTest("Google Storage", "negative", "Google");

// Scenario #2 - Controlled Access Data - Google PreSignedURL test against DID the user can access
performPreSignedURLTest("Google Storage", "positive", "Google");

// Scenario #3 - Controlled Access Data - Google PreSignedURL test against DID the user can't access
performPreSignedURLTest("AWS S3", "negative", "Google");

// Scenario #4 - Controlled Access Data - Google PreSignedURL test against DID the user can access
performPreSignedURLTest("AWS S3", "positive", "Google");
