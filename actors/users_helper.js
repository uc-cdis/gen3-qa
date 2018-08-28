const ACCESS_TOKEN_MISSING_ERROR = 'No access token was found for user ';
const GOOGLE_CREDS_MISSING_ERROR = 'No google credentials found for user ';

class User {
  constructor({ username, envVarsName, jenkinsOnly }) {
    this.username = username;
    this.envTokenName = `ACCESS_TOKEN_${envVarsName}`;
    this.envExpTokenName = `EXPIRED_ACCESS_TOKEN_${envVarsName}`;
    this.envGoogleEmail = `GOOGLE_EMAIL_${envVarsName}`;
    this.envGooglePassword = `GOOGLE_PASSWORD_${envVarsName}`;
    this.jenkinsOnly = jenkinsOnly;
  }

  get accessToken() {
    if (process.env[this.envTokenName] === '') {
      throw Error(ACCESS_TOKEN_MISSING_ERROR + this.username);
    }
    return process.env[this.envTokenName];
  }

  get expiredAccessToken() {
    if (process.env[this.envExpTokenName] === '') {
      throw Error(ACCESS_TOKEN_MISSING_ERROR + this.username);
    }
    return process.env[this.envExpTokenName];
  }

  get googleCreds() {
    if (process.env[this.envGoogleEmail] === '' || process.env[this.envGooglePassword] === '') {
      throw Error(GOOGLE_CREDS_MISSING_ERROR + this.username);
    }
    return {
      email: process.env[this.envGoogleEmail],
      password: process.env[this.envGooglePassword],
    };
  }

  get accessTokenHeader() {
    return {
      Accept: 'application/json',
      Authorization: `bearer ${this.accessToken}`,
    };
  }

  get expiredAccessTokenHeader() {
    return {
      Accept: 'application/json',
      Authorization: `bearer ${this.expiredAccessToken}`,
    };
  }

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
  mainAcct: new User({ username: 'cdis.autotest@gmail.com', envVarsName: 'MAIN', jenkinsOnly: false }),
  auxAcct1: new User({ username: 'dummy-one@planx-pla.net', envVarsName: 'AUX1', jenkinsOnly: true }),
  auxAcct2: new User({ username: 'smarty-two@planx-pla.net', envVarsName: 'AUX2', jenkinsOnly: true}),
};
