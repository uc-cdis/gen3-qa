/**
 * Gen3FF Landing Page Properties
 */
module.exports = {
  path: '/landing',
  readyCue: {
    locator: {
      css: '.flex-grow',
    },
  },
  exploreDataButton: {
    locator: {
      xpath: '//a[contains(text(), "Explore Data")]',
    },
  },
  registerYourStudyButton: {
    locator: {
      xpath: '//a[contains(text(), "Register Your Study")]',
    },
  },
};
