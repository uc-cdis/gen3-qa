/*
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
      e.g., export SUPER_ADMINS='cdis.autotest@gmail.com'
    - ADMIN: Added through the Access GUI.
*/
Feature('Access GUI');

const { expect } = require('chai');
const { interactive, ifInteractive } = require('../../utils/interactive.js');
const {
  getAccessTokenHeader, requestUserInput, sleepMS, parseJwt,
} = require('../../utils/apiUtil');

const ACCESS_API_ENDPOINT = process.env.GEN3_COMMONS_HOSTNAME || 'https://qa-anvil.planx-pla.net';
const ACCESS_FRONTEND_ENDPOINT = process.env.GEN3_COMMONS_HOSTNAME || 'https://access-test.planx-pla.net';

const dataSetsRaw = [
  'phs000424.c1 phs000424.c1 CF-GTEx',
  'phs001272.c1 phs001272.c1 CMG-Broad-GRU',
  'phs001272.c2 phs001272.c2 CMG-Broad-DS-KRD-RD',
  'phs001272.c3 phs001272.c3 CMG-Broad-HMB-MDS',
  'phs001272.c4 phs001272.c4 CMG-Broad-DS-NIC-EMP-LENF',
];

BeforeSuite((I) => {
  console.log('Setting up dependencies...');
  I.cache = {};

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

/*
// Create Datasets in ACCESS
Scenario('Given a payload with minimal info, parse and create data sets in ACCESS backend. @manual', ifInteractive(
  async (I) => {
    let createDataSetsResp;
    if (!I.cache.ACCESS_TOKEN) I.cache.ACCESS_TOKEN = await requestUserInput('Please provide your ACCESS_TOKEN: ');
    for (const [_, dataSet] of Object.entries(I.cache.dataSets)) {
      const deleteDataSetsResp = await I.sendDeleteRequest(
        `${ACCESS_API_ENDPOINT}/access-backend/datasets/${dataSet.phsid}`,
        getAccessTokenHeader(I.cache.ACCESS_TOKEN),
      ); // ignore failures (in case dataSets do not exist)

      createDataSetsResp = await I.sendPostRequest(
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
            1. [Automated] Something something
                HTTP POST request to: ${ACCESS_API_ENDPOINT}/access-backend/datasets
            Manual verification:
              Response status: ${dataSetsCheckResp.status} // Expect a HTTP 200
              Response data: ${JSON.stringify(dataSetsCheckResp.data)}
                // Expect data sets
            `);
    expect(result.didPass, result.details).to.be.true;
  },
));
*/

// GUI Testing
Scenario('Super Admin: login + edit, delete, add Admin and export TSV. @manual', ifInteractive(
  async (I) => {
    if (!I.cache.ACCESS_TOKEN) I.cache.ACCESS_TOKEN = await requestUserInput('Please provide your ACCESS_TOKEN: ');
    const accessTokenJson = parseJwt(I.cache.ACCESS_TOKEN);

    I.amOnPage(ACCESS_API_ENDPOINT);
    await I.setCookie({ name: 'dev_login', value: accessTokenJson.context.user.name });

    I.amOnPage(ACCESS_FRONTEND_ENDPOINT);
    I.click({ xpath: 'xpath: //button[contains(text(), \'Login from Google\')]' });
    I.saveScreenshot('Super_Admin_consent_page.png');
    I.waitForElement({ css: '.auth-list' }, 20);
    I.click({ xpath: 'xpath: //button[contains(text(), \'Yes, I authorize.\')]' });
    await sleepMS(3000);
    await I.seeElement({ css: '.ReactVirtualized__Table__rowColumn' }), 10;
    await I.saveScreenshot('Super_Admin_login_main_page.png');
    await sleepMS(1000);
    const result = await interactive(`
            1. [Automated] Check screenshot and make sure it shows the Access GUI
               containing a list of Admin / PI users.
            Manual verification:
                // Look at the screenshot (Super_Admin_login_main_page.png) 
                // inside your 'output' folder.
            `);
    expect(result.didPass, result.details).to.be.true;
  },
));

/*
// GUI Testing
Scenario('Admin: login + add user, export TSV Edit. @manual', ifInteractive(
  async (I) => {
    if (!I.cache.ACCESS_TOKEN) I.cache.ACCESS_TOKEN = await requestUserInput('Please provide your ACCESS_TOKEN: ');
    // TODO
    const result = await interactive(`
            1. [Automated] Something something
                HTTP POST request to: ${ACCESS_API_ENDPOINT}/datasets
            Manual verification:
              Response status: ${createDataSetsResp.status} // Expect a HTTP 200
              Response data: ${JSON.stringify(createDataSetsResp.body)}
                // Expect something
            `);
    expect(result.didPass, result.details).to.be.true;
  },
));

// GUI Testing
Scenario('Super Admin: login again + check if Users are visible under Admin. @manual', ifInteractive(
  async (I) => {
    if (!I.cache.ACCESS_TOKEN) I.cache.ACCESS_TOKEN = await requestUserInput('Please provide your ACCESS_TOKEN: ');
    // TODO
    const result = await interactive(`
            1. [Automated] Something something
                HTTP POST request to: ${ACCESS_API_ENDPOINT}/datasets
            Manual verification:
              Response status: ${createDataSetsResp.status} // Expect a HTTP 200
              Response data: ${JSON.stringify(createDataSetsResp.body)}
                // Expect something
            `);
    expect(result.didPass, result.details).to.be.true;
  },
));

// GUI Testing
Scenario('Admin: login again + edit and delete user. @manual', ifInteractive(
  async (I) => {
    if (!I.cache.ACCESS_TOKEN) I.cache.ACCESS_TOKEN = await requestUserInput('Please provide your ACCESS_TOKEN: ');
    // TODO
    const result = await interactive(`
            1. [Automated] Something something
                HTTP POST request to: ${ACCESS_API_ENDPOINT}/datasets
            Manual verification:
              Response status: ${createDataSetsResp.status} // Expect a HTTP 200
              Response data: ${JSON.stringify(createDataSetsResp.body)}
                // Expect something
            `);
    expect(result.didPass, result.details).to.be.true;
  },
));*/
