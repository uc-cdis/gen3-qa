const pelicanProps = require('./pelicanProps.js');
const ax = require('axios');
const { Gen3Response, getCookie, getAccessTokenHeader } = require('../../../utils/apiUtil');
let I = actor();

/**
 * pelican Tasks
 */
module.exports = {
	async dispatchJob(access_token){
	    // run send an api request to generate a PFB from a sower job
		endpoint = pelicanProps.endpoints.dispatch;
		let jobParameters = '{"filter":{"AND":[]}}';
		headers = {
			'Content-Type': 'application/json',
			'authorization': 'Bearer ' + access_token
		}
		return await I.sendPostRequest(endpoint, jobParameters, headers).then(res => new Gen3Response(res));
	},
};
