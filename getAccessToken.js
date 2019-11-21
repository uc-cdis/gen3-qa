const { getAccessTokenFromApiKey } = require('./utils/apiUtil');

TARGET_ENVIRONMENT = process.env.GEN3_COMMONS_HOSTNAME;
// console.log('target environment: ' + TARGET_ENVIRONMENT);
API_KEY = process.env.API_KEY;
// console.log('api key: ' + API_KEY);

// obtain access token through fence API
getAccessTokenFromApiKey(API_KEY, TARGET_ENVIRONMENT)
    .then((ACCESS_TOKEN) => {
	console.log('access_token: ' + ACCESS_TOKEN);
    }).catch((reason) => {
	console.log('Failed: ' + reason.status +' - ' + reason.statusText);
    });
