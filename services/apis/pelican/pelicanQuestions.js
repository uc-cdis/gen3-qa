let chai = require('chai');
let expect = chai.expect;
const fetch = require('node-fetch');
const { Gen3Response, getCookie, getAccessTokenHeader } = require('../../../utils/apiUtil');
chai.config.includeStack = true;
chai.config.truncateThreshold = 0;
let I = actor();


const pelicanProps = require('./pelicanProps.js');

/**
 * pelican Questions
 */
module.exports = {
	async checkStatus(jobID, access_token){
		// hit the status endpoint to check the job
		endpoint = pelicanProps.endpoints.status + "?UID=" + jobID;
		headers = {
			'Content-Type': 'application/json',
			'authorization': 'Bearer ' + access_token
		}
		return await I.sendGetRequest(endpoint, headers).then(res => new Gen3Response(res));
	},
};

