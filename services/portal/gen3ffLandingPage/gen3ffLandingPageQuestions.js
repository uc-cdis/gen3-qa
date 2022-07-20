const props = require('./gen3ffLandingPageProps');

const I = actor();

/**
 * Gen3FF Landing Page Questions
 */
module.exports = {
  isCurrentPage() {
    I.waitUrlEquals(props.path);
  },

  isPageLoaded() {
    I.seeElement(props.readyCue, 30);
  },
};
