/*
Dummy commit
another dummy commit
 Access GUI tests (PXP-6822)
 This test plan has a few pre-requisites:
 1. The Access Backend component must be declared in the environment's manifest
    "versions": {
      "access-backend": "quay.io/cdis/access-backend:1.0",
 2. The following artifacts must be created by the env. admin under the gen3 secrets folder:
    $ ls $GEN3_SECRETS_PATH/access-backend/
    access-backend.env  dbcreds.json  user.yaml
 3. Test Credentials:
    - SUPER_ADMIN: Declared in the "access-backend.env" file.
      e.g., export SUPER_ADMINS='admin.userX@uchicago.edu'
    - ADMIN: Added through the Access GUI.
*/
Feature('Access GUI @requires-portal @requires-fence');

const { expect } = require('chai');
const stringify = require('json-stringify-safe');
const { interactive, ifInteractive } = require('../../utils/interactive.js');
const {
  getAccessTokenHeader, requestUserInput, sleepMS, parseJwt,
} = require('../../utils/apiUtil');

const ACCESS_API_ENDPOINT = process.env.ACCESS_API_ENDPOINT || 'https://qa-anvil.planx-pla.net';
const ACCESS_FRONTEND_ENDPOINT = process.env.ACCESS_FRONTEND_ENDPOINT || 'https://access-test.planx-pla.net';
const USERS_GITHUB_REPO = process.env.USERS_GITHUB_REPO || 'commons-users';

const dataSetsRaw = [
  'phs000424.c1 phs000424.c1 CF-GTEx',
  'phs001272.c1 phs001272.c1 CMG-Broad-GRU',
  'phs001272.c2 phs001272.c2 CMG-Broad-DS-KRD-RD',
  'phs001272.c3 phs001272.c3 CMG-Broad-HMB-MDS',
  'phs001272.c4 phs001272.c4 CMG-Broad-DS-NIC-EMP-LENF',
];

async function loginFlow(I, scenarioDescription, params = { user: undefined, expectUsers: true }) {
  const scenario = scenarioDescription.replace(/\ /g, '_'); // eslint-disable-line no-useless-escape
  I.amOnPage(ACCESS_API_ENDPOINT);
  await I.setCookie({ name: 'dev_login', value: params.user });

  // login
  I.amOnPage(ACCESS_FRONTEND_ENDPOINT);
  // TODO: move css & xpath locators to a separate props file to improve readability.
  await I.click({ xpath: 'xpath: //button[contains(text(), \'Login from Google\')]' });
  I.saveScreenshot(`${scenario}_consent_page.png`);
  I.waitForElement({ css: '.auth-list' }, 20);
  I.click({ xpath: 'xpath: //button[contains(text(), \'Yes, I authorize.\')]' });
  await sleepMS(3000);
  if (params.expectUsers) {
    await I.seeElement({ css: '.ReactVirtualized__Table__rowColumn' });
  } else {
    // Ensure there are no users under the "Manage Current Users" tab (main page)
    I.dontSeeElement('.ReactVirtualized__Table__rowColumn');
  }
  await I.saveScreenshot(`${scenario}_login_main_page.png`);
  await sleepMS(1000);
}

async function assertSuccessfulOperation(I, operation) {
  await I.seeElement({ css: '.high-light' });
  const successfulOperationMsg = await I.grabTextFrom({ css: '.high-light' });
  expect(successfulOperationMsg).to.include(`Successfully ${operation}`);

  await I.seeElement({ css: '.high-light' });
  I.click({ xpath: 'xpath: //button[contains(text(), \'Close\')]' });

  // check if the PR was created
  const getNumbersOfRecentPRs = await I.sendGetRequest(
    `https://api.github.com/repos/uc-cdis/${USERS_GITHUB_REPO}/pulls?per_page=10`,
    {
      Accept: 'application/json',
      Authorization: `bearer ${process.env.GITHUB_TOKEN}`,
      'Content-Type': 'application/json',
    },
  );
  // console.log(`getNumbersOfRecentPRs: ${stringify(getNumbersOfRecentPRs)}`);
  const sortedPRsList = getNumbersOfRecentPRs.data.sort(
    ((a, b) => new Date(b.created_at) - new Date(a.created_at)),
  );
  const mostRecentPR = sortedPRsList[0];

  return mostRecentPR;
}

BeforeSuite(({ I }) => {
  console.log('Setting up dependencies...');
  I.cache = {};

  if (process.env.GITHUB_TOKEN === undefined) {
    throw new Error('ERROR: There is no github token defined. This test runs some asserttions related to Pull Requests creation, hence, it requires github creds to');
  }

  I.cache.dataSets = [];

  dataSetsRaw.forEach((dataSet) => {
    const [phsConsent, authId, fullName] = dataSet.split(' ');
    const [program, project] = fullName.split(/-(.+)/);
    I.cache.dataSets.push({
      name: fullName,
      phsid: phsConsent,
      authid: authId,
      program,
      project,
    });
  });
});

