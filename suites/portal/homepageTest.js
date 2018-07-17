
Feature('Login');

Scenario('test login', (I) => {
  I.getNodePathToFile();
  I.load('');
  I.seeCookie('access_token');
  I.seeHomepageDetails();
});
