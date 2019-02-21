Feature('LinkGoogleAccount');

// const apiUtil = require('../../utils/apiUtil.js');

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
  await fence.complete.linkGoogleAcctMocked(users.mainAcct, users.auxAcct1.googleCreds.email);
  await fence.complete.unlinkGoogleAcct(users.mainAcct);
});

Scenario('extend account link expiration @reqGoogle', async (fence, users) => {
  await fence.complete.linkGoogleAcctMocked(users.mainAcct, users.auxAcct1.googleCreds.email);
  const requestTime = timeNow();
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

/**
 * Disable this test for know - how to check if the link is expired?
 */
// Scenario('link google account - expiration test @reqGoogle', async (fence, users) => {
//   const EXPIRES_IN = 10;
//   const googleProject = fence.props.googleProjectA;

//   // link with custom expiration
//   await fence.complete.forceLinkGoogleAcct(users.mainAcct, googleProject.owner, EXPIRES_IN);

//   // wait for the link to expire
//   await apiUtil.sleep(EXPIRES_IN * 1000);

//   // test that the link is now expired
//   // how?

//   // extend expiration with custom expiration
//   // TODO: can i extend after it's expired? if not: separate scenarios
//   const requestTime = timeNow();
//   const extendRes = await fence.do.extendGoogleLink(users.mainAcct, EXPIRES_IN);
//   fence.ask.linkExtendSuccess(extendRes, requestTime, expires_in=EXPIRES_IN);

//   // wait for the link to expire
//   await apiUtil.sleep(EXPIRES_IN * 1000);

//   // test that the link is now expired
//   // how?

//   await fence.complete.unlinkGoogleAcct(users.mainAcct);
// });