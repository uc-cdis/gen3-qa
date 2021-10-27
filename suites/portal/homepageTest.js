Feature('Homepage').retry(2);

Scenario('login @portal', async ({ I, home }) => {
  home.do.goToHomepage();
  await home.do.systemUseMsg();
  home.complete.login();
  I.saveScreenshot('Home_page_after_login_for_debugging.png');
  home.ask.seeDetails();
  home.complete.logout();
});