// Create Datasets in ACCESS
Scenario('Given a payload with minimal info, parse and create data sets in ACCESS backend. @manual', ifInteractive(
  async ({ I }) => {
    if (!I.cache.ACCESS_TOKEN) I.cache.ACCESS_TOKEN = await requestUserInput('Please provide your ACCESS_TOKEN: ');
    for (
      const [_, dataSet] of Object.entries(I.cache.dataSets) // eslint-disable-line no-unused-vars
    ) {
      await I.sendDeleteRequest(
        `${ACCESS_API_ENDPOINT}/access-backend/datasets/${dataSet.phsid}`,
        getAccessTokenHeader(I.cache.ACCESS_TOKEN),
      ); // ignore failures (in case dataSets do not exist)

      await I.sendPostRequest(
        `${ACCESS_API_ENDPOINT}/access-backend/datasets`,
        dataSet,
        getAccessTokenHeader(I.cache.ACCESS_TOKEN),
      );
    }
    const dataSetsCheckResp = await I.sendGetRequest(
      `${ACCESS_API_ENDPOINT}/access-backend/datasets`,
      getAccessTokenHeader(I.cache.ACCESS_TOKEN),
    );

    expect(dataSetsCheckResp).to.have.property('status', 200);
    const result = await interactive(`
            1. [Automated] Check if all Data Sets were created successfully:
                HTTP POST request to: ${ACCESS_API_ENDPOINT}/access-backend/datasets
            Manual verification:
              Response status: ${dataSetsCheckResp.status} // Expect a HTTP 200
              Response data: ${JSON.stringify(dataSetsCheckResp.data)}
                // Expect data sets
            `);
    expect(result.didPass, result.details).to.be.true;
  },
));

// GUI Testing
Scenario('Super Admin: login + edit Admin. @manual', ifInteractive(
  async ({ I }) => {
    if (!I.cache.ACCESS_TOKEN) I.cache.ACCESS_TOKEN = await requestUserInput('Please provide your ACCESS_TOKEN: ');
    const accessTokenJson = parseJwt(I.cache.ACCESS_TOKEN);

    await loginFlow(I, 'Super Admin Edit Admin', { user: accessTokenJson.context.user.name, expectUsers: true });

    // edit
    I.click({ xpath: 'xpath: //button[contains(text(), \'Edit\')]' });
    I.scrollIntoView('.form-info__user-access');
    await sleepMS(1000);
    I.checkOption({ xpath: 'xpath: //input[@type="checkbox"]' });
    await I.saveScreenshot('Granting_access_to_data_set.png');
    I.click({ xpath: 'xpath: //button[contains(text(), \'Save\')]' });

    const mostRecentEditPR = await assertSuccessfulOperation(I, 'updated');
    console.log(`most recent PR: ${stringify(mostRecentEditPR)}`);

    const result = await interactive(`
            1. [Login] Check screenshot and make sure it shows the Access GUI
               containing a list of Admin / PI users.
            Manual verification:
                // Look at the screenshot (Super_Admin_login_main_page.png)
                // inside your 'output' folder.
            2. [Edit] Check if a PR was created by the Edit User operation:
            Manual verification (Note: Timestamp in UTC):
                // url: ${mostRecentEditPR.url}
                // timestamp: ${mostRecentEditPR.created_at}
            `);
    expect(result.didPass, result.details).to.be.true;
  },
));

