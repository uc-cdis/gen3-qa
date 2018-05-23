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
  scope = ['data', 'user'];
  return expect(I.createAPIKey('/user/credentials/api/', scope, access_token)
    .then(
      (result) => {
        console.log(result);
        key_id = result.key_id;
        api_key = result.api_key;
        return result;
      }
    ))
    .to.eventually.have.property('api_key');
});

Scenario('test create APIKey with expired access token', async(I) => {
  scope = ['data', 'user'];
  let result = I.createAPIKey('/user/credentials/api/',
    scope, expired_access_token);
  return expect(result).to.eventually.not.have.property('api_key')
    && expect(result).to.eventually.have.property('message')
      .to.eventually.equal('Authentication Error: Signature has expired');
});

Scenario('test refresh access token with api_key', async(I) => {
  return expect(I.getAccessToken('/user/credentials/api/access_token', api_key))
    .to.eventually.have.property('access_token');
});

Scenario('test refresh access token with invalid api_key', async(I) => {
  return expect(I.getAccessToken('/user/credentials/api/access_token', 'invalid'))
    .to.eventually.not.have.property('access_token');
});

Scenario('test refresh access token without api_key', async(I) => {
  return expect(I.getAccessToken('/user/credentials/api/access_token', null))
    .to.eventually.have.property('message')
    .to.eventually.equal('Please provide an api_key in payload');
});

AfterSuite((I) => {
  if (key_id !== null){
    I.deleteAPIKey('/user/credentials/cdis/', key_id);
  }
});
