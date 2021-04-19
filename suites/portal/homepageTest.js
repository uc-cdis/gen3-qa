Feature('Homepage').retry(2);

Scenario('login @portal', async ({ home }) => {
  let sessionCount = 0;
  if (process.env.RUNNING_IN_PROD_TIER === 'true') {
    console.log('INFO: Running in prod-tier environment. Ignore selenium-hub metrics.');
  } else {
    const resp = await fetch('http://selenium-hub:4444/status');
    const respJson = await resp.json();

    const { nodes } = respJson.value;
    if (nodes.length > 0) {
      nodes.forEach((node) => {
        node.slots.forEach((slot) => {
          if (slot.session) {
            sessionCount += 1;
          }
        });
      });
    }
  }
  console.log(`*** COUNT OF SELENIUM SESSIONS: ${sessionCount} ***`);
  home.do.goToHomepage();
  home.complete.login();
  home.ask.seeDetails();
  home.complete.logout();
});

// To be merged with the above once all Commons move to portal version
// with top bar login button
Scenario('login @portal @topBarLogin', ({ home }) => {
  home.do.goToHomepage();
  home.complete.topBarLogin();
  home.ask.seeDetails();
  home.complete.logout();
});
