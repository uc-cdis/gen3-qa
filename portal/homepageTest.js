
Feature('Login');

Scenario('test login', (I) => {
  I.load('');
  I.seeCookie('access_token');
  I.seeHomepageDetails();
});
