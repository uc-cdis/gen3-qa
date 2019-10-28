Feature('PelicanExportPfb');

const chai = require('chai');
const {interactive, ifInteractive} = require('../../utils/interactive.js');
const expect = chai.expect;

Scenario('Download whole of the database @manual', ifInteractive(
  async (I) => {
    const result = await interactive(`
        1. The user should login with a valid user login credentials (Google login). After successful login, user should be able to see all the cases in the Graph.
        2. Click on 'Exploration Tab' on the top. Exploration Page is opened with Filters and Cases tables.
        3. Click on 'Export to PFB' button. A pop-on window opens on the bottom of the the page which shows the progress of the export and shows extimated time.
        4. After the export is completed, the pop-on windown will show a pre-assigned URL.
        `);
    expect(result.didPass, result.details).to.be.true;
  }
));

Scenario('Download some of the database @manual', ifInteractive(
  async (I) => {
      const result = await interactive(`
        1. The user should login with a valid user login credentials (Google login). After a successful login, user should be able to see all the cases in the Graph.
        2. Click on 'Exploration Tab' on the top. Exploration Page is opened with Filters and Cases tables.
        3. The user selects some of the filters from the side facet. The cases table should update according to the filter selections.
        4. Click on 'Export to PFB' button. The pop-on window opens on the bottom of the the page which shows the progress of the export and shows extimated time.
        5. After the export is completed, the pop-on windown will show a pre-assigned URL.
        `); 
      expect(result.didPass, result.details).to.be.true;
  }
));

Scenario(`No permission @manual`, ifInteractive(
  async (I) => {
    const result = await interactive(`   
        1. When the user logs in with a valid user login credentials (Google login), but the user do not have permissions to the data commons. 
        2. Click on 'Exploration Tab' on the top of the page after a successful login. All the buttons are disabled.
      `);
    expect(result.didPass, result.details).to.be.true;
  }
));
