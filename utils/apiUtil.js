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

const { Bash, takeLastLine } = require('./bash');
const bash = new Bash();

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
const gen3Res = function (_chai, _) {
  _chai.use(chaiSubset);
  const Assertion = _chai.Assertion;

  // language chain method
  Assertion.addMethod('gen3Res', function (expectedRes) {
    const obj = this._obj; // eslint-disable-line
    
    // see https://github.com/chaijs/chai/issues/81
    // Unfortunately - this does not seem to work, so add try/catch below instead ...
    // _.flag(this, 'message', `gen3 response ${JSON.stringify(obj ? obj.body : obj)}`);

    new Assertion(obj).to.be.instanceof(Gen3Response);
    if (expectedRes.fenceError) {
      // assert fence errors are equal
      new Assertion(obj).to.have.property('parsedFenceError');
      new Assertion(obj.parsedFenceError).to.have.string(expectedRes.fenceError);
    } else if (expectedRes.body) {
      // assert body has the subset of attributes
      new Assertion(obj).to.have.property('body');
      try {
        _chai.expect(obj.body).to.containSubset(expectedRes.body);
      } catch (err) {
        //
        // the default Chai logging does not show the full nested structure of obj.body -
        // which often includes error details from the server,
        // so add some extra logging here on test failure
        //
        console.log(`gen3Res assertion failure: ${JSON.stringify(obj.body)} !~ ${JSON.stringify(expectedRes.body)}`);
        throw err;
      }
    }
    new Assertion(obj).to.have.property('statusCode', expectedRes.statusCode);
  });
};

module.exports = {
  /**
   * Runs a fence command for fetching access token for a user
   * @param {string} namespace - namespace to get token from
   * @param {string} username - username to fetch token for
   * @param {number} expiration - life duration for token
   * @returns {string}
   */
  getAccessToken(username, expiration) {
    const fenceCmd = `fence-create token-create --scopes openid,user,fence,data,credentials,google_service_account,google_credentials --type access_token --exp ${expiration} --username ${username}`;
    const accessToken = bash.runCommand(fenceCmd, 'fence', takeLastLine);
    console.error(accessToken);
    return accessToken.trim();
  },

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
  sleepMS(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  },

  /**
   * Wait for a task to be done. After each check, wait longer than the
   * previous time
   * @param {function} checkFunc - returns true if done, false otherwise
   * @param {Object[]} funcArgs - list of arguments to pass to checkFunc()
   * @param {int} timeout - max number of seconds to wait
   * @param {string} errorMessage - message to display if not done in time
   * @param {int} startWait - initial number of seconds to wait
   */
  async smartWait(checkFunc, checkArgs, timeout, errorMessage, startWait=null) {
    waitTime = (startWait * 1000) || 50; // start by waiting 50 ms
    waited = 0; // keep track of how many ms have passed
    while (waited < timeout * 1000) {
      // check if the task is done
      let done = await checkFunc(...checkArgs);
      if (done) return;

      // if not done, keep waiting
      await module.exports.sleepMS(waitTime);
      waited += waitTime;
      waitTime *= 2; // wait longer every time
    }
    throw new Error(errorMessage);
  },

  /**
   * Returns the value of a cookie given the name and the string from 'set-cookie'
   * header in the response
   * @param {string} cookieName - name for cookie you want the value of
   * @param {string} cookieString - string from 'set-cookie' header in the response
   * @returns {string}
   */
  getCookie(cookieName, cookieString) {
    // get name followed by anything except a semicolon
    var cookiestring = RegExp("" + cookieName + "[^;]+").exec(cookieString);
    // return everything after the equal sign, or an empty string if the cookie name not found
    return decodeURIComponent(!!cookiestring ? cookiestring.toString().replace(/^[^=]+./,"") : "");
  },

  /**
   * Wrapper for API responses
   */
  Gen3Response,

  gen3Res,
};
