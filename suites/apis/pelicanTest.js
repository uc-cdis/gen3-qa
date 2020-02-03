Feature('Pelican');

const chai = require('chai');
const expect = chai.expect;
const apiUtil = require('../../utils/apiUtil.js');



var token;
Before( async (users, fence) => {
	const scope = ['data', 'user'];
	const apiKeyRes = await fence.complete.createAPIKey(scope, users.mainAcct.accessTokenHeader);
	token = await fence.do.getAccessToken(apiKeyRes.body.api_key);
	token = token.body.access_token;
});


Scenario('Export PFB with access to data @Pelican', async (pelicanAPI) => {
	// run the test export sequence 
	await pelicanAPI.complete.testExport(token);
});


// xScenario('Export PFB with incorrect access to data @Pelican', (pelicanAPI) => {
// 	// run the test export sequence
// 	// this test cannot be run correctly due to sower api not returning correct error codes
// 	pelicanAPI.complete.testExportBadToken("abcdefg");
// });
