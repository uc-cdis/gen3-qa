const chai = require('chai');

const { gen3Res } = require('../../../utils/apiUtil');

const expect = chai.expect;
chai.config.includeStack = true;
chai.config.truncateThreshold = 0;
chai.use(gen3Res);

const guppyProps = require('./guppyProps.js');

/**
 * guppy Questions
 */
module.exports = {
  /**
   * Asserts a res has data key property
   * @param apiKeyRes
   */
  hasData(queryRes) {
    expect(queryRes,
      'response does not have a "data" field in the body'
    ).to.have.nested.property('body.data');
  },

  /**
   * Asserts a res has case key property inside its data body
   * @param apiKeyRes
   */
  hasCase(queryRes) {
    expect(queryRes,
      'response does not have a "case" field in the data'
    ).to.have.nested.property('body.data.case');
  },

  /**
   * Asserts the Gen3Responses are equal
   * @param {Gen3Response} actualRes
   * @param {Gen3Response} expectedRes
   */
  responsesEqual(actualRes, expectedRes) {
    expect(actualRes).to.be.a.gen3Res(expectedRes);
  },

  /**
   * Assert that the response status code
   * @param {Gen3Response} response
   * @param {int} statusCode HTTP response code
   * @param {string} msg Message to display in case of failure
   */
  assertStatusCode(response, statusCode, msg='') {
    err = 'Wrong status code: ' + msg;
    expect(response, err).to.have.property('statusCode', statusCode);
  },

};
