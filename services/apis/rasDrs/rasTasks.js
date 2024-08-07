const { expect } = require('chai');
const queryString = require('query-string');
const { sleepMS } = require('../../../utils/apiUtil.js');
const rasProps = require('./rasProps.js');
const rasQuestions = require('./rasQuestions.js');

const I = actor();

module.exports = {

  async getAuthCode(scope, username, password) {
    console.log('### Getting the auth token ...');
    I.amOnPage(`${rasProps.rasAuthEndpoint}?response_type=code&client_id=${I.cache.clientID}&redirect_uri=http://localhost:8080/user/login/ras/callback&scope=${scope}&idp=ras`);
    await sleepMS(5000);
    I.saveScreenshot('rasLogin_Page.png');
    // fill the RAS user credentials
    // I.fillField(`${rasProps.userField}`, process.env.RAS_TEST_USER_1_USERNAME);
    I.fillField(`${rasProps.userField}`, username);
    // I.fillField(`${rasProps.passwordField}`, secret(process.env.RAS_TEST_USER_1_PASSWORD));
    I.fillField(`${rasProps.passwordField}`, password);
    I.waitForElement(rasProps.signInButton, 10);
    I.click(rasProps.signInButton);
    // check if reponse url contains 'code'
    I.seeInCurrentUrl('code');
    // now grab the code from the url
    const authCodeURL = await I.grabCurrentUrl();
    console.log(authCodeURL);
    const url = new URL(authCodeURL);
    const code = url.searchParams.get('code');
    expect(code).not.to.be.empty;
    return code;
  },

  async getTokens(clientID, secretID, scope, username, password) {
    console.log('### Getting RAS Access Token and Refresh Token');
    const authCode = await this.getAuthCode(scope, username, password);
    const data = queryString.stringify({
      grant_type: 'authorization_code',
      code: `${authCode}`,
      client_id: `${clientID}`,
      client_secret: `${secretID}`,
      scope: `${scope}`,
      redirect_uri: `${rasProps.rasRedirectURI}`,
    });

    const getRASToken = await I.sendPostRequest(
      rasProps.rasTokenEndpoint,
      data,
      {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    );

    const accessToken = getRASToken.data.access_token;
    const refreshToken = getRASToken.data.refresh_token;
    const idToken = getRASToken.data.id_token;

    return { accessToken, refreshToken, idToken };
  },

  async getPassport(token) {
    // GET /openid/connect/v1.1/userinfo passport for the RAS user with RAS Access token
    console.log('### Getting Passport from Access Token');
    const getPassportReq = await I.sendGetRequest(
      rasProps.userInfoEndpoint,
      {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    );
    // you should get a passport with visa as the response
    const passportBody = getPassportReq.data.passport_jwt_v11;
    // checking the validate scope of passport
    rasQuestions.hasScope(passportBody);
    if (rasQuestions.hasScope(passportBody)) {
      console.log('### The scope for Passport is correct');
    }
    return passportBody;
  },

  async getTokenFromRefreshToken(refreshToken, clientID, secretID, scope) {
    console.log('### Getting Access Token from Refresh Token');
    const refreshData = queryString.stringify({
      grant_type: 'refresh_token',
      refresh_token: `${refreshToken}`,
      scope: `${scope}`,
      client_id: `${clientID}`,
      client_secret: `${secretID}`,
    });
    const tokenFromRefresh = await I.sendPostRequest(
      rasProps.rasTokenEndpoint,
      refreshData,
      {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    );
    const refreshedAccessToken = tokenFromRefresh.data.access_token;

    return refreshedAccessToken;
  },
};
