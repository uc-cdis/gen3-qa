const chai = require('chai');

const { expect } = chai;

const apiUtil = require('../../utils/apiUtil.js');

Feature('LinkGoogleAccount @requires-fence');

BeforeSuite(({ fence, users }) => {
  // Cleanup before suite
  const unlinkResults = Object.values(users)
    .map(({ user }) => fence.do.unlinkGoogleAcct(user));
  Promise.all(unlinkResults).catch(e => {
    console.log(e);
  });
});

After(({ fence, users }) => {
  // Cleanup after each scenario
  const unlinkResults = Object.values(users).map(({ user }) => fence.do.unlinkGoogleAcct(user));
  Promise.all(unlinkResults).catch(e => {
    console.log(e);
  });
});

function timeNow() {
  return Math.floor(new Date() / 1000);
}

Scenario('link and unlink google account @reqGoogle', async ({ fence, users }) => {
  await fence.complete.linkGoogleAcctMocked(users.mainAcct);
  await fence.complete.unlinkGoogleAcct(users.mainAcct);
}).retry(2);

Scenario('extend account link expiration before it expires @reqGoogle', async ({ fence, users }) => {
  await fence.complete.linkGoogleAcctMocked(users.mainAcct);
  const requestTime = timeNow();
  const extendRes = await fence.do.extendGoogleLink(users.mainAcct);
  fence.ask.linkExtendSuccess(extendRes, requestTime);
  await fence.complete.unlinkGoogleAcct(users.mainAcct);
}).retry(2);

Scenario('extend account link expiration after it expired @reqGoogle', async ({ fence, users }) => {
  // link with short expiration
  const EXPIRES_IN = 5;
  let requestTime = timeNow();
  const linkRes = await fence.complete.linkGoogleAcctMocked(users.mainAcct, EXPIRES_IN);
  const linkExpiration = linkRes.finalURL.match(RegExp('exp=([0-9]+)'))[1];
  expect(
    linkExpiration - requestTime,
    `The link should be set to expire in ${EXPIRES_IN} secs`,
  ).to.be.within(EXPIRES_IN - 5, EXPIRES_IN + 5);

  // wait for the linking to be expired
  await apiUtil.sleepMS(EXPIRES_IN * 1000);

  // extend the expiration
  requestTime = timeNow();
  const extendRes = await fence.do.extendGoogleLink(users.mainAcct);
  fence.ask.linkExtendSuccess(extendRes, requestTime);

  await fence.complete.unlinkGoogleAcct(users.mainAcct);
}).retry(2);

Scenario('try to unlink when acct is not linked @reqGoogle', async ({ fence, users }) => {
  const linkRes = await fence.do.unlinkGoogleAcct(users.auxAcct2);
  fence.ask.responsesEqual(linkRes, fence.props.resUnlinkNoGoogleAcctLinked);
}).retry(2);

Scenario('try to extend link when acct is not linked @reqGoogle', async ({ fence, users }) => {
  const extendRes = await fence.do.extendGoogleLink(users.mainAcct);
  fence.ask.responsesEqual(extendRes, fence.props.resExtendNoGoogleAcctLinked);
}).retry(2);

Scenario('link an acct to a user that already has a linked acct @reqGoogle', async ({ fence, users }) => {
  // link mainAcct to its google account
  await fence.complete.linkGoogleAcctMocked(users.mainAcct);

  // try to link mainAcct to the same google account
  const linkRes = await fence.do.linkGoogleAcctMocked(users.mainAcct);

  expect(linkRes.finalURL, 'Linking a google account twice should fail').to.contain(fence.props.resUserAlreadyLinked);

  await fence.complete.unlinkGoogleAcct(users.mainAcct);
}).retry(2);

Scenario('link an acct that is already linked to a different user @reqGoogle', async ({ fence, users }) => {
  // link user auxAcct1 to mainAcct's google account
  await fence.complete.forceLinkGoogleAcct(users.auxAcct1, users.mainAcct.username);

  // try to link mainAcct to the same google account
  const linkRes = await fence.do.linkGoogleAcctMocked(users.mainAcct);

  expect(linkRes.finalURL, 'Linking a google account twice should fail').to.contain(fence.props.resAccountAlreadyLinked);

  await fence.complete.unlinkGoogleAcct(users.auxAcct1);
  await fence.do.unlinkGoogleAcct(users.mainAcct);
}).retry(2);
