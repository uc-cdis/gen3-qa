const chai = require('chai');
const expect = chai.expect;


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
  await fence.complete.forceLinkGoogleAcct(users.mainAcct, users.auxAcct1.googleCreds.email);
  await fence.complete.unlinkGoogleAcct(users.mainAcct);
});

Scenario('extend account link expiration @reqGoogle', async (fence, users) => {
  await fence.complete.forceLinkGoogleAcct(users.mainAcct, users.auxAcct1.googleCreds.email);
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

Scenario('link an acct that is already linked to this user @reqGoogle', async (fence, users) => {
  await fence.complete.forceLinkGoogleAcct(users.mainAcct, users.mainAcct.googleCreds.email);
  let linkRes = await fence.do.forceLinkGoogleAcct(users.mainAcct, users.mainAcct.googleCreds.email);
  expect(linkRes, 'Linking a google account twice should fail').to.equal(0);
  await fence.complete.unlinkGoogleAcct(users.mainAcct);
});

Scenario('link an acct that is already linked to different user @reqGoogle', async (fence, users) => {
  await fence.complete.forceLinkGoogleAcct(users.mainAcct, users.mainAcct.googleCreds.email);
  let linkRes = await fence.do.forceLinkGoogleAcct(users.auxAcct1, users.mainAcct.googleCreds.email);
  expect(linkRes, 'Linking a google account twice should fail').to.equal(0);
  await fence.complete.unlinkGoogleAcct(users.mainAcct);
});
