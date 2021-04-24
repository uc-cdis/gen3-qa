const chai = require('chai');

const { expect } = chai;

/**
 * manifestService Questions
 */
module.exports = {
  doesHaveManifestVisible(res, manifestFilename) {
    expect(res).to.contain(manifestFilename);
  },

  doesNotHaveManifestVisible(res, manifestFilename) {
    expect(res).to.not.contain(manifestFilename);
  },

  assertPostManifestSuccess(res) {
    expect(res.data).to.have.property('filename');
  },
};
