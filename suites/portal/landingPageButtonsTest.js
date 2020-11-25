/*
 Automated tests for Landing Page buttons (PXP-6216)
 This test plan assumes the presence of one or more default
 landing page with the following cards:
  1. Define Data Field (redirects user to #hostname/DD)
  2. Explore Data (redirects user to #hostname/explorer)
  3. Access Data (redirects user to #hotname/query)
  4. Analyze Data (redirects user to #hostname/workspace)
*/
Feature('Landing page buttons');

const { expect } = require('chai');
const { sleepMS } = require('../../utils/apiUtil.js');

// Login and navigate to the landing page to instrument buttons and assert they are working
Scenario('Navigate to the landing page and click on buttons @landing', async ({ I, home }) => {
  home.do.goToHomepage();
  home.complete.login();

  const buttons = [
    {
      text: 'Learn more',
      expectedUrl: 'DD',
    },
    {
      text: 'Explore data',
      expectedUrl: 'explorer',
    },
    {
      text: 'Query data',
      expectedUrl: 'query',
    },
    {
      text: 'Run analysis',
      expectedUrl: 'workspace',
    },
  ];

  I.scrollPageToBottom();
  I.saveScreenshot('Landing_page_cards_and_buttons.png');

  for (const [key, button] of Object.entries(buttons)) {
    console.log(`checking: ${key}`);
    I.waitForElement({ css: '.index-button-bar' }, 10);
    const btExists = await tryTo(() => I.seeElement({ xpath: `//button[contains(text(), '${button.text}')]` })); // eslint-disable-line no-undef
    if (btExists) {
      const assertionFailureMsg = `button ${button.text} did not redirect user to expected url ${button.expectedUrl}.`;
      I.click({ xpath: `//button[contains(text(), '${button.text}')]` });
      await sleepMS(500);
      const theUrl = await I.grabCurrentUrl();
      expect(
        theUrl,
        assertionFailureMsg,
      ).to.be.equal(`https://${process.env.HOSTNAME}/${button.expectedUrl}`);
    } else {
      console.log(`Button ${button.text} does not exist on this landing page. Skipping check...`);
    }
    // Go back to the landing page and try to find / click on the buttons again
    I.amOnPage('/');
  }
}).retry(2);
