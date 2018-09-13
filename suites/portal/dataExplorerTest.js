Feature('Data Explorer');

// Scenario('test exploring data using filters and sqon view @explorer-only', async (I) => {
//   await I.openDataExplorer();
//   I.seeVisualizations();
//
//   // test filters
//   const filterTabsNumber = await I.grabNumberOfVisibleElements('.filter-group__tab');
//   let sqonValueCount = 0;
//   for (let i = 1; i <= filterTabsNumber; i ++) {
//     I.clickNthFilterTab(i);
//     await I.seeInCurrentUrl('/explorer');
//     await I.waitForElement('.aggregation-card', 10);
//
//     // click on first filter under each filter group
//     const filterGroupsNumber = await I.grabNumberOfVisibleElements('.aggregation-card');
//     for (let j = 1; j <= filterGroupsNumber; j ++) {
//       await I.clickFirstFilterItemUnderNthGroup(j);
//       sqonValueCount ++;
//       I.seeVisualizations();
//       await I.seeSQONLabelsCountCorrect(sqonValueCount);
//       await I.wait(1); // wait for filter item refreshed
//     }
//   }
//
//   // test SQON view works correctly
//   await I.click('.sqon-value');
//   I.seeVisualizations();
//
//   // test SQON clear button works
//   await I.click('.sqon-clear');
//   I.seeVisualizations();
//   I.dontSeeSQON();
// });
//
// Scenario('test arranger service @explorer-only', async I => {
//   let res = await I.pingArranger();
//   I.seeArrangerReturnedCorrectly(res);
//
//   res = await I.arrangerColumnStateQuery();
//   I.seeArrangerReturnedCorrectly(res);
//
//   res = await I.arrangerAggsStateQuery();
//   I.seeArrangerReturnedCorrectly(res);
//
//   res = await I.arrangerSubjectAggregationQuery();
//   I.seeArrangerReturnedCorrectly(res);
// });
