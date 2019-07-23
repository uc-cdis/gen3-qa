const { Gen3Response } = require('../../../utils/apiUtil');

/**
 * pelican Properties
 */

const namespace = process.env.NAMESPACE;
const hostname = 'https://' + namespace + '.planx-pla.net';
module.exports = {
  /**
   * Pelican Endpoints
   */

	endpoints: {
		hostname: hostname,
		// dispatch POST with graphql query
		dispatch: "/job/dispatch",

		// check the status of the jobs within sower
		status: "/job/status",

		// output from the job
		output: "/job/output",
	}
};
