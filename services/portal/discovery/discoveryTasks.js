const props = require('./discoveryProps.js');

const I = actor();

module.exports = {
  goToPage() {
    I.amOnPage(props.path);
    I.wait(5);
    I.saveScreenshot('discoPage.png');
    I.waitForElement(props.readyCue, 30);
    I.wait(2);
  },

  tagSearch(categoryName, tagName) {
    I.saveScreenshot('tag_search.png');
    I.click(props.tagLocator(categoryName, tagName));
  },

  textSearch(inputText) {
    I.click(props.txtDiscoverySearch);
    I.type(inputText, 100);
  },

  advancedSearch(filters) {
    I.click(props.btnAdvancedSearch);
    filters.forEach((filter) => {
      I.checkOption(props.searchFilterLocator(filter));
    });
  },

  openInWorkspace(studyId) {
    I.click(props.studySelectorLocator(studyId));
    I.wait(5);
    I.saveScreenshot('study_selected.png');
    I.seeElementInDOM(props.btnOpenInWorkspace);
    I.click(props.btnOpenInWorkspace);
  },
};
