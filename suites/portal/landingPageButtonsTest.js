/*
 Automated tests for Landing Page buttons (PXP-6216)
 This test plan assumes the presence of one or more default
 landing page with the following cards:
  1. Define Data Field (redirects user to /DD)
  2. Explore Data (redirects user to /explorer or /files)
  3. Access Data (redirects user to /query)
  4. Analyze Data (redirects user to /workspace)
*/
Feature('Landing page buttons @requires-portal');

const { expect } = require('chai');
const { sleepMS } = require('../../utils/apiUtil.js');

// Login and navigate to the landing page to instrument buttons and assert they are working
Scenario('Navigate to the landing page and click on buttons @landing', async ({ I, home }) => {
  home.do.goToHomepage();
  await home.complete.login();

  const buttons = [
    {
      text: 'Learn more',
      expectedUrls: ['DD'],
    },
    {
      text: 'Explore data',
      expectedUrls: ['explorer', 'files'],
    },
    {
      text: 'Query data',
      expectedUrls: ['query'],
    },
    {
      text: 'Run analysis',
      expectedUrls: ['workspace'],
    },
  ];

  I.scrollPageToBottom();
  I.saveScreenshot('Landing_page_cards_and_buttons.png');

  for (const [key, button] of Object.entries(buttons)) {
    console.log(`checking: ${key}`);
    I.waitForElement({ css: '.index-button-bar' }, 10);
    const btExists = await tryTo(() => I.seeElement({ xpath: `//button[contains(text(), '${button.text}')]` })); // eslint-disable-line no-undef
    if (btExists) {
      const assertionFailureMsg = `button ${button.text} did not redirect user to one of the expected urls ${button.expectedUrls}.`;
      I.click({ xpath: `//button[contains(text(), '${button.text}')]` });
      await sleepMS(500);
      const theUrl = await I.grabCurrentUrl();

      const validURLs = [];
      button.expectedUrls.forEach((expectedUrl) => {
        validURLs.push(`https://${process.env.HOSTNAME}/${expectedUrl}`);
      });

      expect(
        validURLs,
        assertionFailureMsg,
      ).to.include(theUrl);
    } else {
      console.log(`Button ${button.text} does not exist on this landing page. Skipping check...`);
    }
    // Go back to the landing page and try to find / click on the buttons again
    I.amOnPage('');
  }
}).retry(1);
