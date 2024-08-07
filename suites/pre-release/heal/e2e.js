const { expect } = require('chai');
const uuid = require('uuid');
const { interactive, ifInteractive } = require('../../../utils/interactive.js');

const I = actor();

Feature('Test end to end flow for HEAL Discovery Page');

BeforeSuite(async () => {
  I.cache = {};
  I.cache.GUID = uuid.v4();
});

Scenario('Index study tsv manifest', ifInteractive(
  async () => {
    const result = await interactive(`
      1. Create a tsv file named 'indexing.tsv' with the headers - 'GUID', 'md5', 'size', 'acl', 'authz', 'urls'
      2. Navigate to /index/index
      3. Select a record and save the values to 'indexing.tsv' - '${I.cache.GUID}', hashes.md5, size, acl, authz, urls
      4. Navigate to the /indexing page, choose file 'indexing.tsv' and click on 'Index Files' button
      5. Wait for the the indexing job to complete and return a file with extension '.log'
    `);
    expect(result.didPass, result.details).to.be.true;
  },
)).tag('@manual');

Scenario('Publish study metadata', ifInteractive(
  async () => {
    const result = await interactive(`
      1. Navigate to profile page and click on 'Create API key' button and click on 'Download json' button in the popup titled 'Created API Key'
      2. A file named 'credentials.json' is downloaded to your system; save the file to your HOME directory
      3. Create a study tsv file using the GUID in the log file downloaded in the previous test
      4. Clone repo using command 'git clone https://github.com/uc-cdis/gen3sdk-python'
      5. Navigate to the directory 'gen3sdk-python'
      6. Copy the credentials file from step 3 to this folder
      7. Activate the virtual environment using command '. env/bin/activate'
      8. Install dependencies using command 'pip install poetry && poetry install'
      9. Publish data using command 'python -m gen3.cli --auth ~/credentials.json discovery publish ~/discovery.tsv'
    `);
    expect(result.didPass, result.details).to.be.true;
  },
)).tag('@manual');

Scenario('Discovery page layout', ifInteractive(
  async () => {
    const result = await interactive(`
      1. Navigate to /discovery
      2. The top section lists the number of studies and the tags available
      3. The table lists the studies, one study per row
      4. Clicking on a row opens the study details page
      5. There are 3 options to search studies - text search, advanced search and tag search 
    `);
    expect(result.didPass, result.details).to.be.true;
  },
)).tag('@manual');

Scenario('Search for a study - text search', ifInteractive(
  async () => {
    const result = await interactive(`
      1. Navigate to /discovery
      2. Enter a project title in the search bar at the top and click on the search icon
      3. The studies matching the title are shown
      4. Enter text from the summary of a study in the search bar and click on the search icon
      5. The studies with summary containing the text entered are shown
    `);
    expect(result.didPass, result.details).to.be.true;
  },
)).tag('@manual');

Scenario('Search for a study - tag search', ifInteractive(
  async () => {
    const result = await interactive(`
      1. Navigate to /discovery
      2. Click on a few tags listed at the top
      3. Studies pertaining to those tags are shown
    `);
    expect(result.didPass, result.details).to.be.true;
  },
)).tag('@manual');

Scenario('Search for a study - advanced search', ifInteractive(
  async () => {
    const result = await interactive(`
      1. Navigate to /discovery
      2. Click on 'Advanced Search' button above the table
      3. Select a few checkboxes
      4. Studies pertaining to the selected checkboxes are displayed in the table
    `);
    expect(result.didPass, result.details).to.be.true;
  },
)).tag('@manual');

Scenario('Open study in workspace', ifInteractive(
  async () => {
    const result = await interactive(`
      1. Navigate to /discovery
      2. Filter column 'DATA ACCESS' by selecting 'Unaccessible' in the options
      3. The checkboxes in the study rows are disabled
      4. Filter column 'DATA ACCESS' by selecting 'No Data' in the options
      5. The checkboxes in the study rows are disabled
      6. Filter column 'DATA ACCESS' by selecting 'Accessible' in the options
      7. The checkboxes in the study rows are enabled
      8. Select a study by clicking on the checkbox in the row
      9. Click on 'Open in Workspace' button at the top of the table
      10. Select a notebook type
      11. Workspace is opened with the data files pertaining to the study loaded
    `);
    expect(result.didPass, result.details).to.be.true;
  },
)).tag('@manual');
