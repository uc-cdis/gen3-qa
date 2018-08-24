const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');

const expect = chai.expect;
chai.config.includeStack = true;
chai.config.truncateThreshold = 0;

chai.use(chaiAsPromised);

Feature('GoogleServiceAccount');

/**
 * need to have at least two users in a google project
 * test service acct: both users need to have access
 */
Scenario('Test add SA to project @Testing123', async (fence) => {
  const members = await fence.complete.getProjectMembers('replace with project name?');
  console.log(members);
  fence.ask.membersHasUser(members, { email: 'dcf-avantoluchicago.edu-6@planx-pla.net' });
});
