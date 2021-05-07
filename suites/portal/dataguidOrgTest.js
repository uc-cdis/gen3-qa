Feature('Dataguid.org');

let testURL = '';
if (process.env.RUNNING_LOCAL === 'true') {
  testURL = 'https://dataguids.org';
} else {
  testURL = `https://${process.env.NAMESPACE}.planx-pla.net`;
  console.log(`testURL: ${testURL}`);
}

// Add guids to test data table
const correctGuids = new DataTable(['guids']);
correctGuids.add(['dg.4503/0000085a-4cca-4abd-9bb3-85cdd4a248fd']); // adding guids for "DataSTAGE"
correctGuids.add(['dg.7C5B/00000014-990c-48f2-b0a8-fbb533860512']); // adding guids for "OCC Environmental DC"
correctGuids.add(['00006461-4d2a-4c91-b8ae-b418752ae06b']); // adding guids for "Kids First" which doesn't support prefix
correctGuids.add(['0000047f-772f-4241-980d-1f667686fe60']); // adding guids for "NCI CRDC" which doesn't support prefix
correctGuids.add(['dg.ANV0/0000b4b4-2af4-42e2-9bfa-6fd11e5fb97a']); // adding guids for "AnVIL"

const nonexistentGuids = new DataTable(['nguids']);
nonexistentGuids.add(['dg.ABCD/0000b4b4-2af4-42e2-9bfa-6fd11e5fb97a']); // adding guids with wrong prefix
nonexistentGuids.add(['0000b456-3r56-1dr3-0rt4-6fd11e5fb97a']); // adding non-existent guids

// Pass dataTable to Data()
// Test resolving guids
Data(correctGuids).Scenario('Resolve guids with different prefixes or without prefix @dataguids', ({ I, current }) => {
  I.amOnPage(testURL);
  I.fillField('#guidval', current.guids);
  I.scrollIntoView('#resolveit');
  I.forceClick('#resolveit');
  I.waitForText(current.guids, 2, '#resolverresult');
  I.see(`"id": "${current.guids}"`);
});

// Nagative resolving guids test
Data(nonexistentGuids).Scenario('Negativetest resolving for non-exitent guids @dataguids', ({ I, current }) => {
  I.amOnPage(testURL);
  I.fillField('#guidval', current.nguids);
  I.forceClick('#resolveit');
  I.waitForText(current.nguids, 2, '#resolverresult');
  I.see(`Data GUID "${current.nguids}" not found.`);
});

// Test DRS endpoint
Data(correctGuids).Scenario('Test if DRSendpoint resolve the guids correctly @dataguids', ({ I, current }) => {
  I.amOnPage(`${testURL}/ga4gh/dos/v1/dataobjects/${current.guids}`);
  I.see(`${current.guids}`);
});

// Nagative DRS endpoint test
Data(nonexistentGuids).Scenario('Negativetest DRSendpoint with non-existent guids @dataguids', ({ I, current }) => {
  I.amOnPage(`${testURL}/ga4gh/dos/v1/dataobjects/${current.nguids}`);
  I.see('"error":"no record found"');
});
