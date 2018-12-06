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

  deleteFileSuccess(fileNode) {
    // Note that the delete res is the entire response, not just the body
    expect(fileNode).to.have.property('data');
    expect(fileNode.data).to.have.property('indexd_delete_res');
    expect(fileNode.data.indexd_delete_res).to.have.property('raw_body', '');
    // expect(fileNode).to.nested.include({ 'indexd_delete_res.raw_body': '' });
  },

  recordExists(res, fileNode) {
    resultSuccess(res);
    expect(fileNode.data).to.have.property('rev');
  },
};
