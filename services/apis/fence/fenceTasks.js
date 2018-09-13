const fenceProps = require('./fenceProps.js');
const usersUtil = require('../../../utils/usersUtil.js');
const portalUtil = require('../../../utils/portalUtil.js');
const commonsUtil = require('../../../utils/commonsUtil.js');
const { Gen3Response } = require('../../../utils/apiUtil');

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
  await portalUtil.seeProp(fenceProps.googleLogin.readyCue, 10);
  I.saveScreenshot('login1.png');

  // if shown option to choose account, just click the choose acct button
  const acctLoaded = await onChooseAcctPage();
  if (acctLoaded) {
    portalUtil.clickProp(fenceProps.googleLogin.useAnotherAcctBtn);
  }

  // fill out username and password
  portalUtil.waitForVisibleProp(fenceProps.googleLogin.emailField, 5);
  I.retry({ retries: 3, minTimeout: 2000 })
    .fillField(fenceProps.googleLogin.emailField.locator, googleCreds.email);
  I.saveScreenshot('login2.png');
  portalUtil.clickProp(fenceProps.googleLogin.emailNext);
  I.saveScreenshot('login3.png');
  portalUtil.waitForVisibleProp(fenceProps.googleLogin.passwordField, 5);
  I.saveScreenshot('login4.png');
  I.retry({ retries: 3, minTimeout: 2000 })
    .fillField(fenceProps.googleLogin.passwordField.locator, googleCreds.password);
  I.saveScreenshot('login5.png');
  portalUtil.clickProp(fenceProps.googleLogin.passwordNext);
  I.saveScreenshot('login6.png');
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
      usersUtil.mainAcct.accessTokenHeader,
    ).then(res => new Gen3Response(res)); // ({ body: res.body, statusCode: res.statusCode }));
  },

  getFile(url) {
    return I.sendGetRequest(url).then(res => res.body);
  },

  createAPIKey(scope, accessTokenHeader) {
    accessTokenHeader['Content-Type'] = 'application/json';
    return I.sendPostRequest(
      fenceProps.endpoints.createAPIKey,
      JSON.stringify({
        scope,
      }),
      accessTokenHeader,
    ).then(res => new Gen3Response(res)); // ({ body: res.body, statusCode: res.statusCode }));
  },

  deleteAPIKey(apiKey) {
    return I.sendDeleteRequest(
      `${fenceProps.endpoints.deleteAPIKey}/${apiKey}`,
      usersUtil.mainAcct.accessTokenHeader,
    ).then(res => res.body);
  },

  getAccessToken(apiKey) {
    const data = apiKey !== null ? { api_key: apiKey } : {};
    return I.sendPostRequest(
      fenceProps.endpoints.getAccessToken,
      data,
    ).then(res => new Gen3Response(res));
  },

  async linkGoogleAcct(userAcct, acctWithGoogleCreds) {
    const googleCreds = acctWithGoogleCreds.googleCreds;
    // set users access token
    await I.setCookie({ name: 'access_token', value: userAcct.accessToken });
    await I.seeCookie('access_token');
    // visit link endpoint and login to google
    await I.amOnPage(fenceProps.endpoints.linkGoogle);
    await loginGoogle(googleCreds);
    I.saveScreenshot('login7.png');

    // wait until redirected back to root url
    await I.waitInUrl(fenceProps.endpoints.root, 5);
    I.wait(5);

    // return the body and the current url
    const url = await I.grabCurrentUrl();
    const body = await I.grabSource();
    // FIXME: Why is accessToken not there anymore??
    // I.seeCookie('accessToken');
    const res = new Gen3Response({ body });
    res.finalURL = url;
    return res;
  },

  async forceLinkGoogleAcct(userAcct, acctWithGoogleCreds) {
    // hit link endpoint to ensure a proxy group is created for user
    I.sendGetRequest(fenceProps.endpoints.linkGoogle, userAcct.accessTokenHeader);

    // run fence-create command to circumvent google and add user link to fence
    const cmd = `g3kubectl exec $(gen3 pod fence ${process.env.NAMESPACE}) -- fence-create force-link-google --username ${userAcct.username} --google-email ${acctWithGoogleCreds.googleCreds.email}`;
    const res = commonsUtil.runCommand(cmd, process.env.NAMESPACE);
    console.log('Forced link res: ', res);
    return res;
  },

  async unlinkGoogleAcct(userAcct) {
    return I.sendDeleteRequest(
      fenceProps.endpoints.deleteGoogleLink,
      userAcct.accessTokenHeader,
    ).then(res => new Gen3Response(res));
  },

  async extendGoogleLink(userAcct) {
    return I.sendPatchRequest(
      fenceProps.endpoints.extendGoogleLink, {}, userAcct.accessTokenHeader)
      .then(res => new Gen3Response(res));
  },
};