Scenario('Super Admin: login + add Admin. @manual', ifInteractive(
  async ({ I }) => {
    if (!I.cache.ACCESS_TOKEN) I.cache.ACCESS_TOKEN = await requestUserInput('Please provide your ACCESS_TOKEN: ');
    const accessTokenJson = parseJwt(I.cache.ACCESS_TOKEN);

    await loginFlow(I, 'Super Admin Add Admin', { user: accessTokenJson.context.user.name, expectUsers: true });

    // Add admin
    await I.saveScreenshot('DEBUG_Before_creating_new_admin_user.png');
    I.click({ xpath: 'xpath: //div[@class=\'manage-users__tab\' and contains(text(), \'Add a New User\')]' });
    await I.saveScreenshot('Before_creating_new_admin_user.png');
    I.click('.form-info__detail-select__control');
    await I.saveScreenshot('Creating_new_admin_user.png');
    I.click('#react-select-2-option-0'); // select 'Google mail' option

    I.fillField({ xpath: 'xpath: //li[@class=\'form-info__detail\']/label[contains(text(),\'Name *\')]/following-sibling::input' }, 'Arnold Schwarzenegger');
    // await I.saveScreenshot('Create_admin_user_form_test_1.png');
    I.fillField({ xpath: 'xpath: //li[@class=\'form-info__detail\']/label[contains(text(),\'Organization *\')]/following-sibling::input' }, 'Get to the choppa, now');
    I.fillField({ xpath: 'xpath: //li[@class=\'form-info__detail\']/label[contains(text(),\'eRA Commons ID\')]/following-sibling::input' }, 'ASCHWAR');
    I.fillField({ xpath: 'xpath: //li[@class=\'form-info__detail\']/label[contains(text(),\'ORCID\')]/following-sibling::input' }, '0000-0003-3292-0780'); // fictitious ORCID
    I.fillField({ xpath: 'xpath: //li[@class=\'form-info__detail\']/label[contains(text(),\'Contact Email\')]/following-sibling::input' }, 'cdis.autotest@gmail.com');
    I.fillField({ xpath: 'xpath: //li[@class=\'form-info__detail\']/label[contains(text(),\'Google Email\')]/following-sibling::input' }, 'cdis.autotest@gmail.com');
    I.fillField({ xpath: 'xpath: //li[@class=\'form-info__detail\']/label[contains(text(),\'Access Expiration Date *\')]/following-sibling::input' }, '2021-10-19');
    I.scrollIntoView('.form-info__user-access');
    await sleepMS(1000);
    I.checkOption({ xpath: 'xpath: //input[@type="checkbox"]' });
    await I.saveScreenshot('Create_admin_user_form_fully_filled.png');

    I.click({ xpath: 'xpath: //button[contains(text(), \'Add User\')]' });

    const mostRecentAddPR = await assertSuccessfulOperation(I, 'added');
    console.log(`most recent PR: ${stringify(mostRecentAddPR)}`);

    const result = await interactive(`
            1. [Create] Check if a PR was created by the Add User operation:
            Manual verification (Note: Timestamp in UTC):
                // url: ${mostRecentAddPR.url}
                // timestamp: ${mostRecentAddPR.created_at}
            `);
    expect(result.didPass, result.details).to.be.true;
  },
));

// Tech Debt:
// The "Export to TSV" feature does not expose a TSV assembled in the backend
// The file creation and the download operation are executed in the frontend.
// Hence, with our current testing framework we can't test this easily.
Scenario('Super Admin: export TSV. @manual', ifInteractive(
  async () => {
    const result = await interactive(`
            1. Click on the "Export as TSV" button and download the TSV file.
            2. Make sure it contains the correct information.
               (Including the new Admin user and the project access
                that was granted in previous scenarios).
            `);
    expect(result.didPass, result.details).to.be.true;
  },
));

// Admin GUI Testing
Scenario('Admin: login + add user. @manual', ifInteractive(
  async ({ I }) => {
    await loginFlow(I, 'Admin Add user', { user: 'cdis.autotest@gmail.com', expectUsers: false });

    // Add user
    I.click({ xpath: 'xpath: //div[@class=\'manage-users__tab\' and contains(text(), \'Add a New User\')]' });
    await I.saveScreenshot('Before_creating_new_user.png');
    I.click('.form-info__detail-select__control');
    await I.saveScreenshot('Creating_new_user.png');
    I.click('#react-select-2-option-0'); // select 'Google mail' option

    I.fillField({ xpath: 'xpath: //li[@class=\'form-info__detail\']/label[contains(text(),\'Name *\')]/following-sibling::input' }, 'John Doe');
    // await I.saveScreenshot('Create_admin_user_form_test_1.png');
    I.fillField({ xpath: 'xpath: //li[@class=\'form-info__detail\']/label[contains(text(),\'eRA Commons ID\')]/following-sibling::input' }, 'JDOE');
    I.fillField({ xpath: 'xpath: //li[@class=\'form-info__detail\']/label[contains(text(),\'ORCID\')]/following-sibling::input' }, '0000-0003-3292-0781'); // fictitious ORCID
    I.fillField({ xpath: 'xpath: //li[@class=\'form-info__detail\']/label[contains(text(),\'Contact Email\')]/following-sibling::input' }, 'john.doe999999@gmail.com');
    I.fillField({ xpath: 'xpath: //li[@class=\'form-info__detail\']/label[contains(text(),\'Google Email\')]/following-sibling::input' }, 'john.doe999999@gmail.com');
    I.scrollIntoView('.form-info__user-access');
    // Ensure "Dataset Access" contains only the access the "Super Admin"
    // has has granted this "Admin" (see previous tests)
    const listOfCheckboxes = await I.grabHTMLFrom('.form-info__user-access');
    if (process.env.DEBUG === 'true') {
      console.log(`listOfCheckboxes: ${listOfCheckboxes}`);
    }
    expect(listOfCheckboxes).to.be.equal('<li><input type="checkbox">CF-GTEx (phs000424.c1)</li>');
    await sleepMS(1000);
    I.checkOption({ xpath: 'xpath: //input[@type="checkbox"]' });
    await I.saveScreenshot('Create_user_form_fully_filled.png');

    I.click({ xpath: 'xpath: //button[contains(text(), \'Add User\')]' });

    const mostRecentAddPR = await assertSuccessfulOperation(I, 'added');
    console.log(`most recent PR: ${stringify(mostRecentAddPR)}`);

    const result = await interactive(`
            1. [Login] Check screenshot and make sure it shows the Access GUI
               containing an empty list of users.
            Manual verification:
                // Look at the screenshot (Admin_login_main_page.png) 
                // inside your 'output' folder.
            2. [Create] Check if a PR was created by the Add User operation:
            Manual verification (Note: Timestamp in UTC):
                // url: ${mostRecentAddPR.url}
                // timestamp: ${mostRecentAddPR.created_at}
            `);
    expect(result.didPass, result.details).to.be.true;
  },
));

