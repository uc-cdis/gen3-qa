Feature('Register User For Data Downloading @requires-portal @e2e');

/*
USER STORIES
* As a MIDRC Administrator and Sponsor I want to contact users downloading
* data in the MIDRC data portal. Registering users permits me to know who
* specifically is able to download data, and contact them if necessary.  I want
* to know their full name, organization/affiliation, and email address.

SCENARIOS
* 1. For users who are not registered and not logged in:
*   1) click login button
*   2) click download button on explore page
*   to redirect to login and register page
*   Or they only can browse data, but not download
* 2. For useres who are logged in but not regitered:
*    they will be prompted to fill in registration information
* 3. For useres who are logged in and regitered:
*    they are able to download data
*/

const chai = require('chai');

const { expect } = chai;
const { Bash } = require('../../utils/bash.js');

const bash = new Bash();
const { smartWait } = require('../../utils/apiUtil');

async function getAlltabs(I) {
  // get all tabs which have available data, only do it once
  I.useWebDriverTo('check property of the download button', async ({ browser }) => {
    browser.setWindowSize(1920, 1080);
  });
  I.amOnPage('explorer');
  I.wait(5);
  I.saveScreenshot('explorePageDownloadButton.png');
  // click accept for the user agreement
  I.click('//button[contains(text(), \'Accept\')]');
  // get the number of tabs
  const numOfTbas = await I.grabNumberOfVisibleElements('//button[@role="tab"]');
  for (let i = 1; i < numOfTbas + 1; i += 1) {
    I.waitForClickable(`//button[@role="tab"][position()=${i}]`);
    const tabName = await I.grabTextFrom(`//button[@role="tab"][position()=${i}]`);
    I.click(`//button[@role="tab"][position()=${i}]`);
    I.wait(2);
    I.saveScreenshot(`CheckButtonInTab${i}.png`);
    const disabledbt = '//*[@class="g3-dropdown-button__wrapper g3-dropdown-button__wrapper--disabled "]';
    const btPending = await tryTo(() => I.waitForElement(disabledbt, 2)); // eslint-disable-line
    if (!btPending) {
      I.waitForClickable('//button[contains(text(),"Login to download")]');
      console.log(`### ##Data in ${tabName} is available to download!`);
      I.cache.tabs.push(`//button[@role="tab"][position()=${i}]`);
    } else {
      console.log(`### ##The download button is disabled. The data number of ${tabName} should be 0`);
      I.seeElement('//div[@class="count-box__number--align-center special-number" and text()="0"]');
    }
  }
}

async function waitForFenceAndPortalToRoll() {
  const isPodReady = async function () {
    /**
     * Return true if both fence and presigned-url-fence pods are ready,
     * false otherwise.
     * @returns {boolean}
     */
    for (const service of ['fence', 'presigned-url-fence', 'portal']) {
      // get the status of the most recently started pod
      const res = await bash.runCommand(`g3kubectl get pods -l app=${service} --sort-by=.metadata.creationTimestamp | sed -n '1!p'`);
      if (process.env.DEBUG === 'true') {
        console.log('############');
        console.log(res);
      }
      let notReady = true;
      try {
        notReady = res.includes('0/1') || res.includes('Terminating');
      } catch (err) {
        console.error(`Unable to parse output. Error: ${err}. Output:`);
        console.error(res);
      }
      if (notReady) {
        console.log(`${service} is not ready`);
        return false;
      }
    }
    return true;
  };

  console.log('Waiting for pods to be ready');
  const timeout = 900; // wait up to 15 min
  await smartWait(
    isPodReady,
    [],
    timeout,
    `Fence, presigned-url-fence, or portal pods are not ready after ${timeout} seconds`, // error message
    1, // initial number of seconds to wait
  );
}

// Enable REGISTER_USERS_ON config
BeforeSuite(async ({ I }) => {
  // init I.cache
  I.cache = {};
  I.cache.tabs = [];
  // change fence config and re-roll fence
  console.log('Adding REGISTER_USERS_ON config to fence config');
  // dump the current secret in a temp file.
  // remove the first and last lines ("-------- fence-config.yaml:" and
  // "--------") because they are added again when we edit the secret, and
  // duplicates cause errors.
  await bash.runCommand('gen3 secrets decode fence-config > fence_config_tmp.yaml; sed -i \'1d;$d\' fence_config_tmp.yaml');
  // add the config we need at the bottom of the file
  await bash.runCommand(`cat - >> "fence_config_tmp.yaml" <<EOM
REGISTER_USERS_ON: true
REGISTERED_USERS_GROUP: 'data_uploaders'
EOM`);

  // update the secret
  const res = bash.runCommand('g3kubectl get secret fence-config -o json | jq --arg new_config "$(cat fence_config_tmp.yaml | base64)" \'.data["fence-config.yaml"]=$new_config\' | g3kubectl apply -f -');
  if (process.env.DEBUG === 'true') {
    console.log(res);
  }
  expect(res, 'Unable to update fence-config secret').to.have.string('secret/fence-config configured');

  // roll Fence
  await bash.runCommand('rm fence_config_tmp.yaml; gen3 roll fence; gen3 kube-setup-portal');

  // wait for the pods to roll
  await waitForFenceAndPortalToRoll();
});

