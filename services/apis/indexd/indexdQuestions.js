const chai = require('chai');

const { expect } = chai;
chai.config.includeStack = true;
chai.config.truncateThreshold = 0;

const apiUtil = require('../../../utils/apiUtil.js');

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
    if (process.env.DEBUG === 'true') {
      console.log('---------------------------------------------');
      console.log(fileNode.data);
    }

    expect(res).to.nested.include({ 'hashes.md5': fileNode.data.md5sum });
    expect(res).to.have.property('size', fileNode.data.file_size);
    expect(res).to.have.property('urls');
    if (fileNode.data.urls !== undefined) {
      expect(res).to.nested.include({ 'urls[0]': fileNode.data.urls });
    }
    if (fileNode.authz !== undefined) {
      expect(res.authz).to.include.members(fileNode.authz);
    }
  },

  /**
   * Asserts a record was successfully deleted from indexd
   * @param {Object} fileNode
   */
  deleteFileSuccess(fileNode, res, msg = '') {
    const delete_msg = `${msg} The record was not deleted from indexd.`;

    // Note that the delete res is the entire response, not just the body
    expect(fileNode, delete_msg).to.nested.include(
      { 'indexd_delete_res.data': '' },
    );

    if (res) {
      const err = `${msg}Did not have expected status code of 200.`;
      expect(res, err).to.have.property('status', 200);
    }
  },

  /**
   * Asserts a record was successfully deleted from indexd
   * @param {Object} fileNode
   */
  deleteFileNotSuccessful(res, fileNode, msg = '') {
    const delete_msg = `${msg} The record WAS deleted from indexd!`;
    // Note that the delete res is the entire response, not just the body
    expect(fileNode, delete_msg).to.not.nested.include(
      { 'indexd_delete_res.data': '' },
    );

    const err = `${msg}Had UNexpected status code of 200.`;
    expect(res, err).to.not.have.property('status', 200);
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

  /**
   * Assert a list of responses from file deletions are all successful
   * @param {array} resList - list of Gen3Responses
   */
  deleteFilesSuccess(resList) {
    apiUtil.applyQuestion(resList, this.deleteFileSuccess);
  },

  resultFailure(res) {
    expect(res).to.have.property('error');
  },
};
