/**
 * A module providing API utility functions
 * @module apiUtil
 */

const atob = require('atob');
const ax = require('axios');
const readline = require('readline');
const chai = require('chai');
const jsdom = require('jsdom');
const chaiSubset = require('chai-subset');
const fs = require('fs');

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
   * Creates instance from a response object -
   * some goofiness as codecept v2 moved from unirest to axios for REST calls,
   * and the response structure is different.
   * In general the constructor should only take data or body, not both - prefer data
   * 
   * @param {string|Object} body
   * @param {string|object} data new REST library returns data instead of body
   * @param {number|Object} status or {status}
   * @param {Object} [request]
   * @param {string} [request.method]
   * @param {string} [request.headers]
   * @param {string} [request.uri.href]
   * @param {string} [fenceError] Parsed from body if determined to be an error page
   */
  constructor({ data, body, status, request, fenceError }) {
    this.fenceError = fenceError;
    this.parsedFenceError = (isErrorPage(data) ? parseFenceError(data) : undefined);
    this.body = this.parsedFenceError ? undefined : (data || body); // include body if not error page
    this.data = data || body;
    this.status = status;
    if (request) {
      try {
        this.requestMethod = request.method;
        this.requestHeaders = request.headers;
        this.requestBody = request.body;
        this.requestURL = request.uri ? request.uri.href : undefined;
      } catch (e) {
        // ignore if missing request attribute
        console.log('Gen3Response could not parse expected `request` attributes like `method`, `headers`, `body`, etc.')
        console.log(`Gen3Response got request: ${request}`);
      }
    } else {
      console.trace('Gen3Response constructor given undefined request');
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
    new Assertion(obj).to.have.property('status', expectedRes.status);
  });
};

module.exports = {
  /**
   * Returns the JSON for an access token header given the token itself
   * @param {string} accessToken - access token string
   * @returns {JSON}
   */
  getAccessTokenHeader(accessToken) {
    return {
      Accept: 'application/json',
      Authorization: `bearer ${accessToken}`,
    };
  },

  /**
   * Reads the credential.json, returns api_key and target_environment
   * @param {file_path} path_to_credentials_json - path to the credential.json
   * @returns {string, string}
   */
  getJWTData(path_to_credentials_json) {
    const credentials = fs.readFileSync(path_to_credentials_json, 'utf8');
    const api_key = JSON.parse(credentials)['api_key'];
    data = api_key.split('.'); // [0] headers, [1] payload, [2] signature
    payload = data[1];
    padding = "=".repeat(4 - payload.length % 4);
    decoded_data = Buffer.from((payload + padding), 'base64').toString();
    // If the decoded data doesn't contain a nonce, that means the refresh token has expired
    const target_environment = JSON.parse(decoded_data)['iss'].split('/')[2];
    return {
        'api_key': api_key,
        'target_environment': target_environment
    };
  },

  /**
   * Runs a fence command for fetching access token for a user
   * @param {string} username - username to fetch token for
   * @param {number} expiration - life duration for token
   * @returns {string}
   */
  getAccessToken(username, expiration) {
    console.log(`getting access token for ${username}`);
    // TODO - introduce support for getting token from environment variable
    //     or with API key when running in LOCAL_AGAINST_REMOTE mode ...
    const fenceCmd = `fence-create token-create --scopes openid,user,fence,data,credentials,google_service_account,google_credentials --type access_token --exp ${expiration} --username ${username}`;
    const accessToken = bash.runCommand(fenceCmd, 'fence', takeLastLine);
    return accessToken.trim();
  },

  /**
   * Returns the access token by instrumenting the fence http api
   * @param {string} api_key - api key from credentials.json (downloaded by an authenticated user)
   * @returns {string}
   */
  getAccessTokenFromApiKey(the_api_key, target_environment) {
    return new Promise(function(resolve, reject) {
      ax.request({
        url: '/user/credentials/cdis/access_token',
        baseURL: 'https://' + target_environment,
        method: 'post',
        maxRedirects: 0,
        header: {
          "content-type": "application/json",
          "accept": "application/json"
        },
        data: {
          api_key: the_api_key
        }
      }).then(
	  resp => resolve(resp.data['access_token']),
	  err => reject(err.response || err)
      );
    });
  },

  /**
   * Calls getAccessTokenFromApiKey with an API Key provided by the user and returns the corresponding access token
   * @param {object} I - CodeceptJS "I" actor accessible by all Scenarios - Used to share variables across tests
   * @returns {string}
   */
  getAccessTokenFromExecutableTest(I) {
  // Note: Cannot leverage the ${user.mainAcct.accessToken} while working on "closed" environments (Staging/PROD)
  // (i.e., no access to the underlying admin vm, hence, using API Key + Fence HTTP API to retrieve the Access Token)
    return new Promise(async(resolve) => {
	// Only prompt the user for the API Key if it hasn't already been loaded from credentials.json
	// Store API Key into the main actor object (I) so it can be accessed in all scenarios
	if (!I.apiKey) {
	    let apiKey = await module.exports.requestUserInput(`
              == Instructions to obtain the API Key ==
              a. Navigate to the "Profile" page on https://${I.TARGET_ENVIRONMENT} and click on "Create API key".
              b. Download the "credentials.json" file, copy the value of the "api_key" parameter and paste it here:
            `);
	    I.apiKey = apiKey;
	}
	resolve(module.exports.getAccessTokenFromApiKey(I.apiKey, I.TARGET_ENVIRONMENT));
    });
  },

  /**
   * Prompts the user for some manual input (to support executable tests)
   * @param {string} question_text - Text describing what piece of information the user should provide
   * @returns {string}
   */
  requestUserInput(question_text) {
    return new Promise((resolve) => {
	let rl = readline.createInterface({
	    input: process.stdin,
	    output: process.stdout
	});
	rl.question(question_text, (user_input) => {
	    rl.close();
	    resolve(user_input);
	});
    });
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
      await module.exportssleepMS(waitTime);
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

  parseJwt (token) {
    var base64Url = token.split('.')[1];
    var base64 = base64Url.replace('-', '+').replace('_', '/');
    return JSON.parse(atob(base64));
  },

  /**
   * Wrapper for API responses
   */
  Gen3Response,

  gen3Res,
};
