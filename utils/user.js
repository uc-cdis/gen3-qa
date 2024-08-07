/**
 * Util for getting test commons users credentials, access tokens, auth headers, etc
 * @module usersUtil
 */

const apiUtil = require('./apiUtil');
const { Bash } = require('./bash');

const bash = new Bash();

const DEFAULT_TOKEN_EXP = 10800;
let indexdCache = null;

/**
 * Gets indexd password for a commons
 * @returns {string}
 */
function getIndexPassword() {
  if (!indexdCache) {
    const credsCmd = 'cat /var/www/sheepdog/creds.json';
    const secret = bash.runCommand(credsCmd, 'sheepdog');
    console.error(secret);
    indexdCache = {
      indexdUsername: JSON.parse(secret).indexd_client !== undefined ? JSON.parse(secret).indexd_client : 'gdcapi',
      indexdPassword: JSON.parse(secret).indexd_password,
    };
    if (process.env.DEBUG === 'true') {
      console.log(`Cached indexd creds: ${JSON.stringify(indexdCache)}`);
    }
  }
  return { ...indexdCache };
}

/**
 * Lazy-load container for access token and indexd creds
 */
class User {
  /**
   * Constructor for User class
   * @param {Object} options
   * @param {string} options.accessToken - provided access Token, or null to defer to getAccessToken
   * @param {string} options.username - Gen3 commons username/email
   * @param {string} options.envVarsName - Suffix for getting environment variables for user
   */
  constructor({
    username, accessToken, googleEmail, googlePassword,
  }) {
    this.username = username;
    this._accessToken = accessToken || null;
    this._expiredAccessToken = null;
    this.googleEmail = googleEmail;
    this.googlePassword = googlePassword;
  }

  get accessToken() {
    if (!this._accessToken) {
      const at = apiUtil.getAccessToken(this.username, DEFAULT_TOKEN_EXP);
      // make sure the access token looks valid - base64 encoded JSON :-p
      // const token = apiUtil.parseJwt(at);
      this._accessToken = at;
    }
    return this._accessToken;
  }

  async getExpiredAccessToken() {
    if (!this._expiredAccessToken) {
      const at = apiUtil.getAccessToken(this.username, 1);
      // const token = apiUtil.parseJwt(at); // just a sanity check
      this._expiredAccessToken = at;
      // better sleep for 1 seconds, so the token is actually expired when the caller gets it
      await apiUtil.sleepMS(2000);
    }
    return this._expiredAccessToken;
  }

  /**
   * Google credentials for logging in
   * @returns {{email: string, password: string}}
   */
  get googleCreds() {
    return {
      email: this.googleEmail,
      password: this.googlePassword,
    };
  }

  /**
   * Simple auth header with bearer and access token
   * @returns {{Accept: string, Authorization: string}}
   */
  get accessTokenHeader() {
    return {
      Accept: 'application/json',
      Authorization: `bearer ${this.accessToken}`,
      'Content-Type': 'application/json',
    };
  }

  /**
   * Simple auth header with bearer and expired access token
   * @returns {{Accept: string, Authorization: string}}
   */
  async getExpiredAccessTokenHeader() {
    const token = await this.getExpiredAccessToken();
    return {
      Accept: 'application/json',
      Authorization: `bearer ${token}`,
      'Content-Type': 'application/json',
    };
  }

  /**
   * Auth header required for some Indexd API calls
   * @returns {{Accept: string, "Content-Type": string, Authorization: string}}
   */
  get indexdAuthHeader() { // eslint-disable-line
    const info = getIndexPassword();
    const indexAuth = Buffer.from(`${info.indexdUsername}:${info.indexdPassword}`).toString('base64');
    return {
      Accept: 'application/json',
      'Content-Type': 'application/json; charset=UTF-8',
      Authorization: `Basic ${indexAuth}`,
    };
  }
}

const gCreds = { googleEmail: 'test@example.com', googlePassword: 'dummypassword' };

module.exports = {
  /**
   * Main User account
   * Note that this user has the "data-upload" role
   * Note that this user has the "abc-admin" policy
   */
  mainAcct: new User(
    {
      username: 'cdis.autotest@gmail.com',
      accessToken: process.env.GEN3_TOKEN_MAIN,
      ...gCreds,
    },
  ),
  /**
   * Auxiliary User account 1
   * Note that this user doesn't have the "data-upload" role
   * Note that this user has the "abc.programs.test_program.projects.test_project1-viewer" policy
   */
  auxAcct1: new User(
    {
      username: 'dummy-one@planx-pla.net',
      accessToken: process.env.GEN3_TOKEN_AUX1,
      ...gCreds,
    },
  ),
  /**
   * Auxiliary User account 2
   * Note that this user also has the "data-upload" role
   * Note that this user has the "abc.programs.test_program2.projects.test_project3-viewer" policy
   */
  auxAcct2: new User(
    {
      username: 'smarty-two@planx-pla.net',
      accessToken: process.env.GEN3_TOKEN_AUX2,
      ...gCreds,
    },
  ),
  /**
   * User.yaml User account 0
   */
  user0: new User(
    {
      username: 'dcf-integration-test-0@planx-pla.net',
      accessToken: process.env.GEN3_TOKEN_USER0,
      ...gCreds,
    },
  ),
  /**
   * User.yaml User account 1
   */
  user1: new User(
    {
      username: 'dcf-integration-test-1@planx-pla.net',
      accessToken: process.env.GEN3_TOKEN_USER1,
      ...gCreds,
    },
  ),
  /**
   * User.yaml User account 2
   */
  user2: new User(
    {
      username: 'dcf-integration-test-2@planx-pla.net',
      accessToken: process.env.GEN3_TOKEN_USER2,
      ...gCreds,
    },
  ),

  /**
   * Indexing User account
   * Note that this user has the "indexd_admin" policy
   */
  indexingAcct: new User(
    {
      username: 'ctds.indexing.test@gmail.com',
      accessToken: process.env.GEN3_TOKEN_MAIN,
      ...gCreds,
    },
  ),
};
