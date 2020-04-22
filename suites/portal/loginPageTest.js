const explorer = require('../../services/portal/explorer/explorerService.js');

Feature('Login');

Scenario('Login redirects to requested page', (login) => {
  explorer.do.goToExplorerPage(); // Navigating to /explorer without loggin in redirects to /login
  login.ask.isCurrentPage();
  login.complete.login();
  explorer.ask.isCurrentPage(); // User is redirected to explorer after logging in
}).tag('@loginRedirect');
