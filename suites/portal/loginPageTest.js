const profile = require('../../services/portal/profile/service.js');

Feature('Login');

Scenario('Login redirects to requested page', (login) => {
  profile.do.goToPage(); // Navigating to /explorer without loggin in redirects to /login
  login.ask.isCurrentPage();
  login.complete.login();
  profile.ask.isCurrentPage(); // User is redirected to explorer after logging in
}).tag('@loginRedirect');
