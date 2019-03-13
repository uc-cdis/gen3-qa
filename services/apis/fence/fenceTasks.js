const fenceProps = require('./fenceProps.js');
const user = require('../../../utils/user.js');
const portal = require('../../../utils/portal.js');
const { Gen3Response, getCookie } = require('../../../utils/apiUtil');
const { Bash, takeLastLine } = require('../../../utils/bash');

const { container } = require('codeceptjs');
const bash = new Bash();

const I = actor();

/**
 * Determines if browser is on Google's "Choose account" page
 * @returns {Promise<boolean>}
 */
async function onChooseAcctPage() {
  return new Promise((resolve) => {
    const wdio = container.helpers('WebDriverIO');
    wdio._locate(fenceProps.googleLogin.useAnotherAcctBtn.locator.xpath).then((res) => { // eslint-disable-line
      resolve(res.value.length > 0);
    });
  });
}

/**
 * Determines if browser is on consent page
 * @returns {Promise<boolean>}
 */
async function onConsentPage() {
  return new Promise((resolve) => {
    const wdio = container.helpers('WebDriverIO');
    wdio._locate(fenceProps.consentPage.consentBtn.locator.xpath).then((res) => { // eslint-disable-line
      resolve(res.value.length > 0);
    });
  });
}

/**
 * Goes through google oauth flow in the browser (saving screenshots along the way)
 * @param {Object} googleCreds - google credentials (email and password)
 * @returns {Promise<void>}
 */
async function loginGoogle(googleCreds) {
  I.say('Logging in to Google...');
  await portal.seeProp(fenceProps.googleLogin.readyCue, 10);
  I.saveScreenshot('login1.png');

  // if shown option to choose account, just click the choose acct button
  const acctLoaded = await onChooseAcctPage();
  if (acctLoaded) {
    portal.clickProp(fenceProps.googleLogin.useAnotherAcctBtn);
  }

  // fill out username and password
  portal.waitForVisibleProp(fenceProps.googleLogin.emailField, 5);
  I.retry({ retries: 3, minTimeout: 2000 })
    .fillField(fenceProps.googleLogin.emailField.locator, googleCreds.email);
  I.saveScreenshot('login2.png');
  portal.clickProp(fenceProps.googleLogin.emailNext);
  I.saveScreenshot('login3.png');
  portal.waitForVisibleProp(fenceProps.googleLogin.passwordField, 5);
  I.saveScreenshot('login4.png');
  I.retry({ retries: 3, minTimeout: 2000 })
    .fillField(fenceProps.googleLogin.passwordField.locator, googleCreds.password);
  I.saveScreenshot('login5.png');
  portal.clickProp(fenceProps.googleLogin.passwordNext);
  I.saveScreenshot('login6.png');
}

/**
 * fence Tasks
 */
