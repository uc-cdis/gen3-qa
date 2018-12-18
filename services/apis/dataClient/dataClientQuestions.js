const fs = require('fs');
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
      throw new Error(`Download failed for ${filePath}`)
    }

    fs.readFile(filePath, (err, data) => {
      if (err) throw err;
      let fileContents = data.toString();
      expect(fileContents).to.equal(expectedContents);
    })
  },
};
