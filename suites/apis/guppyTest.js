Feature('Guppy')

const chai = require('chai');
const expect = chai.expect;
const apiUtil = require('../../utils/apiUtil.js');
const guppy = require('../../services/apis/guppy/guppyService.js');
const sheepdog = require('../../services/apis/sheepdog/sheepdogService.js');
const nodes = require('../../utils/nodes.js');
const fetch = require('node-fetch');
const fs = require('fs');

var token;

Before( async (users, fence) => {
  const scope = ['data', 'user'];
  const apiKeyRes = await fence.complete.createAPIKey(scope, users.mainAcct.accessTokenHeader);
  token = await fence.do.getAccessToken(apiKeyRes.body.api_key);
  token = token.body.access_token;
});

// This test fails due to what looks to me like a bug in Guppy that should be fixed. I made a ticket for it.
xScenario('I want to make a query to Guppy, but my access token is invalid or expired. @guppyAPI', async (I, guppy) => {
  let invalidToken = 'eyJhbGciOiJSUzI1N';
  const queryFile = 'test_plans/guppy/test_data/test_query_1.json';
  const queryResponse = await guppy.do.submitQueryFileToGuppy(guppy.props.endpoints.graphqlEndpoint, queryFile, invalidToken);
  expect(queryResponse.status).to.equal(401);
});

Scenario('I want a list of patients (cases) strictly younger than 30 with a past stroke in ascending order of BMI. @guppyAPI', async (I, guppy) => {
  const queryFile = 'test_plans/guppy/test_data/test_query_1.json';
  const expectedResponseFile = 'test_plans/guppy/test_data/test_response_1.json';
  let queryType = 'data';
  await guppy.complete.checkQueryResponseEquals(guppy.props.endpoints.graphqlEndpoint, queryFile, expectedResponseFile, token, queryType);
});

Scenario('I want a total count of patients matching the filter in the scenario above. @guppyAPI', async (I, guppy) => {
  const queryFile = 'test_plans/guppy/test_data/test_query_2.json';
  const expectedResponseFile = 'test_plans/guppy/test_data/test_response_2.json';
  let queryType = 'aggregation';
  await guppy.complete.checkQueryResponseEquals(guppy.props.endpoints.graphqlEndpoint, queryFile, expectedResponseFile, token, queryType);
});

Scenario('I want to render a set of visualizations summarizing data in the commons. @guppyAPI', async (I, guppy) => {
  const queryFile = 'test_plans/guppy/test_data/test_query_6.json';
  const expectedResponseFile = 'test_plans/guppy/test_data/test_response_6.json';
  let queryType = 'histogram';
  await guppy.complete.checkQueryResponseEquals(guppy.props.endpoints.graphqlEndpoint, queryFile, expectedResponseFile, token, queryType);
});

Scenario('I want to make multiple histograms describing the BMI parameter to gain an understanding of its distribution. @guppyAPI', async (I, guppy) => {
  const queryFile = 'test_plans/guppy/test_data/test_query_7.json';
  const expectedResponseFile = 'test_plans/guppy/test_data/test_response_7.json';
  let queryType = 'histogram';
  await guppy.complete.checkQueryResponseEquals(guppy.props.endpoints.graphqlEndpoint, queryFile, expectedResponseFile, token, queryType);
});

Scenario('I want a high-level overview of the data in the database as it pertains to stroke occurence and age groups represented. @guppyAPI', async (I, guppy) => {
  const queryFile = 'test_plans/guppy/test_data/test_query_3.json';
  const expectedResponseFile = 'test_plans/guppy/test_data/test_response_3.json';
  let queryType = 'histogram';
  await guppy.complete.checkQueryResponseEquals(guppy.props.endpoints.graphqlEndpoint, queryFile, expectedResponseFile, token, queryType);
});

// This test fails due to what looks to me like a bug in Guppy that needs to be investigated. The "max" value calculation is off by < 0.1% of the actual value.
xScenario('I want a range-stepped high-level overview of the data in the database as it pertains to stroke occurence and age groups represented. @guppyAPI', async (I, guppy) => {
  const queryFile = 'test_plans/guppy/test_data/test_query_4.json';
  const expectedResponseFile = 'test_plans/guppy/test_data/test_response_4.json';
  let queryType = 'histogram';
  await guppy.complete.checkQueryResponseEquals(guppy.props.endpoints.graphqlEndpoint, queryFile, expectedResponseFile, token, queryType);
});

Scenario('I would like to list the fields on the case document. @guppyAPI', async (I, guppy) => {
  const queryFile = 'test_plans/guppy/test_data/test_query_5.json';
  const expectedResponseFile = 'test_plans/guppy/test_data/test_response_5.json';
  let queryType = 'mapping';
  await guppy.complete.checkQueryResponseEquals(guppy.props.endpoints.graphqlEndpoint, queryFile, expectedResponseFile, token, queryType);
});

Scenario('I want to make a filtering query without worrying about paginating the results, or whether the result will be > 10k records. @guppyAPI', async (I, guppy) => {
  const queryFile = 'test_plans/guppy/test_data/test_query_8.json';
  const expectedResponseFile = 'test_plans/guppy/test_data/test_response_8.json';
  let queryType = 'download';
  await guppy.complete.checkQueryResponseEquals(guppy.props.endpoints.downloadEndpoint, queryFile, expectedResponseFile, token, queryType);
});