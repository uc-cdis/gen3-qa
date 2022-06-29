const rasServerURL = 'https://stsstg.nih.gov';

module.exports = {
  // URLs
  indexdEndpoint: '/index/index',
  rasAuthEndpoint: `${rasServerURL}/auth/oauth/v2/authorize`,
  rasTokenEndpoint: `${rasServerURL}/auth/oauth/v2/token`,
  logoutRasEndpoint: `${rasServerURL}/connect/session/logout`,
  revokeRasEndpoint: `${rasServerURL}/auth/oauth/v2/token/revoke`,
  rasRedirectURI: 'http://localhost:8080/user/login/ras/callback',
  userInfoEndpoint: `${rasServerURL}/openid/connect/v1.1/userinfo`,
  // XPATH
  signInButton: '//button[contains(text(), \'Sign in\')]',
  userField: '#USER',
  passwordField: '#PASSWORD',
};
