Feature('BDcat Tabs and links testing for release sign off');

// To be executed with GEN3_SKIP_PROJ_SETUP=true
// No need to set up program / retrieve access token, etc.
const { expect } = require('chai');
const fenceProps = require('../../../services/apis/fence/fenceProps.js');
const { interactive, ifInteractive } = require('../../../utils/interactive.js');

// Test elaborated for DataSTAGE but it can be reused in other projects
const TARGET_ENVIRONMENT = process.env.GEN3_COMMONS_HOSTNAME || 'qa-dcp.planx-pla.net';

BeforeSuite(async ({ I }) => {
  console.log('Setting up dependencies...');
  I.cache = {};

  if (process.env.TEST_CLIENT_ID === undefined) {
    throw new Error(`ERROR: There is no client_id defined for this ${TARGET_ENVIRONMENT} Test User. Please declare the "TEST_CLIENT_ID" environment variable and try again. Aborting test...`);
  } else if (process.env.TEST_SECRET_ID === undefined) {
    throw new Error(`ERROR: There is no secret_id defined for this ${TARGET_ENVIRONMENT} Test User. Please declare the "TEST_SECRET_ID" environment variable and try again. Aborting test...`);
  } else if (process.env.TEST_IMPLICIT_ID === undefined) {
    throw new Error(`ERROR: There is no implicit_id defined for this ${TARGET_ENVIRONMENT} Test User. Please declare the "TEST_IMPLICIT_ID" environment variable and try again. Aborting test...`);
  }

  I.TARGET_ENVIRONMENT = TARGET_ENVIRONMENT;
  // Fetching public list of DIDs
  const httpResp = await I.sendGetRequest(
    `https://${TARGET_ENVIRONMENT}/index/index`,
  );

  I.cache.records = httpResp.data.records;
});

// Scenario #15 - Run GraphQL Query against Peregrine (Graph Model)
Scenario('Test a GraphQL query from the Web GUI @bdcat @manual', ifInteractive(
  async () => {
    const result = await interactive(`
              1. Login with NIH credentials
              2. Click "Query" tab
              3. Click "Switch to Graph Model" button
              4. On the left pane, enter the following query:
                 {
                   project(first:0) {
                     name
                     dbgap_accession_number
                     code
                   }
                 }

              Should see project(s) your NIH user has access to on the right pane:
                 {
                   "data": {
                     "project": [
                       {
                         "code": "COPD_DS-CS-RD",
                         "dbgap_accession_number": "phs000179.v5.p2.c2",
                         "name": "COPD_DS-CS-RD"
                       }
                     ]
                   }
                 }
              `);
    expect(result.didPass, result.details).to.be.true;
  },
));

// Scenario #17 - Fence public keys endpoint
Scenario('Test Fence\'s public keys endpoint @manual', ifInteractive(
  async ({ I }) => {
    const url = `https://${TARGET_ENVIRONMENT}${fenceProps.endpoints.publicKeysEndpoint}`;
    const httpResp = await I.sendGetRequest(url);

    const result = await interactive(`
              1. [Automated] Go to ${url}
              2. Should see a response like:
                 {
                   keys: [
                     [
                       "fence_key_2019-06-18T19:50:41Z",
                       "-----BEGIN PUBLIC KEY----- ..."
                     ],
                     [
                       "fence_key_key-01",
                       "-----BEGIN PUBLIC KEY----- ..."
                     ]
                   ]
                 }
              Manual verification:
                Response status: ${httpResp.status} // Expect a HTTP 200
                Response data: ${JSON.stringify(httpResp.data)}
                  // Expect a JSON payload containing Public Key info
              `);
    expect(result.didPass, result.details).to.be.true;
  },
));

// Scenario #18 - Make sure custom hyperlinks are found on the portal page
Scenario('Check contact and footer links @bdcat @manual', ifInteractive(
  async ({ I }) => {
    I.amOnPage(` https://${TARGET_ENVIRONMENT}/login`);
    const contactLink = await I.grabTextFrom({ xpath: '//a[contains(@href,"https://biodatacatalyst.nhlbi.nih.gov/contact")]' });
    const foiaLink = await I.grabTextFrom({ xpath: '//a[contains(@href,"https://www.nhlbi.nih.gov/about/foia-fee-for-service-office")]' });
    const accessibilityLink = await I.grabTextFrom({ xpath: '//a[contains(@href,"https://biodatacatalyst.nhlbi.nih.gov/accessibility")]' });
    const hhsLink = await I.grabTextFrom({ xpath: '//a[contains(@href,"https://www.hhs.gov")]' });
    const nihLink = await I.grabTextFrom({ xpath: '//a[contains(@href,"https://www.nih.gov")]' });
    const nhlbiLink = await I.grabTextFrom({ xpath: '//a[contains(@href,"https://www.nhlbi.nih.gov")]' });
    const usaLink = await I.grabTextFrom({ xpath: '//a[contains(@href,"https://www.usa.gov")]' });
    const result = await interactive(`
              1. Go to /login
              2. Expect to see the following links:
              Contact form: https://biodatacatalyst.nhlbi.nih.gov/contact
              Freedom of Information Act (FOIA): https://www.nhlbi.nih.gov/about/foia-fee-for-service-office
              Accessibility: https://biodatacatalyst.nhlbi.nih.gov/accessibility/
              U.S. Department of Health & Human Services: https://www.hhs.gov/
              National Institutes of Health: https://www.nih.gov/
              National Heart, Lung, and Blood Institute: https://www.nhlbi.nih.gov/
              USA.gov: https://www.usa.gov/

              // Automated test:
              Found contact link: ${contactLink.length > 0}
              Found FOIA link: ${foiaLink.length > 0}
              Found Accessibility link: ${accessibilityLink.length > 0}
              Found HHS link: ${hhsLink.length > 0}
              Found NIH link: ${nihLink.length > 0}
              Found NHLBI link: ${nhlbiLink.length > 0}
              Found USA.gov link: ${usaLink.length > 0}
            `);
    expect(result.didPass, result.details).to.be.true;
  },
));

