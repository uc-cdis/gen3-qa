Feature('DashboardReports - https://ctds-planx.atlassian.net/browse/PXP-4252 @requires-portal');

const chai = require('chai');
const { interactive, ifInteractive } = require('../../utils/interactive.js');

const { expect } = chai;

const hostname = process.env.HOSTNAME;

Scenario('The dashboard reports should break down data by service @manual', ifInteractive(
  async () => {
    const result = await interactive(`
    Given A user loads the report app at https://${hostname}/dashboard/Secure/reports/index.html
    When Its successful
    THEN response code and response times should be displayed in tabs per services
        `);
    expect(result.didPass, result.details).to.be.true;
  },
));

Scenario('The dashboard reports bucket response times in a useful way @manual', ifInteractive(
  async () => {
    const result = await interactive(`
    Given A user loads the report app at https://${hostname}/dashboard/Secure/reports/index.html
    When Its successful
    THEN response times should be bucketed as : 0-1sec, 1-5sec, 5-10sec, 10+secs
        `);
    expect(result.didPass, result.details).to.be.true;
  },
));

Scenario('The dashboard reports bucket response codes in a useful way @manual', ifInteractive(
  async () => {
    const result = await interactive(`
    Given A user loads the report app at https://${hostname}/dashboard/Secure/reports/index.html
    When Its successful
    THEN response code should include details for error codes 400, 401, 402, 403, 404 and add key
        `);
    expect(result.didPass, result.details).to.be.true;
  },
));

Scenario('The dashboard reports require login to access @manual', ifInteractive(
  async () => {
    const result = await interactive(`
    Given A user loads the report app at https://${hostname}/dashboard/Secure/reports/index.html
    When the user is not logged in
    THEN the user is denied access with a basic error page
        `);
    expect(result.didPass, result.details).to.be.true;
  },
));

Scenario('The dashboard reports gracefully handle no data @manual', ifInteractive(
  async () => {
    const result = await interactive(`
    Given A user loads the report app at https://${hostname}/dashboard/Secure/reports/index.html
    When no data is available
    THEN the reports render a "No Data" message
        `);
    expect(result.didPass, result.details).to.be.true;
  },
));
