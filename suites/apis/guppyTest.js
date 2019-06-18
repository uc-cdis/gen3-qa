const chai = require('chai');
const expect = chai.expect;

const apiUtil = require('../../utils/apiUtil.js');

// Feature('Guppy');

// const { Gen3Response } = require('../../utils/apiUtil');

const { Before, Given, When, Then } = require('cucumber')

Given('a data commons with a Fence deployment running at \/user', function () {
	console.log('ayeee');
	return 8;
});

Given('a a Guppy deployment running at \/guppy', function () {
	return '';
});

Given('a user test_user@example.com registered in the Fence database', function () {
	return '';
});

Given('a manifest dictionary_url value of https:\/\/s{int}.amazonaws.com\/dictionary-artifacts\/gtexdictionary\/master\/schema.json', function (int) {
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

When('I make an API request to \/guppy\/graphql with test_query_{int}.json', function (int) {
	return '';
});

Then('the response will fail with a status code {int}', function (int) {
	return '';
});

// Scenario('I want a list of patients (cases) strictly younger than 30 with a past stroke in ascending order of BMI.', async (I, guppy) => {
//   let queryFile = '../../test_plans/test_query_1.json';
//   let expectedResponseFile = '../../test_plans/test_response_1.json';
//   await guppy.complete.checkQueryResponseEquals(queryFile, expectedResponseFile);
// });