// Scenario #19 - Check privacy policy link
Scenario('Make sure the privacy policy link is configured @bdcat @manual', ifInteractive( // eslint-disable-line codeceptjs/no-skipped-tests
  async ({ I }) => {
    const privacyPolicyHttpResp = await I.sendGetRequest(
      `https://${TARGET_ENVIRONMENT}/user/privacy-policy`,
    );
    const result = await interactive(`
            1. Go to https://platform.sb.biodatacatalyst.nhlbi.nih.gov/
            2. Enter your Credentials to login
            3. When prompted to click "Yes, Authorize." click on "Gen3 Privacy Policy" link
            4. Expected Privacy Policy to be displayed - https://biodatacatalyst.nhlbi.nih.gov/privacy/

            // Semi-automated test:
            // Expect http status to be 200
            privacyPolicyPageStatus: ${privacyPolicyHttpResp.status}
          `);
    expect(result.didPass, result.details).to.be.true;
  },
));

// Scenario #20 - Exploration page
Scenario('Test the exploration page @manual', ifInteractive(
  async () => {
    const result = await interactive(`
              1. Login with NIH credentials
              2. Click "Exploration" tab
              3. Click on the "Subject" tab and make sure the faceted search is working properly:
              // Expect changes in the number of projects and subjects for each interaction with filtering controls
              `);
    expect(result.didPass, result.details).to.be.true;
  },
));

// Scenario #21 - Export to PFB
Scenario('Test the "Export to PFB" button from the Exploration page @manual', ifInteractive(
  async () => {
    // TODO: Parse PFB and validate it
    const result = await interactive(`
              1. Login with NIH credentials
              2. Click "Exploration" tab
              3. Click on the "Case" tab and, under "Project Id", select one of the studies (e.g.: topmed-COPD_DS-CS-RD)
              4. Click on the "Export to PFB" button. A message with the following instructions should appear:
                 " Your export is in progress.
                   Please do not navigate away from this page until your export is finished. "
              5. Once the message is updated and the URL shows up, download the file and check its contents.
              6. Install and run a Python utility to validate the PFB file:
                 a. Run '% pip install pypfb'
                   // Make sure you use Python2.7 (it does not support Py3 yet)
                   // You can also use Docker:
                   e.g.: % docker run -it -v /Users/marcelocostarodrigues/workspace/gen3-qa:/tmp/ quay.io/cdis/py27base:pybase2-1.0.2 /bin/sh
                     # python -m pip install pypfb

                 b. Print the contents of the PFB file: 'pfb show -i ~/Downloads/<downloaded-file-name>.avro'
                   // # cd tmp/; pfb show -i export_2019-11-26T19_34_39.avro
                 c. You can also try to visualize the nodes: 'pfb show -i ~/Downloads/<downloaded-file-name>.avro nodes'
                   // # cd tmp/; pfb show -i export_2019-11-26T19_34_39.avro nodes

              // Expect a valid JSON output
              `);
    expect(result.didPass, result.details).to.be.true;
  },
));

// Scenario #22 - Explorer `Download Manifest` button test
Scenario('Test the "Download Manifest" button from the Exploration page @manual', ifInteractive(
  async () => {
    const result = await interactive(`
              1. Login with NIH credentials
              2. Click "Exploration" tab
              3. Click on the "File" tab and select a project $PROJECT under "Project ID".
              4. Record the number of files selected $FILE_COUNT
              3. Click on the "Case" tab and, under "Project Id", select $PROJECT
              4. Click on the "Download Manifest" button. A 'manifest.json' file should be automatically downloaded.
              5. The manifest.json file should contain $FILE_COUNT object, or sometimes fewer. Run
              $ jq '. | length' /path/to/manifest.json
              NOTE: If there are data files that are not associated with subjects (e.g. Multisample VCFs), this number may
              be slightly smaller than $FILE_COUNT. I'm not sure how to get the exact number of expected data files :facepalm: --@mpingram
              `);
    expect(result.didPass, result.details).to.be.true;
  },
));

// Scenario #23 - Explorer `AND/OR` toggle filter test
Scenario('Test the "AND/OR" toggle filters in the Exploration page @bdcat @manual', ifInteractive(
  async () => {
    const result = await interactive(`
              1. Login with NIH credentials
              2. Click "Exploration" tab
              3. Click on the "Project" tab and select two consent codes $CONSENT_CODES_ARRAY under "Data Use Restriction".
              4. Record the number of subjects selected $SUBJECT_COUNT. The Data Use Restriction values for all records displayed should contain one or both of the selected consent codes in $CONSENT_CODES_ARRAY.
              5. Click the gear toggle in the filter facet that displays the AND/OR toggle. Two buttons should appear. Switch the toggle from OR to AND by clicking the button labeled AND.
              6. Expect changes in the number of projects and subjects. Record the number of subjects selected $SUBJECT_COUNT_2. The number of displayed records should decrease or remain constant: $SUBJECT_COUNT >= $SUBJECT_COUNT_2. The Data Use Restriction values for all records displayed should contain both selected consent codes in $CONSENT_CODES_ARRAY.
              `);
    expect(result.didPass, result.details).to.be.true;
  },
));
