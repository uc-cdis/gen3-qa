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
  await fence.complete.linkGoogleAcct(users.mainAcct, users.auxAcct1);
  await fence.complete.unlinkGoogleAcct(users.mainAcct);
}).retry(2);

Scenario('extend account link expiration @reqGoogle', async (fence, users) => {
  await fence.complete.linkGoogleAcct(users.mainAcct, users.auxAcct1);
  const requestTime = timeNow();
  const extendRes = await fence.do.extendGoogleLink(users.mainAcct);
  fence.ask.linkExtendSuccess(extendRes, requestTime);
  await fence.complete.unlinkGoogleAcct(users.mainAcct);
}).retry(2);

Scenario('try to link acct already linked to another acct @reqGoogle', async (fence, users) => {
  await fence.complete.linkGoogleAcct(users.mainAcct, users.auxAcct1);
  const secondLinkRes = await fence.do.linkGoogleAcct(users.auxAcct2, users.auxAcct1);
  fence.ask.linkHasError(secondLinkRes, fence.props.errorLinkedToAnotherAcct);
}).retry(2);

Scenario('try to unlink when acct is not linked @reqGoogle', async (fence, users) => {
  const linkRes = await fence.do.unlinkGoogleAcct(users.auxAcct2);
  fence.ask.responsesEqual(linkRes, fence.props.resUnlinkNoGoogleAcctLinked);
  // fence.ask.unlinkHasError(linkRes, fence.props.linkErrors.noGoogleAcctLinked);
}).retry(2);

Scenario('try to extend link when acct is not linked @reqGoogle', async (fence, users) => {
  const extendRes = await fence.do.extendGoogleLink(users.mainAcct);
  fence.ask.responsesEqual(extendRes, fence.props.resExtendNoGoogleAcctLinked);
  // fence.ask.linkExtendHasError(extendRes, fence.props.linkErrors.noGoogleAcctLinked);
}).retry(2);