// Delete REGISTER_USERS_ON config
AfterSuite(async () => {
  console.log('Deleting REGISTER_USERS_ON config to fence config');
  await bash.runCommand('gen3 secrets decode fence-config > fence_config_tmp.yaml; sed -i \'1d;$d\' fence_config_tmp.yaml');
  // delete lines contained the register user config
  await bash.runCommand('sed -i \'/REGISTER_USERS_ON/d\' fence_config_tmp.yaml; sed -i \'/REGISTERED_USERS_GROUP/d\' fence_config_tmp.yaml');
  // update the secret
  const res = bash.runCommand('g3kubectl get secret fence-config -o json | jq --arg new_config "$(cat fence_config_tmp.yaml | base64)" \'.data["fence-config.yaml"]=$new_config\' | g3kubectl apply -f -');
  if (process.env.DEBUG === 'true') {
    console.log(res);
  }
  expect(res, 'Unable to update fence-config secret').to.have.string('secret/fence-config configured');

  // roll Fence
  await bash.runCommand('rm fence_config_tmp.yaml; gen3 roll fence; gen3 kube-setup-portal');

  // wait for the pods to roll
  await waitForFenceAndPortalToRoll();
});

Scenario('redirect to login page from the download button @registerUser',
  async ({ I }) => {
    await getAlltabs(I);
    for (let i = 0; i < I.cache.tabs.length; i += 1) {
      // Click the tab
      const tab = I.cache.tabs[i];
      I.waitForClickable(tab, 5);
      I.click(tab);
      // Click the button
      I.waitForClickable('//button[contains(text(),"Login to download")][position()=1]', 5);
      I.click('//button[contains(text(),"Login to download")][position()=1]');
      I.click('//button[@class=" g3-dropdown__item "]');
      I.wait(1);
      I.seeCurrentUrlEquals('/login');
      // go back to explore page
      I.amOnPage('explorer');
    }
  });

Scenario('redirect to register page after login @registerUser',
  async ({ I, home, users }) => {
    await home.do.login(users.mainAcct.username);
    I.wait(3);
    I.saveScreenshot('afterLogin.png');
    I.seeCurrentUrlEquals('user/register/');
  });

Scenario('register to get access to download data @registerUser',
  async ({ I, home, users }) => {
    await home.do.login(users.mainAcct.username);
    I.seeCurrentUrlEquals('user/register/');
    I.wait(3);
    I.saveScreenshot('registerPage.png');
    I.fillField('#firstname', 'Cdis');
    I.fillField('#lastname', 'Test');
    I.fillField('#organization', 'Uchiago');
    I.click('//button[contains(text(),\'Register\')]');

    // after complete register
    I.amOnPage('explorer');
    I.wait(5);
    I.saveScreenshot('expolerPageAfterRegisted1.png');
    for (let i = 0; i < I.cache.tabs.length; i += 1) {
      // Click the tab
      const tab = I.cache.tabs[i];
      I.waitForClickable(tab, 5);
      I.click(tab);
      // Click the button
      I.waitForClickable('//button[contains(text(),"Download")][position()=1]', 5);
      I.click('//button[contains(text(),"Download")][position()=1]');
      I.click('//button[@class=" g3-dropdown__item "]');
      // TODO: check download url and check all three file format
    }
  });

Scenario('registered user should have access to download data @registerUser',
  async ({ I, home, users }) => {
    await home.do.login(users.mainAcct.username);
    I.amOnPage('explorer');
    I.wait(5);
    I.saveScreenshot('expolerPageAfterRegisted2.png');
    for (let i = 0; i < I.cache.tabs.length; i += 1) {
      // Click the tab
      const tab = I.cache.tabs[i];
      I.waitForClickable(tab, 5);
      I.click(tab);
      // Click the button
      I.waitForClickable('//button[contains(text(),"Download")][position()=1]', 5);
      I.click('//button[contains(text(),"Download")][position()=1]');
      I.click('//button[@class=" g3-dropdown__item "]');
      // TODO: check download url
    }
  });
