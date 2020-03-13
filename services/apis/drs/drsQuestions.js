const chai = require('chai');

const { expect } = chai;
chai.config.includeStack = true;
chai.config.truncateThreshold = 0;

/**
 *  drs utils
 */
const resultSuccess = function (res) {
  expect(res).to.not.have.property('error');
  expect(res).to.have.property('updated_date'); // used elsewhere so making sure it exists
};

/**
 * drs Questions
 */
module.exports = {
  /**
   * Asserts an drs get file result is equal to a given file node
   * @param {} res
   * @param fileNode
   */
  fileEquals(res, fileNode) {
    object = res.data
    expect(object.checksums[0]).to.nested.include({'checksum': fileNode.data.checksums[0].checksum});
    expect(object).to.have.property('size', fileNode.data.size);
    expect(object.access_methods[0]).to.have.property('access_url');
    if (fileNode.data.urls !== undefined) {
      expect(object).to.nested.include({ 'urls[0]': fileNode.data.urls });
    }
    if (fileNode.authz !== undefined) {
      expect(object.authz).to.include.members(fileNode.authz);
    }
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

  /**
   * Asserts a record does not exist in indexd
   * @param {Gen3Response} res - getFile result
   */
  recordDoesNotExist(res) {
    expect(
      res, 'Response does not have status code property',
    ).to.have.property('status');
    expect(
      res.status, 'When checking if indexd record does not exist, '
      + 'did NOT get 404 when GET-ing it, expected a 404 since the file should not exist.',
    ).to.equal(404);
  },
};
