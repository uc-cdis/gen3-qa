Feature('Login');

Scenario('login', async(home) => {
  home.do.goTo();
  await home.complete.login();
  home.ask.seeDetails();
});
