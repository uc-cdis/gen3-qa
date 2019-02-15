Feature('Login');

Scenario('login', async (home) => {
  home.do.goToHomepage();
  await home.complete.login();
  home.ask.seeDetails();
  home.complete.logout();
});
