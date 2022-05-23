const { getAccessTokenFromApiKey } = require('./utils/apiUtil');

// The following environment variables are set by 'getAccessToken.sh'
const TARGET_ENVIRONMENT = process.env.GEN3_COMMONS_HOSTNAME;
// console.log('target environment: ' + TARGET_ENVIRONMENT);
const { API_KEY } = process.env;
// console.log('api key: ' + API_KEY);

// obtain access token through fence API
getAccessTokenFromApiKey(API_KEY, TARGET_ENVIRONMENT)
  .then((ACCESS_TOKEN) => {
    if (process.env.DEBUG === 'true') {
      console.log(ACCESS_TOKEN);
    }
  }).catch((reason) => {
    console.log(`Failed: ${reason.status} - ${reason.statusText}`);
  });
