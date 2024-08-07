/* eslint-disable max-len */
const props = require('./gen3ffLandingPageProps');
// const portal = require('../../../utils/portal.js');
// const { Bash } = require('../../../utils/bash.js');

// const bash = new Bash();
const I = actor();

/**
 * home Tasks
 */
module.exports = {
  goToPage() {
    I.amOnPage(props.path);
    if (process.env.DEBUG === 'true') {
      I.wait(5);
      I.saveScreenshot('gen3ffLandingPage.png');
    }
    I.waitForElement(props.readyCue.locator, 30);
  },

  verifyLandingPageButton(button, expectedUrl) {
    I.click(`//a[contains(text(), "${button}")]`);
    if (process.env.DEBUG === 'true') {
      I.wait(5);
      I.saveScreenshot(`${button}_page.png`);
    }
    I.seeInCurrentUrl(expectedUrl);
  },
};
