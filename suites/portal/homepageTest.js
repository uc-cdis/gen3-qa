
Feature('Login');

Scenario('test login', async (I) => {
  I.load('');
  I.seeCookie('access_token');
  I.seeHomepageDetails();
});
