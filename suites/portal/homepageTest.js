Feature('Login');

Scenario('login', (home) => {
  home.do.goToHomepage();
  home.complete.login();
  home.ask.seeDetails();
  home.complete.logout();
}).retry();;
