Feature('Login');

Scenario('login @portal', (home) => {
  home.do.goToHomepage();
  home.complete.login();
  home.ask.seeDetails();
  home.complete.logout();
});

/*
Data Setup:
    1. User_1 - Synapse account having access to a project in a brain commons (Commons_1)
*/
Scenario('Synapse Digital ID is shown as the username in brain commons @manual', ifInteractive(
    async (I) => {
      const result = await interactive(`
            1. Log in to Commons_1 (brain commons) as User_1 (synapse account)
            2. Verify that the username shown on home page is the Synapse Digital ID
        `);
      expect(result.didPass, result.details).to, be.true;
    }
));