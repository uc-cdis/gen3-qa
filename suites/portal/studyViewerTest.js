Feature('Dataset Browser / Study Viewer');

const chai = require('chai');
const { interactive, ifInteractive } = require('../../utils/interactive.js');

const { expect } = chai;

/* User without access */
Scenario('User1 has no access to download @manual', ifInteractive(
  async () => {
    const result = interactive(`
              1. Go to the Study Viewer Page
              2. Select the dataset that is needed for research
              3. Click on 'Request Access' button to acquire access to download
              4. User will receive request_id from 'Request Access Queue'
              5. User makes a manual call to Requestor to validate the 'request_id' received
              6. Go back to the page and user will have access to 'Download' button 
              7. Click in 'Download' button to download the file from indexd
          `);
    expect(result.didPass, result.details).to.be.true;
  },
));

Scenario('User2 has access to download @manual', ifInteractive(
  async () => {
    const result = interactive(`
              1. Go to the Study Viewer Page
              2. Select the dataset that is needed for research
              3. Click on 'Download' button to download the file from indexd
          `);
    expect(result.didPass, result.details).to.be.true;
  },
));
