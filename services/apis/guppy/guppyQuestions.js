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

  /**
   * Assert that the stringURL contains sub-strings
   * @param {string} resURL - response url
   * @param {array} containSubStr
   * @param {array} notContainSubStr
   */
  assertContainSubStr(resURL, containSubStr) {
    let i;
    for (i = 0; i < containSubStr.length; i += 1) {
      expect(resURL).to.contain(containSubStr[i]);
    }
  },

  /**
   * Assert that the stringURL contains sub-strings
   * @param {string} resURL - response url
   * @param {array} containSubStr
   * @param {array} notContainSubStr
   */
  assertNotContainSubStr(resURL, notContainSubStr) {
    let i;
    for (i = 0; i < notContainSubStr.length; i += 1) {
      expect(resURL).to.not.contain(notContainSubStr[i]);
    }
  },  

  assertTruthyResult(result, msg='') {
    err = `Expected a parameter to be "truthy" but received ${result}: ` + msg;
    expect(!!result, err).to.be.true;
  },

};
