let chai = require('chai');
let chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);
let expect = chai.expect;

Feature('UserTokenAPI');

let key_id = null;
let api_key = null;

let access_token = process.env.ACCESS_TOKEN;
let expired_access_token = process.env.EXPIRED_ACCESS_TOKEN;

Scenario('test create APIKey success', async(I) => {
  let scope = ['data', 'user'];
  let api_key_res = await I.createAPIKey('/user/credentials/api/', scope, access_token);
  expect(api_key_res).to.have.nested.property('body.api_key');
  key_id = api_key_res.body.key_id;
  api_key = api_key_res.body.api_key;
});

Scenario('test create APIKey with expired access token', async(I) => {
  let scope = ['data', 'user'];
  let api_key_res = await I.createAPIKey('/user/credentials/api/', scope, expired_access_token);
  I.seeFenceHasError(api_key_res, 401, 'Authentication Error: Signature has expired');
});

Scenario('test refresh access token with api_key', async(I) => {
  let access_token_res = await I.getAccessToken('/user/credentials/api/access_token', api_key);
  expect(access_token_res).has.nested.property('body.access_token');
});

Scenario('test refresh access token with invalid api_key', async(I) => {
  let access_token_res = await I.getAccessToken('/user/credentials/api/access_token', 'invalid');
  I.seeFenceHasError(access_token_res, 401, 'Not enough segments')
});

Scenario('test refresh access token without api_key', async(I) => {
  let access_token_res = await I.getAccessToken('/user/credentials/api/access_token', null);
  I.seeFenceHasError(access_token_res, 400, 'Please provide an api_key in payload');
});

AfterSuite((I) => {
  if (key_id !== null){
    I.deleteAPIKey('/user/credentials/cdis/', key_id);
  }
});
