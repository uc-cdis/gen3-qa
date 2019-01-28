/**
 * Util for getting test commons users credentials, access tokens, auth headers, etc
 * @module usersUtil
 */

const ACCESS_TOKEN_MISSING_ERROR = 'No access token was found for user ';
const GOOGLE_CREDS_MISSING_ERROR = 'No google credentials found for user ';

/**
 * Class for a test user
 */
class User {
  /**
   * Constructor for User class
   * @param {Object} options
   * @param {string} options.username - Gen3 commons username/email
   * @param {string} options.envVarsName - Suffix for getting environment variables for user
   */
  constructor({ username, envVarsName }) {
    this.username = username;
    this.envTokenName = `ACCESS_TOKEN_${envVarsName}`;
    this.envExpTokenName = `EXPIRED_ACCESS_TOKEN_${envVarsName}`;
    this.envGoogleEmail = `GOOGLE_EMAIL_${envVarsName}`;
    this.envGooglePassword = `GOOGLE_PASSWORD_${envVarsName}`;
  }

  /**
   * The Gen3 commons access token
   * @returns {string}
   */
  get accessToken() {
    if (process.env[this.envTokenName] === '') {
      throw Error(ACCESS_TOKEN_MISSING_ERROR + this.username);
    }
    return process.env[this.envTokenName];
  }

  /**
   * The Gen3 commons expired access token
   * @returns {string}
   */
  get expiredAccessToken() {
    if (process.env[this.envExpTokenName] === '') {
      throw Error(ACCESS_TOKEN_MISSING_ERROR + this.username);
    }
    return process.env[this.envExpTokenName];
  }

  /**
   * Google credentials for logging in
   * @returns {{email: string, password: string}}
   */
  get googleCreds() {
    if (process.env[this.envGoogleEmail] === '' || process.env[this.envGooglePassword] === '') {
      throw Error(GOOGLE_CREDS_MISSING_ERROR + this.username);
    }
    return {
      email: process.env[this.envGoogleEmail],
      password: process.env[this.envGooglePassword],
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
    };
  }

  /**
   * Simple auth header with bearer and expired access token
   * @returns {{Accept: string, Authorization: string}}
   */
  get expiredAccessTokenHeader() {
    return {
      Accept: 'application/json',
      Authorization: `bearer ${this.expiredAccessToken}`,
    };
  }

  /**
   * Auth header required for some Indexd API calls
   * @returns {{Accept: string, "Content-Type": string, Authorization: string}}
   */
  get indexdAuthHeader() { // eslint-disable-line
    const username = process.env.INDEX_USERNAME;
    const password = process.env.INDEX_PASSWORD;
    const indexAuth = Buffer.from(`${username}:${password}`).toString('base64');
    return {
      Accept: 'application/json',
      'Content-Type': 'application/json; charset=UTF-8',
      Authorization: `Basic ${indexAuth}`,
    };
  }
}

module.exports = {
  /**
   * Main User account
   * Note that only this user has the "data-upload" role
   */
  mainAcct: new User({ username: 'cdis.autotest@gmail.com', envVarsName: 'MAIN' }),
  /**
   * Auxiliary User account 1
   */
  auxAcct1: new User({ username: 'dummy-one@planx-pla.net', envVarsName: 'AUX1' }),
  /**
   * Auxiliary User account 2
   */
  auxAcct2: new User({ username: 'smarty-two@planx-pla.net', envVarsName: 'AUX2' }),
  /**
   * User.yaml User account 0
   */
  user0: new User({ username: 'dcf-integration-test-0@planx-pla.net', envVarsName: 'USER0' }),
  /**
   * User.yaml User account 1
   */
  user1: new User({ username: 'dcf-integration-test-1@planx-pla.net', envVarsName: 'USER1' }),
  /**
   * User.yaml User account 2
   */
  user2: new User({ username: 'dcf-integration-test-2@planx-pla.net', envVarsName: 'USER2' })
};
