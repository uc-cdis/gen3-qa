const chai = require('chai');

const expect = chai.expect;
chai.config.includeStack = true;
chai.config.truncateThreshold = 0;

/**
 *  indexd utils
 */
const resultSuccess = function (res) {
  expect(res).to.not.have.property('error');
  expect(res).to.have.property('updated_date'); // used elsewhere so making sure it exists
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

    expect(res).to.nested.include({ 'hashes.md5': fileNode.data.md5sum });
    expect(res).to.have.property('size', fileNode.data.file_size);
    expect(res).to.have.property('urls');
    if (fileNode.data.urls !== undefined) {
      expect(res).to.nested.include({ 'urls[0]': fileNode.data.urls });
    }
  },

  /**
   * Asserts a record was successfully deleted from indexd
   * @param {Object} ffileNode
   */
  deleteFileSuccess(fileNode) {
    // Note that the delete res is the entire response, not just the body
    expect(fileNode, 'The record was not deleted from indexd').to.nested.include({ 'indexd_delete_res.raw_body': '' });
  },

  /**
   * Asserts a record exists in indexd
   * @param {Gen3Response} res - getFile result
   * @param {Object} fileNode
   */
  recordExists(res, fileNode) {
    resultSuccess(res);
    expect(fileNode, 'The specified record does not exist in indexd').to.have.property('rev');
  },
};
