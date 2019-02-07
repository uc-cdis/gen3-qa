Feature('Login');

Scenario('login', (home) => {
  home.do.goTo();
  home.do.login();
  home.ask.seeDetails();
});
