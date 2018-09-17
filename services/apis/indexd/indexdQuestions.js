const chai = require('chai');

const expect = chai.expect;
chai.config.includeStack = true;
chai.config.truncateThreshold = 0;

/**
 *  indexd utils
 */
const resultSuccess = function (res) {
  expect(res).to.not.have.nested.property('body.error');
  expect(res).to.have.nested.property('body.updated_date'); // used elsewhere so making sure it exists
};

/**
 * indexd Questions
 */
module.exports = {
  /**
   * Asserts an indexd get file result is equal to a given file node
   * @param {} res
   * @param fileNode
   */
  fileEquals(res, fileNode) {
    resultSuccess(res);

    expect(res).to.nested.include({ 'body.hashes.md5': fileNode.data.md5sum });
    expect(res).to.have.nested.property('body.size', fileNode.data.file_size);
    expect(res).to.have.nested.property('body.urls');
    if (fileNode.data.urls !== undefined) {
      expect(res).to.nested.include({ 'body.urls[0]': fileNode.data.urls });
    }
  },

  deleteFileSuccess(fileNode) {
    // Note that the delete res is the entire response, not just the body
    expect(fileNode).to.have.nested.property('indexdDeleteRes.statusCode', 200);
  },
};
