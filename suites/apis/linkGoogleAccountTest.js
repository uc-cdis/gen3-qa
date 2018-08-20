'use strict';

Feature('LinkGoogleAccount');


//TODO: Do I need to check the proxy groups in google to see if the account was added?
function _timeNow() {
  return Math.floor(new Date() / 1000);
}

Scenario('link and unlink google account', async(I, fence) => {
  await fence.complete.linkGoogleAcct(fence.props.googleAcct2);
  await fence.complete.unlinkGoogleAcct();
});


Scenario('extend account link expiration', async(fence) => {
  await fence.complete.linkGoogleAcct(fence.props.googleAcct2);
  let time_request = _timeNow();
  let extend_res = await fence.do.extendGoogleLink();
  fence.ask.linkExtendSuccess(extend_res, time_request);
  await fence.complete.unlinkGoogleAcct();
});


Scenario('try to link acct already linked to another acct', async (fence) => {
  // Need to create 2 more google accounts...
  // need to verify that it's ok to use the google login like I am
  // link acct1 to acct2
  // try to link acct3 to acct2
  // expect link to fail with that error message
});


Scenario('try to unlink when acct is not linked @WIP', async (fence) => {
  // without doing anything, call fence.do.unlinkGoogleAcct()
  // expect it to say it's not linked
  let link_res = await fence.do.unlinkGoogleAcct(fence.props.googleAcct2);
  fence.ask.linkHasError(link_res, fence.props.linkErrors.noGoogleAcctLinked)
});


Scenario('try to extend link when acct is not linked @WIP', async (fence) => {
  // without linking, call fence.do.extendGoogleLink();
  // expect it to say we have not linked acct
  let extend_res = await fence.do.extendGoogleLink();
  fence.ask.linkHasError(extend_res, fence.props.linkErrors.noGoogleAcctLinked)
});


BeforeSuite((fence) => {
  fence.do.unlinkGoogleAcct();
});
