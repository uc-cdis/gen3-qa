'use strict';

let chai = require('chai');
let expect = chai.expect;
chai.config.includeStack = true;
chai.config.truncateThreshold = 0;

const fence_questions = require('./fence_questions.js');
const fence_tasks = require('./fence_tasks.js');

/**
 * fence sequences
 */
module.exports = {
  async checkFileEquals(signed_url_res, contents) {
    fence_questions.hasUrl(signed_url_res);
    let file_contents = await fence_tasks.getFile(signed_url_res.body.url);
    expect(file_contents).to.equal(contents);
  }
};
