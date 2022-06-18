/**
 * Mariner Properties
 */

const rootEndPoint = 'ga4gh/wes/v1/runs';

module.exports = {
  /**
   * Mariner endpoints
   * Run a workflow - POST /ga4gh/wes/v1/runs
   * Check status - /ga4gh/wes/v1/runs/<runID>/status
   * Fetch run history - /ga4gh/wes/v1/runs
   * Cancel run - /ga4gh/wes/v1/runs/<runID>/cancel
   */
  endpoints: {
    rootEndPoint,
  },
};
