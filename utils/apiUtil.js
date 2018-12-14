/**
 * A module providing API utility functions
 * @module apiUtil
 */

const chai = require('chai');
const jsdom = require('jsdom');
const chaiSubset = require('chai-subset');

const expect = chai.expect;
chai.config.includeStack = true;
chai.config.truncateThreshold = 0;
const { JSDOM } = jsdom;

/**
 * Determines if response body is the fence generic error page
 * @param responseBody
 * @returns {boolean}
 */
function isErrorPage(responseBody) {
  return (typeof responseBody === 'string') && /<body.*>/.test(responseBody);
}

/**
 * Parse error info from fence generic page html
 * @param {string} responseBody
 * @returns {string|DOMObject}
 */
function parseFenceError(responseBody) {
  const dom = new JSDOM(responseBody);
  try {
    const errorContainer = dom.window.document.querySelector('.error-page__information');
    return errorContainer.textContent;
  } catch (e) {
    return dom.window.document.querySelector('body').textContent;
  }
}

/**
 * Wrapper for API responses
 */
class Gen3Response {
  /**
   * Creates instance from a response object, expected to be comparable to Unirest response object
   * @param {string|Object} body
   * @param {number} statusCode
   * @param {Object} [request]
   * @param {string} [request.method]
   * @param {string} [request.headers]
   * @param {string} [request.uri.href]
   * @param {string} [fenceError] Parsed from body if determined to be an error page
   */
  constructor({ body, statusCode, request, fenceError }) {
    this.fenceError = fenceError;
    this.parsedFenceError = (isErrorPage(body) ? parseFenceError(body) : undefined);
    this.body = this.parsedFenceError ? undefined : body; // include body if not error page
    this.statusCode = statusCode;
    try {
      this.requestMethod = request.method;
      this.requestHeaders = request.headers;
      this.requestBody = request.body;
      this.requestURL = request.uri.href;
    } catch (e) {
      // ignore if missing request attribute
    }
  }
}

/**
 * Chai utility method for asserting a Gen3Result matches an expected Gen3Result
 * Use by including chai.use(apiUtil.gen3Res) at the top of a module.
 * example: expect(res).to.be.a.gen3Res(expectedRes)
 * @param _chai
 */
const gen3Res = function (_chai) {
  _chai.use(chaiSubset);
  const Assertion = _chai.Assertion;

  // language chain method
  Assertion.addMethod('gen3Res', function (expectedRes) {
    const obj = this._obj; // eslint-disable-line

    new Assertion(obj).to.be.instanceof(Gen3Response);
    if (expectedRes.fenceError) {
      // assert fence errors are equal
      new Assertion(obj).to.have.property('parsedFenceError');
      new Assertion(obj.parsedFenceError).to.have.string(expectedRes.fenceError);
    } else if (expectedRes.body) {
      // assert body has the subset of attributes
      new Assertion(obj).to.have.property('body');
      _chai.expect(obj.body).to.containSubset(expectedRes.body);
    }
    new Assertion(obj).to.have.property('statusCode', expectedRes.statusCode);
  });
};

module.exports = {
  /**
   * Apply a question to an array of responses. Expect no errors to be thrown
   * @param {Object[]} objList
   * @param {function} question
   * @param {boolean} spread Whether or not each element in object list needs to be spread as params
   */
  applyQuestion(objList, question, spread) {
    const failList = [];

    for (const thisObj of objList) {
      try {
        if (spread) {
          question(...thisObj);
        } else {
          question(thisObj);
        }
      } catch (e) {
        failList.push(e.message);
      }
    }

    expect(failList).to.deep.equal([]);
  },

  /**
   * Wait for the specified number of milliseconds
   * @param {int} ms
   */
   sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  },

  /**
   * Wrapper for API responses
   */
  Gen3Response,

  gen3Res,
};
