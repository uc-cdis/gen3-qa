
Feature('Login');

Scenario('test login', (I) => {
  I.load('https://thanhnd.planx-pla.net');
  I.seeCookie('access_token');
  I.seeHomepageDetails();
});
