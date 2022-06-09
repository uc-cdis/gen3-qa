const indexingProps = require('./indexingProps.js');

const I = actor();

/**
 * indexing Tasks
 */
module.exports = {
  goToIndexingPage() {
    I.amOnPage(indexingProps.path);
    if (process.env.DEBUG === 'true') {
      I.captureBrowserLog();
      I.saveScreenshot('indexing.png');
    }
    I.waitForElement(indexingProps.readyCue, 30);
  },

  async indexManifest(user, manifestFileName) {
    this.goToIndexingPage();
    I.click(indexingProps.formIndexFiles);
    I.attachFile('input[type="file"]', `${manifestFileName}.tsv`);
    I.saveScreenshot('attached_file.png');
    I.click(indexingProps.btnIndexFiles);
    I.wait(2);
    I.saveScreenshot('clicked_button.png');
    I.waitForElement(indexingProps.labelDone, 300);
    I.click(indexingProps.btnClosePopup);
  },
};
