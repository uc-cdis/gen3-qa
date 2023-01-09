module.exports = {
  path: 'discovery',
  readyCue: {
    css: '.discovery-search',
  },
  btnNextPage: {
    css: '.ant-pagination-next[title="Next Page"]',
  },
  txtDiscoverySearch: {
    xpath: '//div[contains(@class,"discovery-search-container")]/span/input[@type="text"]',
  },
  btnAdvancedSearch: {
    xpath: '//button[span[text()="ADVANCED SEARCH"]]',
  },
  btnOpenInWorkspace: {
    xpath: '//button[span[text()="Open In Workspace"]]',
  },
  tagLocator(categoryName, tagName) {
    return { xpath: `//span[text()="${tagName}"]` };
  },
  studyLocator(studyId) {
    return { xpath: `//tr[@data-row-key="${studyId}"]//span[@class="ant-checkbox"]` };
  },
  searchFilterLocator(filter) {
    return { xpath: `//span[text()="${filter}"]/preceding-sibling::span/input[@type="checkbox"]` };
  },
  studySelectorLocator(studyId) {
    return { xpath: `//tr[@data-row-key="${studyId}"]//input[@type="checkbox"]` };
  },
};
