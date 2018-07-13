
Feature('Login');

Scenario('test login', (I) => {
  I.load('');
  let test = I.grabCookie('access_token');
  console.log(test)
  I.dontSeeCookie('access_token');
  I.seeCookie('access_token');
  I.seeHomepageDetails();
});
