/*eslint-disable */
const chai = require('chai');

const { expect } = chai;
chai.config.includeStack = true;
chai.config.truncateThreshold = 0;

const fenceQuestions = require('./fenceQuestions.js');
const fenceTasks = require('./fenceTasks.js');
const fenceProps = require('./fenceProps.js');
const { Gen3Response, sleepMS } = require('../../../utils/apiUtil.js');
const userMod = require('../../../utils/user.js');

const I = actor();

/**
 * fence sequences
 */
module.exports = {
  /**
   * Gets a files contents then asserts their contents are as expected
   * @param {Object} signedUrlRes - result from creating a signed url
   * @param {string} contents - expected file contents
   * @returns {Promise<void>}
   */
  async checkFileEquals(signedUrlRes, contents) {
    fenceQuestions.hasUrl(signedUrlRes);
    const fileContents = await fenceTasks.getFile(signedUrlRes.data.url);
    expect(fileContents).to.equal(contents);
  },

  /**
   * Links a google account then asserts it was successful
   * @param {User} userAcct - commons account to link with
   * @param {int} expires_in - requested expiration time (in seconds)
   * @returns {Promise<Gen3Response>}
   */
  async linkGoogleAcctMocked(userAcct, expires_in = null) {
    const nAttempts = 3;
    for (let i = 0; i < nAttempts; i += 1) {
      try {
        console.log(`linking google account ${userAcct.username} - Attempt #${i}`);
        const linkRes = await fenceTasks.linkGoogleAcctMocked(userAcct, expires_in);
        if (process.env.DEBUG === 'true') {
          console.log(`### ## linkRes for [${JSON.stringify(userAcct.username)}]: ${JSON.stringify(linkRes)}`);
        }
        fenceQuestions.mockedLinkSuccess(linkRes);
        return linkRes;
      } catch (e) {
        console.log(`Failed to link google account ${userAcct.username} on attempt ${i}:`);
        console.log(e);
        if (i === nAttempts - 1) {
          throw e;
        }
      }
    }
  },

  /**
   * WARNING: circumvents google authentication (ie not like true linking process)
   * Forces a linking in fences databases then asserts success
   * @param {User} userAcct - commons account to link with
   * @param {string} googleEmail - email to link to
   * @returns {Promise<string>}
   */
  async forceLinkGoogleAcct(userAcct, googleEmail) {
    const linkRes = await fenceTasks.forceLinkGoogleAcct(userAcct, googleEmail);
    fenceQuestions.forceLinkSuccess(linkRes);
    return linkRes;
  },

  /**
   * Hits fences endpoint to DELETE a google link then asserts it was successful or there
   * wan't a linked account to begin with
   * @param {User} userAcct - user to delete link for
   * @returns {Promise<void>}
   */
  async forceUnlinkGoogleAcct(userAcct) {
    const nAttempts = 3;
    for (let i = 0; i < nAttempts; i += 1) {
      const unlinkRes = await fenceTasks.unlinkGoogleAcct(userAcct);
      expect(unlinkRes,
       'response from unlinking Google Account does not have expected status property').to.have.property('status');
      // Retry if response from unlinking Google Account does not have expected status of 200 or 404
      if ([200,404].indexOf(unlinkRes.status) == -1) {
        console.log(`Failed to unlink google account ${userAcct.username} on attempt ${i}:`);
        console.log(`unlinkRes: ${JSON.stringify(unlinkRes)}`);
        console.log('wait a second and try again...');
        await sleepMS(1 * 1000);
        if (i === nAttempts - 1) {
          throw new Error('Failed to unlink google account');
        }
      }
    }
  },

  /**
   * Hits fences endpoint to DELETE a google link then asserts it was successful
   * @param {User} userAcct - user to delete link for
   * @returns {Promise<void>}
   */
  async unlinkGoogleAcct(userAcct) {
    const unlinkRes = await fenceTasks.unlinkGoogleAcct(userAcct);
    fenceQuestions.responsesEqual(unlinkRes, fenceProps.resUnlinkSuccess);
  },

  /**
   * Creates an api key then asserts it was successful
   * @param {string[]} scope - access token scopes
   * @param {Object} accessTokenHeaders
   * @returns {Promise<Gen3Response>}
   */
  async createAPIKey(scope, accessTokenHeaders) {
    const apiKeyRes = await fenceTasks.createAPIKey(scope, accessTokenHeaders);
    fenceQuestions.hasAPIKey(apiKeyRes);
    return apiKeyRes;
  },

  /**
   * Creates temporary Google Access creds then asserts it was successful
   * @param {Object} accessTokenHeaders
   * @param {int} expires_in - requested expiration time (in seconds)
   * @returns {Promise<Gen3Response>}
   */
  async createTempGoogleCreds(accessTokenHeaders, expires_in = null) {
    const nAttempts = 3;
    for (let i = 0; i < nAttempts; i += 1) {
      const response = await fenceTasks.createTempGoogleCreds(accessTokenHeaders, expires_in);
      // response from creating temporary Google credentials does not have
      // nested property data.private_key (which means we didn't get back valid Google credentials
      if (!response.data['private_key']) {
        console.log(`Failed to create google temp creds on attempt ${i}:`);
        console.log(`Invalid response: ${JSON.stringify(response.data)}`);
        await sleepMS(2 * 1000);
        if (i === nAttempts - 1) {
          throw new Error(`Failed to create temp google creds due to: ${JSON.stringify(response.data)}! Num of attempts: ${i}.`);
        }
      } else {
        return response;
      }
    }
  },

  /**
   * Hits fence's multipart upload initialization endpoint
   * @param {string} fileName - name of the file that will be uploaded
   * @param {string} accessToken - access token
   * @returns {object} { guid, uploadId }
   */
  async initMultipartUpload(fileName, accessHeader) {
    const res = await fenceTasks.initMultipartUpload(fileName, accessHeader);
    expect(res, 'Unable to initialize multipart upload').to.have.property('status', 201);
    expect(res, 'Unable to initialize multipart upload').to.have.nested.property('data.guid');
    expect(res, 'Unable to initialize multipart upload').to.have.nested.property('data.uploadId');
    return {
      guid: res.data.guid,
      uploadId: res.data.uploadId,
    };
  },

  /**
   * Hits fence's signed url for multipart upload endpoint
   * @param {string} key - object's key in format "GUID/filename" (GUID as returned by initMultipartUpload)
   * @param {string} uploadId - object's uploadId (as returned by initMultipartUpload)
   * @param {string} partNumber - upload part number, starting from 1
   * @param {string} accessToken - access token
   * @returns {object} { url }
   */
  async getUrlForMultipartUpload(key, uploadId, partNumber, accessHeader) {
    const res = await fenceTasks.getUrlForMultipartUpload(key, uploadId, partNumber, accessHeader);
    expect(res, 'Unable to upload a part during multipart upload').to.have.property('status', 200);
    expect(res, 'Fence did not return a URL for multipart upload').to.have.nested.property('data.presigned_url');
    return {
      url: res.data.presigned_url,
    };
  },

  /**
   * Hits fence's multipart upload completion endpoint
   * @param {string} key - object's key in format "GUID/filename" (GUID as returned by initMultipartUpload)
   * @param {string} uploadId - object's uploadId (as returned by initMultipartUpload)
   * @param {string} parts - list of {partNumber, ETag} objects (as returned when uploading using the URL returned by getUrlForMultipartUpload)
   * @param {string} accessToken - access token
   * @returns {Promise<Gen3Response>}
   */
  async completeMultipartUpload(key, uploadId, parts, accessHeader) {
    const res = await fenceTasks.completeMultipartUpload(key, uploadId, parts, accessHeader);
    expect(res, 'Unable to complete multipart upload').to.have.property('status', 200);
    return res;
  },

  /**
   * Deletes a file from indexd and S3
   * @param {string} guid - GUID of the file to delete
   */
  async deleteFile(guid) {
    const res = await fenceTasks.deleteFile(guid);
    fenceQuestions.assertStatusCode(res, 204);
  },

  async getUserTokensWithClient(
    user = userMod.mainAcct, client = fenceProps.clients.client,
    scopes = 'openid+user+data+google_credentials+google_service_account+google_link',
  ) {
    // set user with cookie
    I.amOnPage('');
    I.setCookie({ name: 'dev_login', value: user.username });

    const urlStr = await fenceTasks.getConsentCode(client.id, 'code', scopes);
    fenceQuestions.assertContainSubStr(urlStr, ['code=']);
    const match = urlStr.match(RegExp('/?code=(.*)'));
    const code = match && match[1];
    fenceQuestions.assertTruthyResult(
      code,
      `fence\'s oauth2/authorize endpoint should have returned a consent code in url "${urlStr}"`,
    );
    const res = await fenceTasks.getTokensWithAuthCode(
      client.id,
      client.secret, code, 'authorization_code',
    );

    fenceQuestions.assertTokensSuccess(
      res, `Did not get client (${client.id}) tokens for user (${user.username}) successfully.`,
    );

    return res;
  },

  /**
   * Cleans up fence's DBs for links and service accounts
   * Takes the google and users utils as params
   * @returns {Promise<void>}
   */
  async suiteCleanup(google, users) {
    // google projects to 'clean up'
    const googleProjects = [
      fenceProps.googleProjectA,
      fenceProps.googleProjectDynamic,
      fenceProps.googleProjectWithComputeServiceAcct,
    ];
    // remove unimportant roles from google projects
    for (const proj of googleProjects) {
      await google.removeAllOptionalUsers(proj.id);
    }

    // delete all service accounts from fence
    for (const proj of googleProjects) {
      // TRY to delete the service account
      // NOTE: the service account might have been registered unsuccessfully or deleted,
      //  we are just hitting the endpoints as if it still exists and ignoring errors
      const projUser = users.mainAcct;

      if (!projUser.linkedGoogleAccount) {
        // If the project user is not linked, link to project owner then delete
        await fenceTasks.forceLinkGoogleAcct(projUser, proj.owner)
          .then(() => fenceTasks.deleteGoogleServiceAccount(projUser, proj.serviceAccountEmail));
      } else if (projUser.linkedGoogleAccount !== proj.owner) {
        // If the project user is linked, but not to project owner,
        // unlink user, then link to project owner and delete service account
        await module.exports.unlinkGoogleAcct(projUser)
          .then(() => fenceTasks.forceLinkGoogleAcct(projUser, proj.owner))
          .then(() => fenceTasks.deleteGoogleServiceAccount(projUser, proj.serviceAccountEmail));
      } else {
        // If project user is linked to the project owner, delete the service account
        await fenceTasks.deleteGoogleServiceAccount(projUser, proj.serviceAccountEmail);
      }
    }

    console.log(`${new Date()}: running suiteCleanup...`);

    // unlink all google accounts
    const unlinkPromises = Object.values(users).map((user) => fenceTasks.unlinkGoogleAcct(user));
    await Promise.all(unlinkPromises);
  },
};
