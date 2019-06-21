Feature('Guppy')

const chai = require('chai');
const expect = chai.expect;

const apiUtil = require('../../utils/apiUtil.js');
// const users = require('../../utils/user.js');
const guppy = require('../../services/apis/guppy/guppyService.js');

const fetch = require('node-fetch');

var {setWorldConstructor} = require('cucumber');

const fs = require('fs');

// const { Before, Given, When, Then } = require('cucumber');

Before((home) => {
  home.complete.login();
});

Scenario('I want a list of patients (cases) strictly younger than 30 with a past stroke in ascending order of BMI.', async (I, guppy) => {
  let token = await I.grabCookie('access_token');
  const queryFile = 'test_plans/guppy/test_data/test_query_1.json';
  const expectedResponseFile = 'test_plans/guppy/test_data/test_response_1.json';
  guppy.complete.checkQueryResponseEquals(guppy.props.endpoints.graphqlEndpoint, queryFile, expectedResponseFile, token.value);
});



















