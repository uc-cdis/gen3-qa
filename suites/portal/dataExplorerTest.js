Feature('Data Explorer');

Scenario('test exploring data using filters and sqon view', async (I) => {
  await I.openDataExplorer();
  I.seeVisualizations();

  // test filters
  const filterTabs = await I.elements('.filter-group__tab');
  for (let i = 0; i < filterTabs.length; i ++) {
    let filterTab = filterTabs[i];
    // click on filter tab
    console.log('select filter tab: ', await I.elementIdText(filterTab.ELEMENT));
    await I.elementIdClick(filterTab.ELEMENT);
    await I.seeInCurrentUrl('/explorer');
    await I.waitForElement('.aggregation-card', 10);

    // click on first filter under each filter group
    const filterGroups = await I.elements('.aggregation-card');
    for (let j = 0; j < filterGroups.length; j ++) {
      let group = filterGroups[j];
      let filterableItem = await I.elementIdElement(group.ELEMENT, '.bucket-item');
      console.log('check filter item ', await I.elementIdText(filterableItem.ELEMENT));
      await I.elementIdClick(filterableItem.ELEMENT);
      I.seeVisualizations();
      I.seeSQON();
      await I.wait(5); // wait for filter item refreshed
    }
  }

  // test SQON view works correctly
  await I.click('.sqon-value');
  I.seeVisualizations();

  // test SQON clear button works 
  await I.click('.sqon-clear');
  I.seeVisualizations();
  I.dontSeeSQON();
});