// Admin GUI Testing
Scenario('Admin: login again + edit and delete user. @manual', ifInteractive(
  async ({ I }) => {
    await loginFlow(I, 'Admin Edit and Delete user', { user: 'cdis.autotest@gmail.com', expectUsers: true });

    // edit
    I.click({ xpath: 'xpath: //button[contains(text(), \'Edit\')]' });
    I.fillField({ xpath: 'xpath: //li[@class=\'form-info__detail\']/label[contains(text(),\'Name *\')]/following-sibling::input' }, 'John Doe2');
    await I.saveScreenshot('Editing_user.png');
    I.click({ xpath: 'xpath: //button[contains(text(), \'Save\')]' });

    const mostRecentEditPR = await assertSuccessfulOperation(I, 'updated');
    console.log(`most recent PR: ${stringify(mostRecentEditPR)}`);

    // click on delete bt (in the same row as the test user created previously)
    I.click({ xpath: 'xpath: //div[@title=\'John Doe2\']/../descendant::button[contains(text(), \'Delete\')]' });
    await sleepMS(1000);
    I.click({ xpath: 'xpath: //div[@class=\'popup__foot\']/descendant::button[contains(text(), \'Delete\')]' });

    const mostRecentDeletePR = await assertSuccessfulOperation(I, 'deleted');
    console.log(`most recent PR: ${stringify(mostRecentDeletePR)}`);

    const result = await interactive(`
            1. [Login] Check screenshot and make sure it shows the Access GUI
               containing a list of users.
            Manual verification:
                // Look at the screenshot (Admin_login_main_page_again.png)
                // inside your 'output' folder.
            2. [Edit] Check if a PR was created by the Edit User operation:
            Manual verification (Note: Timestamp in UTC):
                // url: ${mostRecentEditPR.url}
                // timestamp: ${mostRecentEditPR.created_at} 
            3. [Delete] Check if a PR was created by the Delete User operation:
            Manual verification (Note: Timestamp in UTC)::
                // url: ${mostRecentDeletePR.url}
                // timestamp: ${mostRecentDeletePR.created_at}
            `);
    expect(result.didPass, result.details).to.be.true;
  },
));

// Super Admin GUI test
Scenario('Super Admin: delete Admin user. @manual', ifInteractive(
  async ({ I }) => {
    if (!I.cache.ACCESS_TOKEN) I.cache.ACCESS_TOKEN = await requestUserInput('Please provide your ACCESS_TOKEN: ');
    const accessTokenJson = parseJwt(I.cache.ACCESS_TOKEN);

    await loginFlow(I, 'Super Admin delete Admin', { user: accessTokenJson.context.user.name, expectUsers: true });

    // delete
    await I.saveScreenshot('DEBUG_Before_deleting_new_admin_user.png');
    await I.seeElement({ css: '.ReactVirtualized__Table__rowColumn' });
    // click on delete bt (in the same row as the test admin user created previously)
    I.click({ xpath: 'xpath: //div[@title=\'Arnold Schwarzenegger\']/../descendant::button[contains(text(), \'Delete\')]' });
    await sleepMS(1000);
    I.click({ xpath: 'xpath: //div[@class=\'popup__foot\']/descendant::button[contains(text(), \'Delete\')]' });

    const mostRecentDeletePR = await assertSuccessfulOperation(I, 'deleted');
    console.log(`most recent PR: ${stringify(mostRecentDeletePR)}`);

    const result = await interactive(`
            1. [Delete] Check if a PR was created by the Delete User operation:
            Manual verification:
                // url: ${mostRecentDeletePR.url}
                // timestamp: ${mostRecentDeletePR.created_at}
            `);
    expect(result.didPass, result.details).to.be.true;
  },
));
