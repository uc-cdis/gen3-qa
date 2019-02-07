Feature('Login');

Scenario('login', (home) => {
  home.do.goTo();
  home.complete.login();
  home.ask.seeDetails();
});
