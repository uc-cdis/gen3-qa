const props = require('./discoveryProps.js');

const I = actor();

module.exports = {
  goToPage() {
    I.amOnPage(props.path);
  },

  tagSearch(categoryName, tagName) {
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
    I.click(props.btnOpenInWorkspace);
  },
};
