Feature('Login');

Scenario('login', home => {
  home.do.goTo();
  home.ask.haveAccessToken();
  home.ask.seeDetails();
});
