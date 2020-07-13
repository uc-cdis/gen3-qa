const indexingProps = require('./indexingProps.js');

const I = actor();

/**
 * indexing Tasks
 */
module.exports = {
  goToIndexingPage() {
    I.amOnPage(indexingProps.path);
  },
};
