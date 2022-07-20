const { expect } = require('chai');
const { output } = require('codeceptjs');

const I = actor();
I.cache = {};

Feature('Gen3 FF Landing Page @requires-portal @gen3ff');

Scenario('Home page redirects to landing page', async ({ gen3ffLandingPage }) => {
  console.log('In the scenario');
  I.amOnPage('/');
  I.saveScreenshot('home-page.png');
  I.wait(2);
  await gen3ffLandingPage.isCurrentPage();
});
