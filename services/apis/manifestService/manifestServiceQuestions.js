const chai = require('chai');

const expect = chai.expect;

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
};
