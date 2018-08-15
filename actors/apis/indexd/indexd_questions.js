'use strict';
  
let chai = require('chai');
let expect = chai.expect;
chai.config.includeStack = true;
chai.config.truncateThreshold = 0;

const indexd_props = require('./indexd_props.js');

/**
 *  indexd helpers
 */
const _resultSuccess = function(res) {
  expect(res).to.not.have.property('error');
  expect(res).to.have.property('updated_date'); // used elsewhere so making sure it exists
};

/**
 * indexd Questions
 */
module.exports = {
  fileEquals (res, file_node) {
    _resultSuccess(res);

    expect(res).to.nested.include({'hashes.md5': file_node.data.md5sum});
    expect(res).to.have.property('size', file_node.data.file_size);
    expect(res).to.have.property('urls');
    if (file_node.data.urls !== undefined) {
      expect(res).to.nested.include({'urls[0]': file_node.data.urls});
    }
  },

  deleteFileSuccess (file_node) {
    // Note that the delete res is the entire response, not just the body
    expect(file_node).to.nested.include({'indexd_delete_res.raw_body': ''});
  }
};