module.exports = {
  /**
   * Hits fence's signed url endpoint
   * @param {string} id - id/did of an indexd file
   * @param {string[]} args - additional args for endpoint
   * @returns {Promise<Gen3Response>}
   */
  createSignedUrl(id, args = []) {
    return I.sendGetRequest(
      `${fenceProps.endpoints.getFile}/${id}?${args.join('&')}`.replace(
        /[?]$/g,
        '',
      ),
      user.mainAcct.accessTokenHeader,
    ).then(res => new Gen3Response(res)); // ({ body: res.body, statusCode: res.statusCode }));
  },

  /**
   * Hits fence's signed url endpoint
   * @param {string} id - id/did of an indexd file
   * @param {string[]} userHeader - a user's access token header
   * @returns {Promise<Gen3Response>}
   */
  createSignedUrlForUser(id, userHeader=user.mainAcct.accessTokenHeader) {
    return I.sendGetRequest(
      `${fenceProps.endpoints.getFile}/${id}`,
      userHeader,
    ).then(res => new Gen3Response(res));
  },

  /**
   * Fetch signed URL contents
   * @param {string} url - url for the file
   * @returns {string | Object} response.body - file contents
   */
  getFile(url) {
    return I.sendGetRequest(url).then(res => res.body);
  },

  /**
   * Hits fence's endoint to create an api, given an access token
   * @param {string[]} scope - scope of the access token
   * @param {Object} accessTokenHeader
   * @returns {Promise<Gen3Response>}
   */
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

  /**
   * Hits fence's endoint to create a temp Google credentials
   * @param {Object} accessTokenHeader
   * @param {int} expires_in - requested expiration time (in seconds)
   * @returns {Promise<Gen3Response>}
   */
  createTempGoogleCreds(accessTokenHeader, expires_in=null) {
    accessTokenHeader['Content-Type'] = 'application/json';
    url = fenceProps.endpoints.googleCredentials;
    if (expires_in)
      url += `?expires_in=${expires_in}`;
    return I.sendPostRequest(
      url,
      {},
      accessTokenHeader,
    ).then(res => new Gen3Response(res)); // ({ body: res.body, statusCode: res.statusCode }));
  },

  /**
   * Hits fence's endoint to delete temp Google credentials
   * @param {string} googleKeyId
   * @param {Object} accessTokenHeader
   * @returns {Promise<Gen3Response>}
   */
  deleteTempGoogleCreds(googleKeyId, accessTokenHeader) {
    accessTokenHeader['Content-Type'] = 'application/json';
    return I.sendDeleteRequest(
      `${fenceProps.endpoints.googleCredentials}${googleKeyId}`,
      accessTokenHeader,
    ).then(res => new Gen3Response(res));
  },

  /**
   * TODO
   */
  getUserGoogleCreds(accessTokenHeader) {
    accessTokenHeader['Content-Type'] = 'application/json';
    return I.sendGetRequest(
      fenceProps.endpoints.googleCredentials,
      accessTokenHeader,
    ).then(res => res.body);
  },

  /**
   * Deletes a given API Key
   * @param {string} apiKey
   * @returns {Promise<Object>}
   */
  deleteAPIKey(apiKey) {
    return I.sendDeleteRequest(
      `${fenceProps.endpoints.deleteAPIKey}/${apiKey}`,
      user.mainAcct.accessTokenHeader,
    ).then(res => res.body);
  },

  /**
   * Requests an access token given an api key
   * @param {string} apiKey
   * @returns {Promise<Gen3Response>}
   */
  getAccessToken(apiKey) {
    const data = apiKey !== null ? { api_key: apiKey } : {};
    return I.sendPostRequest(
      fenceProps.endpoints.getAccessToken,
      data,
    ).then(res => new Gen3Response(res));
  },

  /**
   * Goes through the full, proper process for linking a google account assuming env
   * is set to mock Google response
   * @param userAcct
   * @returns {Promise<Gen3Response|*>}
   */
  async linkGoogleAcctMocked(userAcct) {
    // visit link endpoint. Google login is mocked
    let headers = userAcct.accessTokenHeader
    headers.Cookie = 'dev_login=' + userAcct.username
    let response = undefined;

    return I.sendGetRequest(
      '/user/link/google?redirect=/login', headers
    ).then((res) => {
      // follow redirect back to fence
      let sessionCookie = getCookie('fence', res.headers['set-cookie'])
      headers = {Cookie: 'dev_login=' + userAcct.username + ';' + 'fence=' + sessionCookie }
      return I.sendGetRequest(res.headers.location, headers).then((res) => {
        return I.sendGetRequest(res.headers.location, headers).then((res) => {
          // return the body and the current url
          const url = res.headers.location;
          const body = res.body;

          const gen3Res = new Gen3Response({ body });
          gen3Res.parsedFenceError = undefined;
          gen3Res.body = body;
          gen3Res.statusCode = 200;
          gen3Res.finalURL = url;
          return gen3Res
        });
      });
    });
  },

  /**
   * Hits fences DELETE google link endpont
   * @param {User} userAcct - User to delete the link for
   * @returns {Promise<Gen3Response>}
   */
  async unlinkGoogleAcct(userAcct) {
    return I.sendDeleteRequest(
      fenceProps.endpoints.deleteGoogleLink,
      userAcct.accessTokenHeader,
    ).then((res) => {
      delete userAcct.linkedGoogleAccount;
      return new Gen3Response(res);
    });
  },

  /**
   * Hits fences EXTEND google link endpoint
   * @param {User} userAcct - commons user to extend the link for
   * @param {int} expires_in - requested expiration time (in seconds)
   * @returns {Promise<Gen3Response>}
   */
  async extendGoogleLink(userAcct, expires_in=null) {
    url = fenceProps.endpoints.extendGoogleLink;
    if (expires_in)
      url += `?expires_in=${expires_in}`;
    return I.sendPatchRequest(
      url, {}, userAcct.accessTokenHeader)
      .then(res => new Gen3Response(res));
  },

  /**
   * WARNING: circumvents google authentication (ie not like true linking process)
   * Updates fence databases to link an account to a google email
   * @param {User} userAcct - Commons User to link with
   * @param {string} googleEmail - email to link to
   * @returns {Promise<string>} - std out from the fence-create script
   */
  async forceLinkGoogleAcct(userAcct, googleEmail) {
    // hit link endpoint to ensure a proxy group is created for user
    await I.sendGetRequest(fenceProps.endpoints.linkGoogle, userAcct.accessTokenHeader);

     // run fence-create command to circumvent google and add user link to fence
    const cmd = `fence-create force-link-google --username ${userAcct.username} --google-email ${googleEmail}`;
    const res = bash.runCommand(cmd, 'fence', takeLastLine);
    userAcct.linkedGoogleAccount = googleEmail;
    return res;
  },

  /**
   * Registers a new service account
   * @param {User} userAcct - User to make request with
   * @param {Object} googleProject
   * @param {string} googleProject.serviceAccountEmail - service account email to register
   * @param {string} googleProject.id - google project ID for the service account registering
   * @param {string[]} projectAccessList - projects service account will have access to
   * @param {int} expires_in - requested expiration time (in seconds)
   * @returns {Promise<Gen3Response>}
   */
  async registerGoogleServiceAccount(userAcct, googleProject, projectAccessList, expires_in=null) {
    url = fenceProps.endpoints.registerGoogleServiceAccount;
    if (expires_in)
      url += `?expires_in=${expires_in}`;

    const MAX_TRIES = 3;
    let tries = 1;
    let postRes;
    while (tries <= MAX_TRIES) {
      postRes = await I.sendPostRequest(
        url,
        {
          service_account_email: googleProject.serviceAccountEmail,
          google_project_id: googleProject.id,
          project_access: projectAccessList,
        },
        {
          ...userAcct.accessTokenHeader,
          'Content-Type': 'application/json',
        },
      ).then(function(res) {
        if (res.error && res.error.code == 'ETIMEDOUT') {
          return 'ETIMEDOUT: Google SA registration timed out';
        }
        if (res.body && res.body.errors) {
          console.log('Failed SA registration:');
          console.log(res.body.errors);
        }
        else if (res.error) {
          console.log('Failed SA registration:');
          console.log(res.error);
        }
        return new Gen3Response(res)
      });

      // if the request timed out: retry
      if (typeof postRes == 'string' && postRes.includes('ETIMEDOUT')) {
        console.log(`registerGoogleServiceAccount: try ${tries}/${MAX_TRIES}`);
        console.log(postRes);
        tries++;
      }
      else {
        return postRes;
      }
    }
    return postRes;
  },

  /**
   * Deletes a service account
   * @param {User} userAcct - User to make request with
   * @param {string} serviceAccountEmail - email of service account to delete
   * @returns {Promise<Gen3Response>}
   */
  async deleteGoogleServiceAccount(userAcct, serviceAccountEmail) {
    return I.sendDeleteRequest(
      `${fenceProps.endpoints.deleteGoogleServiceAccount}/${serviceAccountEmail}`,
      userAcct.accessTokenHeader,
    ).then(res => new Gen3Response(res));
  },

  /**
   * Gets service accounts for given google project IDs
   * @param {User} userAcct - User to make request with
   * @param {string[]} googleProjectIDList - google project IDs to get the service accounts of
   * @returns {Promise<Gen3Response>}
   */
  async getGoogleServiceAccounts(userAcct, googleProjectIDList) {
    const formattedIDList = googleProjectIDList.join();
    return I.sendGetRequest(
      `${fenceProps.endpoints.getGoogleServiceAccounts}/?google_project_ids=${formattedIDList}`,
      userAcct.accessTokenHeader,
    ).then(res => new Gen3Response(res));
  },

  /**
   * Gets the fence service account used for monitoring users' Google Cloud Projects
   * @param userAcct
   * @returns {Promise<Gen3Response>}
   */
  async getGoogleServiceAccountMonitor(userAcct) {
    return I.sendGetRequest(
      fenceProps.endpoints.getGoogleServiceAccountMonitor,
      userAcct.accessTokenHeader,
    ).then(res => new Gen3Response(res));
  },

  /**
   * Updates a google service account
   * @param {User} userAcct - User to make request with
   * @param {string} serviceAccountEmail - email of service account to update
   * @param {string[]} projectAccessList - list of project names to set for service account's access
   * @returns {Promise<Gen3Response>}
   */
  async updateGoogleServiceAccount(userAcct, serviceAccountEmail, projectAccessList) {
    return I.sendPatchRequest(
      fenceProps.endpoints.updateGoogleServiceAccount,
      {
        project_access: projectAccessList,
      },
      {
        ...userAcct.accessTokenHeader,
        'Content-Type': 'application/json',
      },
    ).then(res => new Gen3Response(res));
  },

  /**
   * Hits fences EXTEND google link endpoint
   * @param {User} userAcct - commons user to extend the link for
   * @returns {Promise<Gen3Response>}
   * Hits fences /authorize endpoint
   * @param {string} clientId - client id
   * @param {string} responseType - response type
   * @param {string} scope - request scope
   * @param {string} consent - whether to click ok or cancel in consent form
   * @param {boolean} expectCode - true to check for 'code=' in post submit url
   * @returns {string}
   */
  async getConsentCode(clientId, responseType, scope, consent='ok', expectCode=true) {
    const fullURL = `${fenceProps.endpoints.authorizeOAuth2Client}?response_type=${responseType}&client_id=${clientId}&redirect_uri=https://${process.env.HOSTNAME}&scope=${scope}`;
    await I.amOnPage(fullURL);
    const consentPageLoaded = await onConsentPage();
    if (consentPageLoaded) {
      if (consent === 'cancel') {
        portal.clickProp(fenceProps.consentPage.cancelBtn);
      } else {
        portal.clickProp(fenceProps.consentPage.consentBtn);
      }
      I.saveScreenshot('consent_auth_code_flow.png');
    }
    if (expectCode) {
      await I.waitInUrl('code=', 3);
    } else {
      await I.wait(5);
    }
    const urlStr = await I.grabCurrentUrl();
    return urlStr;
  },

  /**
   * Hits fences /token endpoint
   * @param {string} clientId - client id
   * @param {string} clientSecret - client secret
   * @param {string} code - authorization code
   * @param {string} grantType - grant type
   * @returns {Promise<Gen3Response>}
   */
  async getTokensWithAuthCode(clientId, clientSecret, code, grantType) {
    const fullURL = `https://${process.env.HOSTNAME}${fenceProps.endpoints.tokenOAuth2Client}?code=${code}&grant_type=${grantType}&redirect_uri=https%3A%2F%2F${process.env.HOSTNAME}`;
    const data = { client_id: clientId, client_secret: clientSecret };
    const response = await I.sendPostRequest(fullURL, data);
    return response;
  },

  /**
   * Hits fences /token endpoint
   * @param {string} clientId - client id
   * @param {string} clientSecret - client secret
   * @param {string} refreshToken - refresh token
   * @param {string} scope - scope
   * @param {string} grantType - grant type
   * @returns {Promise<Gen3Response>}
   */
  async refreshAccessToken(clientId, clientSecret, refreshToken, scope, grantType) {
    const fullURL = `https://${process.env.HOSTNAME}${fenceProps.endpoints.tokenOAuth2Client}`;
    const data = {
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: grantType,
      scope,
    };
    const response = await I.sendPostRequest(fullURL, data);
    return response;
  },

  /**
   * Hits fences /authorize endpoint for implicit flow
   * @param {string} clientId - client id
   * @param {string} responseType - response type
   * @param {string} scope - scope
   * @returns {string}
   */
  async getTokensImplicitFlow(clientId, responseType, scope, consent='yes', expectToken=true) {
    const fullURL = `https://${process.env.HOSTNAME}${fenceProps.endpoints.authorizeOAuth2Client}?response_type=${responseType}&client_id=${clientId}&redirect_uri=https://${process.env.HOSTNAME}&scope=${scope}&nonce=n-0S6_WzA2Mj`;
    await I.amOnPage(fullURL);
    const consentPageLoaded = await onConsentPage();
    if (consentPageLoaded) {
      if (consent === 'cancel') {
        portal.clickProp(fenceProps.consentPage.cancelBtn);
      } else {
        portal.clickProp(fenceProps.consentPage.consentBtn);
      }
      I.saveScreenshot('consent_implicit_flow.png');
    }
    if (expectToken) {
      await I.waitInUrl('token=', 3);
    } else {
      await I.wait(5);
    }

    const urlStr = await I.grabCurrentUrl();
    return urlStr;
  },

  /**
   * Hits fences /user endpoint
   * @param {string} accessToken - access token
   */
  async getUserInfo(accessToken) {
    const header = {
      Accept: 'application/json',
      Authorization: `bearer ${accessToken}`,
    };
    const response = await I.sendGetRequest(fenceProps.endpoints.userEndPoint, header);
    return response;
  },

  /**
   * Hits fences /admin endpoint
   * @param {string} accessToken - access token
   */
  async getAdminInfo(accessToken) {
    const header = {
      Accept: 'application/json',
      Authorization: `bearer ${accessToken}`,
    };
    const response = await I.sendGetRequest(fenceProps.endpoints.adminEndPoint, header);
    return response;
  },

  /**
   * Hits fence's signed url for data upload endpoint
   * @param {string} fileName - name of the file that will be uploaded
   * @param {string} accessToken - access token
   * @returns {Promise<Gen3Response>}
   */
  async getUrlForDataUpload(fileName, accessHeader) {
    accessHeader['Content-Type'] = 'application/json';
    return I.sendPostRequest(
      fenceProps.endpoints.uploadFile,
      JSON.stringify({
        file_name: fileName,
      }),
      accessHeader,
    ).then(res => new Gen3Response(res));
  },

  /**
   * Delete a file from indexd and S3
   * @param {string} guid - GUID of the file to delete
   */
  async deleteFile(guid, userHeader=user.mainAcct.accessTokenHeader) {
    return I.sendDeleteRequest(
      `${fenceProps.endpoints.deleteFile}/${guid}`,
      userHeader,
    ).then(res => new Gen3Response(res));
  },
};
