Feature('RAS cronjob validation');

const { expect } = require('chai');
const { interactive, ifInteractive } = require('../../utils/interactive.js');

const TARGET_ENVIRONMENT = process.env.GEN3_COMMONS_HOSTNAME;

Scenario('Validate fence-visa-update job @manual', ifInteractive(
  async () => {
    const result = await interactive(`
            1. Get a new passport from RAS /userinfo endpoint
            2. Log into ${TARGET_ENVIRONMENT} with RAS Login (RAS user and password)
            3. Check ga4gh_visa_v1 table by command 'gen3 psql fence'
                - number of visas for the user
                - check the JTI and expiration on the visa
            (SQL QUERY - 'SELECT user_id, ga4gh_visa, expires FROM ga4gh_visa_v1 WHERE user_id=<RAS user id> ORDER BY expires DESC;' )
            4. Run 'gen3 job run fence-visa-update'
            5. Run 'gen3 psql fence'
            6. Again check ga4gh_visa_v1 table for the new entry
                - number of visa(s) for the user (the number should be more)
                - the JTI(s) and expiration(s) on the new visa(s) should be different
            (SQL QUERY - 'SELECT user_id, ga4gh_visa, expires FROM ga4gh_visa_v1 WHERE user_id=<RAS user id> ORDER BY expires DESC;' ) 
        `);
    expect(result.didPass, result.details).to.be.true;
  },
));
