module.exports = {
  path: '/discovery',
  readyCue: {
    css: '.discovery-search',
  },
  btnNextPage: {
    css: '.ant-pagination-next[title="Next Page"]',
  },
  txtDiscoverySearch: {
    css: '.discovery-search > input[type="text"]',
  },
  btnAdvancedSearch: {
    xpath: '//button[span[text()="Advanced Search"]]',
  },
  btnOpenInWorkspace: {
    xpath: '//button[span[text()="Open in Workspace"]]',
  },
  tagLocator(categoryName, tagName) {
    return { xpath: `//h5[text()="${categoryName}"]/following-sibling::span[text()="${tagName}"]` };
  },
  studyLocator(studyId) {
    return { xpath: `//tr[@data-row-key="${studyId}"]` };
  },
  searchFilterLocator(filter) {
    return { xpath: `//span[text()="${filter}"]/preceding-sibling::span/input[@type="checkbox"]` };
  },
  studySelectorLocator(studyId) {
    return { xpath: `//tr[@data-row-key="${studyId}"]//input[@type="checkbox"]` };
  },
};
