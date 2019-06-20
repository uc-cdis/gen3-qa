const chai = require('chai');
const expect = chai.expect;

const apiUtil = require('../../utils/apiUtil.js');
const users = require('../../utils/user.js');
const guppy = require('../../services/apis/guppy/guppyService.js');

const { I } = inject();

// const fence = require('../../services/apis/fence/fenceService.js');

var {setWorldConstructor} = require('cucumber');

const fs = require('fs');
const filePathPrefix = 'test_plans/guppy/test_data/';

// Feature('Guppy');

// const { Gen3Response } = require('../../utils/apiUtil');

const { Before, Given, When, Then } = require('cucumber');

Given('a data commons with a Fence deployment running at \/user', function () {
	return '';
});

Given('a Guppy deployment running at \/guppy', function () {
	return '';
});

Given('a user test_user@example.com registered in the Fence database', async function () {
	// const scope = ['data', 'user'];
	// const apiKeyRes = await fence.do.createAPIKey(
	// 	scope,
	// 	users.mainAcct.accessTokenHeader,
	// );
	// fence.ask.hasAPIKey(apiKeyRes);
	// fence.do.deleteAPIKey(apiKeyRes.key_id);
	console.log(users.mainAcct.accessTokenHeader);

	const URL = guppy.props.endpoints.hostname + '/user';
    // console.log('bout to submit: ', queryToSubmit);
    const data = {
      method: 'POST', // or 'PUT'
      body: queryToSubmit,
      headers:{
        'Content-Type': 'application/json'
      }
    };
	return '';
});

Given('a manifest dictionary_url value of {string}', function (string) {
   return '';
 });

Given('a test database containing case documents in {string}', function (string) {
	return '';
});

Given('an ETL job completed so as to enable the use of flat queries', function () {
	return '';
});

Given('test_user@example.com with access token is expired', function () {
	return '';
});

// Then('the response will fail with a status code {int}', function (int) {
// 	return '';
// });

When('I make an API request to {string} with {string}', async function (endpoint, queryToSubmitFilename) {
	const queryFile = filePathPrefix + queryToSubmitFilename;
    let queryToSubmit = fs.readFileSync(queryFile).toString().split('\n'); 
    queryToSubmit = queryToSubmit.join('');
    // console.log('ay : ', queryToSubmit);


    // console.log('to submit: ', queryToSubmit);

    const queryResponse = await guppy.do.submitGraphQLQuery(queryToSubmit);
    //console.log('body: ', JSON.stringify(queryResponseJSON));

    this.queryResponse = queryResponse;
    
    // expect(queryResponse.body).to.equal(expectedResponse);
});

Then('the response will be successful with status code {int}', function (int) {
   // Write code here that turns the phrase above into concrete actions
   expect(this.queryResponse.status).to.equal(int);
   return '';
 });

Then('match the contents of {string}', async function (expectedResponseFilename) {
	const expectedResponse = JSON.parse(fs.readFileSync(filePathPrefix + expectedResponseFilename).toString());
	const queryResponseText = await this.queryResponse.text();
	// const queryResponse = JSON.parse(
	expect(queryResponseText).to.equal(expectedResponse);
	return '';
 });

// When('I make an API request to \/guppy\/graphql with test_query_{int}.json', function (int) {
// 	// let queryFile = '../../test_plans/test_query_1.json';
// 	// let expectedResponseFile = '../../test_plans/test_response_1.json';
// 	// guppy.complete.checkQueryResponseEquals(queryFile, expectedResponseFile);
// 	return '';
//  });

// Scenario('I want a list of patients (cases) strictly younger than 30 with a past stroke in ascending order of BMI.', async (I, guppy) => {
//   let queryFile = '../../test_plans/test_query_1.json';
//   let expectedResponseFile = '../../test_plans/test_response_1.json';
//   await guppy.complete.checkQueryResponseEquals(queryFile, expectedResponseFile);
// });

















