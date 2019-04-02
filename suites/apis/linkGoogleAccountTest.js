const chai = require('chai');
const expect = chai.expect;

const apiUtil = require('../../utils/apiUtil.js');


Feature('LinkGoogleAccount');


BeforeSuite(async (fence, users) => {
  // Cleanup before suite
  const unlinkResults = Object.values(users).map(user => fence.do.unlinkGoogleAcct(user));
  await Promise.all(unlinkResults);
});

After(async (fence, users) => {
  // Cleanup after each scenario
  const unlinkResults = Object.values(users).map(user => fence.do.unlinkGoogleAcct(user));
  await Promise.all(unlinkResults);
});

function timeNow() {
  return Math.floor(new Date() / 1000);
}

Scenario('link and unlink google account @reqGoogle', async (fence, users) => {
  await fence.complete.linkGoogleAcctMocked(users.mainAcct);
  await fence.complete.unlinkGoogleAcct(users.mainAcct);
});

Scenario('extend account link expiration before it expires @reqGoogle', async (fence, users) => {
  await fence.complete.linkGoogleAcctMocked(users.mainAcct);
  const requestTime = timeNow();
  const extendRes = await fence.do.extendGoogleLink(users.mainAcct);
  fence.ask.linkExtendSuccess(extendRes, requestTime);
  await fence.complete.unlinkGoogleAcct(users.mainAcct);
});

Scenario('extend account link expiration after it expired @reqGoogle', async (fence, users) => {
  // link with short expiration
  const EXPIRES_IN = 5;
  let requestTime = timeNow();
  let linkRes = await fence.complete.linkGoogleAcctMocked(users.mainAcct, loggedInUser=null, expires_in=EXPIRES_IN);
  let linkExpiration = linkRes.finalURL.match(RegExp('exp=([0-9]+)'))[1];
  expect(
    linkExpiration - requestTime,
    `The link should be set to expire in ${EXPIRES_IN} secs`
  ).to.be.within(EXPIRES_IN - 5, EXPIRES_IN + 5);

  // wait for the linking to be expired
  await apiUtil.sleepMS(EXPIRES_IN * 1000);

  // extend the expiration
  requestTime = timeNow();
  const extendRes = await fence.do.extendGoogleLink(users.mainAcct);
  fence.ask.linkExtendSuccess(extendRes, requestTime);

  await fence.complete.unlinkGoogleAcct(users.mainAcct);
});

Scenario('try to unlink when acct is not linked @reqGoogle', async (fence, users) => {
  const linkRes = await fence.do.unlinkGoogleAcct(users.auxAcct2);
  fence.ask.responsesEqual(linkRes, fence.props.resUnlinkNoGoogleAcctLinked);
});

Scenario('try to extend link when acct is not linked @reqGoogle', async (fence, users) => {
  const extendRes = await fence.do.extendGoogleLink(users.mainAcct);
  fence.ask.responsesEqual(extendRes, fence.props.resExtendNoGoogleAcctLinked);
});

Scenario('link an acct that is already linked to this user @reqGoogle', async (fence, users) => {
  await fence.complete.linkGoogleAcctMocked(users.mainAcct);

  // try to link mainAcct to the same account again
  let linkRes = await fence.do.linkGoogleAcctMocked(users.mainAcct, users.mainAcct.googleCreds.email);
  expect(linkRes.finalURL, 'Linking a google account twice should fail').to.contain(fence.props.resAlreadyLinked);

  await fence.complete.unlinkGoogleAcct(users.mainAcct);
});

Scenario('link an acct that is already linked to different user @reqGoogle', async (fence, users) => {
  await fence.complete.linkGoogleAcctMocked(users.mainAcct);

  // try to link auxAcct1 to the account that is already linked to mainAcct
  let linkRes = await fence.do.linkGoogleAcctMocked(users.mainAcct, users.auxAcct1);
  expect(linkRes.finalURL, 'Linking a google account twice should fail').to.contain(fence.props.resAlreadyLinked);

  await fence.complete.unlinkGoogleAcct(users.mainAcct);
});
