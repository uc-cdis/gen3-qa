/**
 * A module providing API utility functions
 * @module apiHelper
 */

const chai = require('chai');
const jsdom = require('jsdom');

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
  return (typeof responseBody === 'string') && /<.*>/.test(responseBody);
}

/**
 * Parse error info from fence generic page html
 * @param {string} responseBody
 * @returns {string|DOMObject}
 */
function parseFenceError(responseBody) {
  const dom = new JSDOM(responseBody);
  const errorContainer = dom.window.document.querySelector('.error-page__information');
  const errors = errorContainer.querySelectorAll('.introduction');
  // actual error message is the second occurrence of .introduction
  return errors.length === 2 ? errors[1] : errorContainer;
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
    this.parsedFenceError = fenceError || (isErrorPage(body) ? parseFenceError(body) : undefined);
    this.body = this.parsedFenceError ? undefined : body; // include body if not error page
    this.statusCode = statusCode;
    try {
      this.requestMethod = request.method;
      this.requestHeaders = request.headers;
      this.requestBody = request.body;
      this.requestUrl = request.uri.href;
    } catch (e) {
      // ignore if missing request attribute
    }
  }
}

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
   * Wrapper for API responses
   */
  Gen3Response,
};
