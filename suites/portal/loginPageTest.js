const profile = require('../../services/portal/profile/service.js');

const I = actor();

Feature('Login');

Scenario('Login redirects to requested page', ({ login }) => {
  profile.do.goToPage(); // Navigating to /profile without loggin in redirects to /login
  login.ask.isCurrentPage();
  login.complete.login();
  profile.ask.isCurrentPage(); // User is redirected to profile after logging in
}).tag('@loginRedirect');

Scenario('Login redirects to requested page with query params intact', async ({ login }) => {
  I.amOnPage('/DEV-test/search?node_type=summary_clinical');
  login.ask.isCurrentPage();
  login.complete.login();
  await I.saveScreenshot('Post_login_page_for_debugging.png');
  const theURL = await I.grabCurrentUrl();
  console.log(`${new Date()} - INFO: Current URL: ${theURL}`);
  I.seeInCurrentUrl('/DEV-test/search?node_type=summary_clinical');
}).tag('@loginRedirect');
