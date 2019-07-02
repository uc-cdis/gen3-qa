Feature('Guppy')

const chai = require('chai');
const expect = chai.expect;
const apiUtil = require('../../utils/apiUtil.js');
const guppy = require('../../services/apis/guppy/guppyService.js');
const sheepdog = require('../../services/apis/sheepdog/sheepdogService.js');
const nodes = require('../../utils/nodes.js');
const fetch = require('node-fetch');
const fs = require('fs');

Before( async (home, etl, nodes) => {
  home.complete.login();
});

Scenario('I want a list of patients (cases) strictly younger than 30 with a past stroke in ascending order of BMI.', async (I, guppy) => {
  let token = await I.grabCookie('access_token');
  const queryFile = 'test_plans/guppy/test_data/test_query_1.json';
  const expectedResponseFile = 'test_plans/guppy/test_data/test_response_1.json';
  let queryType = 'data';
  await guppy.complete.checkQueryResponseEquals(guppy.props.endpoints.graphqlEndpoint, queryFile, expectedResponseFile, token.value, queryType);
});

Scenario('I want a total count of patients matching the filter in the scenario above.', async (I, guppy) => {
  let token = await I.grabCookie('access_token');
  const queryFile = 'test_plans/guppy/test_data/test_query_2.json';
  const expectedResponseFile = 'test_plans/guppy/test_data/test_response_2.json';
  let queryType = 'aggregation';
  await guppy.complete.checkQueryResponseEquals(guppy.props.endpoints.graphqlEndpoint, queryFile, expectedResponseFile, token.value, queryType);
});

// data 2
// Scenario('I want to render a set of visualizations summarizing data in the commons.', async (I, guppy) => {
//   let token = await I.grabCookie('access_token');
//   const queryFile = 'test_plans/guppy/test_data/test_query_3.json';
//   const expectedResponseFile = 'test_plans/guppy/test_data/test_response_3.json';
//   let queryType = 'aggregation';
//   await guppy.complete.checkQueryResponseEquals(guppy.props.endpoints.graphqlEndpoint, queryFile, expectedResponseFile, token.value, queryType);
//   await guppy.complete.checkQueryResponseEquals(guppy.props.endpoints.graphqlEndpoint, queryFile, expectedResponseFile, token.value);
// });

// data 2
// Scenario('I want to make multiple histograms describing the BMI parameter to gain an understanding of its distribution.', async (I, guppy) => {
//   let token = await I.grabCookie('access_token');
//   const queryFile = 'test_plans/guppy/test_data/test_query_2.json';
//   const expectedResponseFile = 'test_plans/guppy/test_data/test_response_1.json';
//   await guppy.complete.checkQueryResponseEquals(guppy.props.endpoints.graphqlEndpoint, queryFile, expectedResponseFile, token.value);
// });

Scenario('I want a high-level overview of the data in the database as it pertains to stroke occurence and age groups represented.', async (I, guppy) => {
  let token = await I.grabCookie('access_token');
  const queryFile = 'test_plans/guppy/test_data/test_query_3.json';
  const expectedResponseFile = 'test_plans/guppy/test_data/test_response_3.json';
  let queryType = 'histogram';
  await guppy.complete.checkQueryResponseEquals(guppy.props.endpoints.graphqlEndpoint, queryFile, expectedResponseFile, token.value, queryType);
});


// Scenario('I want a range-stepped high-level overview of the data in the database as it pertains to stroke occurence and age groups represented.', async (I, guppy) => {
//   let token = await I.grabCookie('access_token');
//   const queryFile = 'test_plans/guppy/test_data/test_query_4.json';
//   const expectedResponseFile = 'test_plans/guppy/test_data/test_response_4.json';
//   let queryType = 'aggregation';
//   await guppy.complete.checkQueryResponseEquals(guppy.props.endpoints.graphqlEndpoint, queryFile, expectedResponseFile, token.value, queryType);
// });

// need a mapping function
// Scenario('I would like to list the fields on the case document.', async (I, guppy) => {
//   let token = await I.grabCookie('access_token');
//   const queryFile = 'test_plans/guppy/test_data/test_query_5.json';
//   const expectedResponseFile = 'test_plans/guppy/test_data/test_response_5.json';
//   let queryType = 'aggregation';
//   await guppy.complete.checkQueryResponseEquals(guppy.props.endpoints.graphqlEndpoint, queryFile, expectedResponseFile, token.value, queryType);
// });
























