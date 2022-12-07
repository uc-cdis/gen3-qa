/*eslint-disable */
const { container } = require('codeceptjs');
const chai = require('chai');
const ax = require('axios'); // eslint-disable-line import/no-extraneous-dependencies

const fenceProps = require('./fenceProps.js');
const user = require('../../../utils/user.js');
const portal = require('../../../utils/portal.js');
const { Gen3Response, sleepMS, getCookie, getAccessTokenHeader } = require('../../../utils/apiUtil');
const { Bash, takeLastLine } = require('../../../utils/bash');

const bash = new Bash();
const { expect } = chai;

const I = actor();

async function getNoRedirect(url, headers) {
  //
  // axios follows redirects by default, so do things this way
  // to stop that.
  // Note: if codecept changes its freakin REST library again,
  //    then just use axios directly
  //
  return ax.request(
    {
      url,
      baseURL: `https://${process.env.HOSTNAME}`,
      method: 'get',
      maxRedirects: 0,
      headers,
    },
  ).then(
    (resp) => resp,
    (err) => err.response || err,
  );
}

/**
 * fence Tasks
 */
module.exports = {

  async getVersion() {
    const response = await I.sendGetRequest(fenceProps.endpoints.version);
    expect(response, 'Can\'t get Fence version').to.have.property('status', 200);
    expect(response, 'No data in response').to.have.property('data');
    expect(response.data, 'No version in JSON response').to.have.property('version');
    return response.data.version;
  },

  /**
   * Hits fence's signed url endpoint
   * @param {string} id - id/did of an indexd file
   * @param {string[]} args - additional args for endpoint
   * @returns {Promise<Gen3Response>}
   */
  async createSignedUrl(id, args = [], userHeader = user.mainAcct.accessTokenHeader) {
    return I.sendGetRequest(
      `${fenceProps.endpoints.getFile}/${id}?${args.join('&')}`.replace(
        /[?]$/g,
        '',
      ),
      userHeader,
    ).then((res) => new Gen3Response(res)); // ({ body: res.body, statusCode: res.statusCode }));
  },

  /**
   * Hits fence's signed url endpoint
   * @param {string} id - id/did of an indexd file
   * @param {string[]} userHeader - a user's access token header
   * @returns {Promise<Gen3Response>}
   */
  async createSignedUrlForUser(id, userHeader = user.mainAcct.accessTokenHeader, nAttempts = 3) {
    let preSignedURL = '';
    for (let i = 0; i < nAttempts; i += 1) {
      preSignedURL = await I.sendGetRequest(
        `${fenceProps.endpoints.getFile}/${id}`,
        userHeader,
      ).then((res) => new Gen3Response(res));

      if (preSignedURL.status === 503) {
        if (i === nAttempts - 1) {
          throw new Error(`Max number of PreSignedURL attempts reached: ${i}`);
        }
        console.log(`PreSigned URL request failed (503 response) on attempt ${i}. Trying again...`);
        await sleepMS(3000);
      } else {
	console.log(`PreSigned URL request returned http code [${preSignedURL.status}] on attempt ${i}.`);
        break;
      }
    }
    return preSignedURL;
  },

  /**
   * Fetch signed URL contents
   * @param {string} url - url for the file
   * @returns {string | Object} response.data - file contents
   */
  async getFile(url) {
    return I.sendGetRequest(url).then((res) => res.data);
  },

  async getFileFromSignedUrlRes(signedUrlRes) {
    if (
      signedUrlRes
      && signedUrlRes.body
      && signedUrlRes.body.url
    ) {
      // Note: google freaks out if unexpected headers
      //     are passed with signed url requests
      if (process.env.DEBUG === 'true') {
        console.log(`Fetching signed URL: ${signedUrlRes.body.url}`);
      }
      return ax.get(signedUrlRes.body.url).then(
        (resp) => resp.data,
        (err) => err.response.data || err,
      );
    }
    if (process.env.DEBUG === 'true') {
      console.log(fenceProps.FILE_FROM_URL_ERROR, signedUrlRes);
    }
    return fenceProps.FILE_FROM_URL_ERROR;
  },

  /**
   * Hits fence's endoint to create an api, given an access token
   * @param {string[]} scope - scope of the access token
   * @param {Object} accessTokenHeader
   * @returns {Promise<Gen3Response>}
   */
  async createAPIKey(scope, accessTokenHeader) {
    return I.sendPostRequest(
      fenceProps.endpoints.createAPIKey,
      {
        scope,
      },
      accessTokenHeader,
    ).then((res) => new Gen3Response(res));
  },

  /**
   * List the existing Google credentials for the user
   * @param {Object} accessTokenHeader
   */
  async getUserGoogleCreds(accessTokenHeader) {
    return I.sendGetRequest(
      fenceProps.endpoints.googleCredentials,
      accessTokenHeader,
    ).then((res) => {
      if (!res.data || !res.data.access_keys) {
        if (process.env.DEBUG === 'true') {
          console.log('Could not get user google creds:');
          console.log(res);
        }
        return { access_keys: [] };
      }
      return res.data;
    });
  },

  /**
   * Hits fence's endoint to create a temp Google credentials
   * @param {Object} accessTokenHeader
   * @param {int} expires_in - requested expiration time (in seconds)
   * @returns {Promise<Gen3Response>}
   */
  async createTempGoogleCreds(accessTokenHeader, expiresIn = null) {
    let url = fenceProps.endpoints.googleCredentials;
    if (expiresIn) {
      url += `?expires_in=${expiresIn}`;
    }
    return I.sendPostRequest(
      url,
      {},
      accessTokenHeader,
    ).then((res) => {
      const g3res = new Gen3Response(res);
      if (g3res.status !== 200) {
        console.error('Error creating temp google creds');
        if (process.env.DEBUG === 'true') {
          console.log(res);
        }
      }
      return g3res;
    });
  },

  /**
   * Hits fence's endoint to delete temp Google credentials
   * @param {string} googleKeyId
   * @param {Object} accessTokenHeader
   * @returns {Promise<Gen3Response>}
   */
  async deleteTempGoogleCreds(googleKeyId, accessTokenHeader) {
    return I.sendDeleteRequest(
      `${fenceProps.endpoints.googleCredentials}${googleKeyId}`,
      accessTokenHeader,
    ).then((res) => new Gen3Response(res));
  },

  /**
   * Deletes a given API Key
   * @param {string} apiKey
   * @returns {Promise<Object>}
   */
  async deleteAPIKey(apiKey) {
    return I.sendDeleteRequest(
      `${fenceProps.endpoints.deleteAPIKey}/${apiKey}`,
      user.mainAcct.accessTokenHeader,
    ).then((res) => res.data);
  },

  /**
   * Requests an access token given an api key
   * @param {string} apiKey
   * @returns {Promise<Gen3Response>}
   */
  async getAccessToken(apiKey) {
    const data = apiKey !== null ? { api_key: apiKey } : {};
    return I.sendPostRequest(
      fenceProps.endpoints.getAccessToken,
      data,
      { 'Content-Type': 'application/json' },
    ).then((res) => new Gen3Response(res));
  },

  async getAccessTokenWithClientCredentials(clientID, secretID, expectSuccess=true) {
    const tokenReq = bash.runCommand(`curl --user "${clientID}:${secretID}" --request POST "https://${process.env.HOSTNAME}/user/oauth2/token?grant_type=client_credentials" -d scope="openid user"`);
    if (process.env.DEBUG === 'true') {
      console.log(`getAccessTokenWithClientCredentials token response: ${tokenReq}`);
    }
    const tokens = JSON.parse(tokenReq);
    if (expectSuccess) {
      expect(tokens, `Cannot get access token: ${tokenReq}`).to.have.property('access_token');
    }
    else {
      expect(tokens, 'Should not have been able to get access token').not.to.have.property('access_token');
    }
    const accessToken = tokens.access_token;
    if (process.env.DEBUG === 'true') {
      console.log(`getAccessTokenWithClientCredentials accessToken: ${accessToken}`);
    }
    return accessToken;
  },

  /**
   * Goes through the full, proper process for linking a google account assuming env
   * is set to mock Google response
   * @param {User} userAcct - commons account to link with
   * @param {int} expires_in - requested expiration time (in seconds)
   * @returns {Promise<Gen3Response|*>}
   */
  async linkGoogleAcctMocked(userAcct, expiresIn = null) {
    // visit link endpoint. Google login is mocked
    const headers = userAcct.accessTokenHeader;
    headers.Cookie = `dev_login=${userAcct.username}`;
    let url = '/user/link/google?redirect=/login';
    if (expiresIn) {
      url += `&expires_in=${expiresIn}`;
    }

    let res = await getNoRedirect(url, headers);
    // if no error, follow redirect back to fence
    if (res && res.headers.location && !res.headers.location.includes('error=')) {
      const sessionCookie = getCookie('fence', res.headers['set-cookie']);
      headers.Cookie += `; fence=${sessionCookie}`;
      res = await getNoRedirect(res.headers.location, headers);
    }

    // return the body and the current url
    url = res.headers.location;
    const gen3Res = new Gen3Response(res);
    gen3Res.parsedFenceError = undefined;
    // gen3Res.body = body;
    gen3Res.status = 200;
    gen3Res.finalURL = url;
    return gen3Res;
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
  async extendGoogleLink(userAcct, expiresIn = null) {
    let url = fenceProps.endpoints.extendGoogleLink;
    if (expiresIn) {
      url += `?expires_in=${expiresIn}`;
    }
    return I.sendPatchRequest(
      url, {}, userAcct.accessTokenHeader,
    )
      .then((res) => new Gen3Response(res));
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

  async registerGoogleServiceAccount(
    userAcct, googleProject, projectAccessList, expiresIn = null, isDryRun = false,
  ) {
    let url = fenceProps.endpoints.registerGoogleServiceAccount;
    if (isDryRun) url += '/_dry_run';
    if (expiresIn) {
      url += `?expires_in=${expiresIn}`;
    }
    const MAX_TRIES = 3;
    let tries = 1;
    while (tries <= MAX_TRIES) {
      const postRes = await I.sendPostRequest(
        url,
        {
          service_account_email: googleProject.serviceAccountEmail,
          google_project_id: googleProject.id,
          project_access: projectAccessList,
        },
        userAcct.accessTokenHeader,
      ).then((res) => {
        if (res.data && res.data.errors) {
          console.log('Failed SA registration:');
          // stringify to print all the nested objects
          if (process.env.DEBUG === 'true') {
            console.log(JSON.stringify(res.data.errors, null, 2));
          }
        } else if (res.error) {
          if (res.error.code === 'ETIMEDOUT') {
            return 'ETIMEDOUT: Google SA registration timed out';
          }
          if (res.error.code === 'ECONNRESET') {
            return 'ECONNRESET: Google SA registration socket hung up';
          }

          console.log('Failed SA registration:');
          if (process.env.DEBUG === 'true') {
            console.log(res.error);
          }
        }
        return new Gen3Response(res);
      });

      // if request timeout or socket hung up: retry
      if (typeof postRes === 'string'
      && (postRes.includes('ETIMEDOUT') || postRes.includes('ECONNRESET'))) {
        console.log(`registerGoogleServiceAccount: try ${tries}/${MAX_TRIES}`);
        if (process.env.DEBUG === 'true') {
          console.log(postRes);
        }
        tries += 1;
      } else {
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
    ).then((res) => new Gen3Response(res));
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
    ).then((res) => new Gen3Response(res));
  },

  /**
   * Updates a google service account
   * @param {User} userAcct - User to make request with
   * @param {string} serviceAccountEmail - email of service account to update
   * @param {string[]} projectAccessList - list of project names to set for service account's access
   * @returns {Promise<Gen3Response>}
   */
  async updateGoogleServiceAccount(
    userAcct, serviceAccountEmail, projectAccessList, isDryRun = false,
  ) {
    let url = fenceProps.endpoints.updateGoogleServiceAccount;
    if (isDryRun) url += '/_dry_run';
    return I.sendPatchRequest(
      `${url}/${serviceAccountEmail}`,
      {
        project_access: projectAccessList,
      },
      userAcct.accessTokenHeader,
    ).then((res) => new Gen3Response(res));
  },

  /**
   * Get GCP Billing Projects
   * @param {User} userAcct - User to make request with
   * @returns {Promise<Gen3Response>}
   */
  async getGoogleBillingProjects(userAcct) {
    return I.sendGetRequest(
      fenceProps.endpoints.getGoogleBillingProjects,
      userAcct.accessTokenHeader,
    ).then((res) => new Gen3Response(res));
  },

  /**
   * Gets the ID of the monitor account (fence-service account)
   * @param {User} userAcct - User to make request with
   * @returns {Promise<Gen3Response>}
   */
  async getGoogleSvcAcctMonitor(userAcct) {
    return I.sendGetRequest(
      fenceProps.endpoints.getGoogleSvcAcctMonitor,
      userAcct.accessTokenHeader,
    ).then((res) => new Gen3Response(res));
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
  async getConsentCode(clientId, responseType, scope, consent = 'ok', expectCode = true) {
    const fullURL = `https://${process.env.HOSTNAME}${fenceProps.endpoints.authorizeOAuth2Client}?response_type=${responseType}&client_id=${clientId}&redirect_uri=https://${process.env.HOSTNAME}&scope=${scope}`;
    if (process.env.DEBUG === 'true') {
      console.log(fullURL);
    }
    I.amOnPage(fullURL);
    if (process.env.DEBUG === 'true') {
      I.saveScreenshot('getConsentCode.png');
    }
    if (expectCode) {
      // if (I.seeElement(fenceProps.consentPage.consentBtn.locator)) {
        if (consent === 'cancel') {
          portal.clickProp(fenceProps.consentPage.cancelBtn);
        } else {
          portal.clickProp(fenceProps.consentPage.consentBtn);
          I.waitInUrl('code=', 30);
        }
      // }
    } else {
      I.seeTextEquals('Unauthorized', 'h2');
    }
    // I.saveScreenshot('consent_auth_code_flow.png');
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
    const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
    const response = await I.sendPostRequest(fullURL, data,
      {
        'Content-Type': 'application/json',
        Authorization: `Basic ${auth}`,
      });
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
    const response = await I.sendPostRequest(fullURL, data,
      { 'Content-Type': 'application/json' });
    return response;
  },

  /**
   * Hits fences /authorize endpoint for implicit flow
   * @param {string} clientId - client id
   * @param {string} responseType - response type
   * @param {string} scope - scope
   * @returns {string}
   */
  async getTokensImplicitFlow(clientId, responseType, scope, consent = 'yes', expectToken = true) {
    const fullURL = `https://${process.env.HOSTNAME}${fenceProps.endpoints.authorizeOAuth2Client}?response_type=${responseType}&client_id=${clientId}&redirect_uri=https://${process.env.HOSTNAME}&scope=${scope}&nonce=n-0S6_WzA2Mj`;
    if (process.env.DEBUG === 'true') {
      console.log(fullURL);
    }
    I.amOnPage(fullURL);
    if (process.env.DEBUG === 'true') {
      I.saveScreenshot('getTokensImplicitFlow.png');
    }
    if (expectToken) {
      if (I.seeElement(fenceProps.consentPage.consentBtn.locator)) {
        if (consent === 'cancel') {
          portal.clickProp(fenceProps.consentPage.cancelBtn);
        } else {
          portal.clickProp(fenceProps.consentPage.consentBtn);
          I.waitInUrl('token=', 3);
        }
        // I.saveScreenshot('consent_implicit_flow.png');
      }
    } else {
      I.seeTextEquals('Unauthorized', 'h2');
    }

    const urlStr = await I.grabCurrentUrl();
    return urlStr;
  },

  /**
   * Hits fences /user endpoint
   * @param {string} accessToken - access token
   */
  async getUserInfo(accessToken) {
    const header = getAccessTokenHeader(accessToken);
    const response = await I.sendGetRequest(fenceProps.endpoints.userEndPoint, header);
    return response;
  },

  /**
   * Hits fences /admin endpoint
   * @param {string} accessToken - access token
   */
  async getAdminInfo(accessToken) {
    const header = getAccessTokenHeader(accessToken);
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
    return I.sendPostRequest(
      fenceProps.endpoints.uploadFile,
      {
        file_name: fileName,
      },
      accessHeader,
    ).then((res) => new Gen3Response(res));
  },

  /**
   * Hits fence's signed url for data upload endpoint
   * @param {string} guid - guid of the file that will be written to
   * @param {string} accessToken - access token
   * @returns {Promise<Gen3Response>}
   */
  async getUploadUrlForExistingFile(guid, accessHeader) {
    return I.sendGetRequest(
      `${fenceProps.endpoints.uploadFile}/${guid}`,
      accessHeader,
    ).then((res) => new Gen3Response(res));
  },

  /**
   * Hits fence's multipart upload initialization endpoint
   * @param {string} fileName - name of the file that will be uploaded
   * @param {string} accessToken - access token
   * @returns {Promise<Gen3Response>}
   */
  async initMultipartUpload(fileName, accessHeader) {
    return I.sendPostRequest(
      fenceProps.endpoints.multipartUploadInit,
      {
        file_name: fileName,
      },
      accessHeader,
    ).then((res) => new Gen3Response(res));
  },

  /**
   * Hits fence's signed url for multipart upload endpoint
   * @param {string} key - object's key in format "GUID/filename"
   *                       (GUID as returned by initMultipartUpload)
   * @param {string} uploadId - object's uploadId (as returned by initMultipartUpload)
   * @param {string} partNumber - upload part number, starting from 1
   * @param {string} accessToken - access token
   * @returns {Promise<Gen3Response>}
   */
  async getUrlForMultipartUpload(key, uploadId, partNumber, accessHeader) {
    return I.sendPostRequest(
      fenceProps.endpoints.multipartUpload,
      {
        key,
        uploadId,
        partNumber,
      },
      accessHeader,
    ).then((res) => new Gen3Response(res));
  },

  /**
   * Hits fence's multipart upload completion endpoint
   * @param {string} key - object's key in format "GUID/filename"
   *                       (GUID as returned by initMultipartUpload)
   * @param {string} uploadId - object's uploadId (as returned by initMultipartUpload)
   * @param {string} parts - list of {partNumber, ETag} objects
   *                         (as returned when uploading using the URL
   *                         returned by getUrlForMultipartUpload)
   * @param {string} accessToken - access token
   * @returns {Promise<Gen3Response>}
   */
  async completeMultipartUpload(key, uploadId, parts, accessHeader) {
    return I.sendPostRequest(
      fenceProps.endpoints.multipartUploadComplete,
      {
        key,
        uploadId,
        parts,
      },
      accessHeader,
    ).then((res) => new Gen3Response(res));
  },

  /**
   * Delete a file from indexd and S3
   * @param {string} guid - GUID of the file to delete
   */
  async deleteFile(guid, userHeader = user.mainAcct.accessTokenHeader) {
    return I.sendDeleteRequest(
      `${fenceProps.endpoints.deleteFile}/${guid}`,
      userHeader,
    ).then((res) => new Gen3Response(res));
  },
};
