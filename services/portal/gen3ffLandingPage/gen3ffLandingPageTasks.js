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
    I.wait(5);
    I.saveScreenshot('gen3ffLandingPage.png');
    I.waitForElement(props.readyCue, 30);
    I.wait(2);
  },
};
