Feature('RAS cronjob validation');

const { expect } = require('chai');
const { interactive, ifInteractive } = require('../../utils/interactive.js');

const TARGET_ENVIRONMENT = process.env.GEN3_COMMONS_HOSTNAME;

Scenario('Validate fence-visa-update job @manual', ifInteractive(
  async () => {
    const result = await interactive(`
            1. Get a new passport from /userinfo endpoint
            2. Log into ${TARGET_ENVIRONMENT} with RAS Login (RAs user and password)
            3. run `gen3 job run fence-visa-update`
            4. run `gen3 psql fence`
            5. check ga4gh_visa_v1 table for the new entry
        `);
    expect(result.didPass, result.details).to.be.true;
  },
));
