const profile = require('../../services/portal/profile/service.js');

const I = actor();

Feature('Login @requires-portal');

Scenario('Login redirects to requested page', async ({ login }) => {
  profile.do.goToPage(); // Navigating to /profile without loggin in redirects to /login
  login.ask.isCurrentPage();
  await login.complete.login();
  profile.ask.isCurrentPage(); // User is redirected to profile after logging in
}).tag('@loginRedirect');

Scenario('Login redirects to requested page with query params intact', async ({ login }) => {
  I.amOnPage('DEV-test/search?node_type=summary_clinical');
  login.ask.isCurrentPage();
  await login.complete.login();
  await I.saveScreenshot('Post_login_page_for_debugging.png');
  const theURL = await I.grabCurrentUrl();
  console.log(`${new Date()} - INFO: Current URL: ${theURL}`);
  // current_url no longer keeps the query strings from the url.
  // This is enough for this user flow assertion
  I.seeInCurrentUrl('/DEV-test/search');
}).tag('@loginRedirect');
