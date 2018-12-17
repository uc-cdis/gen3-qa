const chai = require('chai');

const expect = chai.expect;

/**
 * dataClient Questions
 */
module.exports = {
  /**
   * Assert a file's contents are as expected
   * @param filePath - file location
   * @param expectedContents
   */
  fileContains(filePath, expectedContents) {
    if (!fs.existsSync(filePath)) {
      throw new Error(`Download failed for ${guid}`)
    }

    let fileContents = ''; // TODO
    expect(fileContents).to.equal(expectedContents);
  },
};
