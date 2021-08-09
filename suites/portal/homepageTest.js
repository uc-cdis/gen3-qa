const fetch = require('node-fetch');

const I = actor();

Feature('Homepage').retry(2);

Scenario('login @portal', async ({ home }) => {
  home.do.goToHomepage();
  home.complete.login();
  I.saveScreenshot('Home_page_after_login_for_debugging.png');
  home.ask.seeDetails();
  home.complete.logout();
});

// To be merged with the above once all Commons move to portal version
// with top bar login button
Scenario('login @portal @topBarLogin', ({ home }) => {
  home.do.goToHomepage();
  home.complete.topBarLogin();
  home.ask.seeDetails();
  home.complete.logout();
});
