Feature('Login');

Scenario('login @rabbit', (home) => {
  home.do.goTo();
  home.ask.haveAccessToken();
  home.ask.seeDetails();
});
