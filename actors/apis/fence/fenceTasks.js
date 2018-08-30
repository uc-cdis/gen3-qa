const fenceProps = require('./fenceProps.js');
const users_helper = require('../../users_helper.js');
const portal_helper = require('../../portal/portal_helper.js');
const google_helper = require('../../google_helper.js');

const container = require('codeceptjs').container;

const I = actor();

async function onChooseAcctPage() {
  return new Promise((resolve) => {
    const wdio = container.helpers('WebDriverIO');
    wdio._locate(fenceProps.googleLogin.useAnotherAcctBtn.locator.xpath).then((res) => { // eslint-disable-line
      resolve(res.value.length > 0);
    });
  });
}

async function loginGoogle(googleCreds) {
  I.say('Logging in to Google...');
  await portal_helper.seeProp(fenceProps.googleLogin.readyCue, 10);

  // if shown option to choose account, just click the choose acct button
  const acctLoaded = await onChooseAcctPage();
  if (acctLoaded) {
    portal_helper.clickProp(fenceProps.googleLogin.useAnotherAcctBtn);
  }

  // fill out username and password
  I.fillField(fenceProps.googleLogin.emailField.locator, googleCreds.email);
  portal_helper.clickProp(fenceProps.googleLogin.emailNext);
  portal_helper.seeProp(fenceProps.googleLogin.passwordReadyCue, 10);
  I.wait(5);
  I.fillField(fenceProps.googleLogin.passwordField.locator, googleCreds.password);
  portal_helper.clickProp(fenceProps.googleLogin.passwordNext);
}

/**
 * fence Tasks
 */
module.exports = {
  createSignedUrl(id, args = []) {
    return I.sendGetRequest(
      `${fenceProps.endpoints.getFile}/${id}?${args.join('&')}`.replace(
        /[?]$/g,
        '',
      ),
      users_helper.mainAcct.accessTokenHeader,
    ).then(res => ({ body: res.body, statusCode: res.statusCode }));
  },

  getFile(url) {
    return I.sendGetRequest(url).then(res => res.body);
  },

  createAPIKey(scope, access_token_header) {
    access_token_header['Content-Type'] = 'application/json';
    return I.sendPostRequest(
      fenceProps.endpoints.createAPIKey,
      JSON.stringify({
        scope,
      }),
      access_token_header,
    ).then(res => ({ body: res.body, statusCode: res.statusCode }));
  },

  deleteAPIKey(api_key) {
    return I.sendDeleteRequest(
      `${fenceProps.endpoints.deleteAPIKey}/${api_key}`,
      users_helper.mainAcct.accessTokenHeader,
    ).then(res => res.body);
  },

  getAccessToken(api_key) {
    const data = api_key !== null ? { api_key } : {};
    return I.sendPostRequest(
      fenceProps.endpoints.getAccessToken,
      JSON.stringify(data),
      users_helper.validIndexAuthHeader,
    ).then(res => ({ body: res.body, statusCode: res.statusCode }));
  },

  async linkGoogleAcct(userAcct, acctWithGoogleCreds) {
    const googleCreds = acctWithGoogleCreds.googleCreds;
    // set users access token
    await I.setCookie({ name: 'access_token', value: userAcct.accessToken });
    await I.seeCookie('access_token');
    // visit link endpoint and login to google
    await I.amOnPage(fenceProps.endpoints.linkGoogle);
    await loginGoogle(googleCreds);

    // wait until redirected back to root url
    await I.waitInUrl(fenceProps.endpoints.root, 5);
    I.wait(5);

    // return the body and the current url
    const url = await I.grabCurrentUrl();
    const body = await I.grabSource();
    // FIXME: Why is access_token not there anymore??
    // I.seeCookie('access_token');
    let access_token;
    try {
      access_token = await I.grabCookie('access_token');
    } catch (e) {
      console.log(e);
    }
    console.log('ACCESS_TOKEN', access_token);
    return {
      body,
      url,
    };
  },

  async unlinkGoogleAcct(userAcct) {
    return I.sendDeleteRequest(
      fenceProps.endpoints.deleteGoogleLink,
      userAcct.accessTokenHeader,
    ).then(res => ({
      body: res.body,
      statusCode: res.statusCode,
    }));
  },

  async extendGoogleLink(userAcct) {
    return I.sendPatchRequest(
      fenceProps.endpoints.extendGoogleLink, {}, userAcct.accessTokenHeader)
      .then(res => ({ statusCode: res.statusCode, body: res.body }));
  },

  async getProjectMembers(someProject) {
    return google_helper.getProjectMembers(someProject);
  },
};
