'use strict';

let chai = require('chai');
let chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);
let expect = chai.expect;

Feature('LinkGoogleAcct');

let access_token = process.env.ACCESS_TOKEN;
let expired_access_token = process.env.EXPIRED_ACCESS_TOKEN;

Scenario('test link google with expired access token', async(I) => {
  let res = I.createGoogleLink('/link/google/callback', access_token)
  // expect some error about expred access token
});

Scenario('test link google without redirect', async(I) => {
  let res = I.createGoogleLink(null, access_token)
  // expect some error about missing redirect
});

Scenario('test link google acct success', async(I) => {
  let res = I.createGoogleLink('/link/google/callback', access_token);
  // expect successful link
});

Scenario('test link already linked google acct', async(I) => {
  // Link for access token should already exist due to test above
  let res = I.createGoogleLink('/link/google/callback', access_token);
  // expect error about account already linked
});

Scenario('test linked google account id_token', async(I) => {
  // post to user/oauth2/token to get the id_token (see fence test test_link_id_token)
});

Scenario('test extend google link expiration', async(I) => {
  // get current expiration from the oauth2/token endpoint??
  let tokens = somefunction();
  // expect tokens to have some property
  //save the expiration value from the tokens

  let res = I.extendGoogleLink(access_token);
  // expect res to have "exp" with some value greater than previous expiration
});

BeforeSuite((I) => {
  // verify the account is not linked
});