const I = actor();
I.cache = {};

Feature('Gen3 FF Landing Page @requires-portal @requires-frontend-framework @heal');

Scenario('Home page redirects to landing page', async ({ gen3ffLandingPage }) => {
  I.amOnPage('/');
  I.saveScreenshot('home-page.png');
  I.wait(2);
  await gen3ffLandingPage.ask.isCurrentPage();
});

Scenario('Verify HEAL landing page buttons', async ({ gen3ffLandingPage }) => {
  await gen3ffLandingPage.do.goToPage();
  gen3ffLandingPage.do.verifyLandingPageButton('Explore Data', '/discovery');
  await gen3ffLandingPage.do.goToPage();
  gen3ffLandingPage.do.verifyLandingPageButton('Register Your Study', '/study-registration');
  await gen3ffLandingPage.do.goToPage();
  gen3ffLandingPage.do.verifyLandingPageButton('Discover', '/discovery');
  await gen3ffLandingPage.do.goToPage();
  gen3ffLandingPage.do.verifyLandingPageButton('Analyze', '/resource-browser');
  await gen3ffLandingPage.do.goToPage();
  gen3ffLandingPage.do.verifyLandingPageButton('FAQs', '/faqs');
  await gen3ffLandingPage.do.goToPage();
  gen3ffLandingPage.do.verifyLandingPageButton('Tutorials', '/platform_tutorial_videos');
  await gen3ffLandingPage.do.goToPage();
  gen3ffLandingPage.do.verifyLandingPageButton('Resources', '/landing/resource');
}).tag('@heal');
