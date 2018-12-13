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
    expect(fileNode, 'The record was not deleted from indexd').to.nested.include({ 'indexd_delete_res.raw_body': '' });
  },

  recordExists(res, fileNode) {
    resultSuccess(res);
    expect(fileNode, 'The specified record does not exist in indexd').to.have.property('rev');
  },

  metadataLinkingSuccess(record) {
    expect(record).to.have.property('acl');
    expect(record.acl, 'The ACL should not be empty anymore after linking metadata to the indexd record').to.not.be.empty;
    expect(record).to.have.property('uploader');
    expect(record.uploader, 'The uploader should be empty after linking metadata to the indexd record').to.not.exist;
  },

  metadataLinkingFailure(record) {
    expect(record).to.have.property('acl');
    expect(record.acl, 'The ACL should be empty before metadata is linked to the indexd record').to.be.empty;
    expect(record).to.have.property('uploader');
    expect(record.uploader, 'The uploader should be not empty before metadata is linked to the indexd record').to.exist;
  },
};
