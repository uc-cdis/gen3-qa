Feature('Homepage @requires-portal');

Scenario('login @portal', async ({ I, home }) => {
  await home.complete.login();
  I.saveScreenshot('Home_page_after_login.png');
  home.ask.seeDetails();
  await home.complete.logout();
});
