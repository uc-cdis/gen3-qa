const props = require('./workspaceProps.js');

const I = actor();

module.exports = {
  isCurrentPage() {
    I.waitUrlEquals(props.path);
  },

  isPageLoaded() {
    I.seeElement(props.readyCue, 30);
  },

  isStudyFound(studyId) {
    I.seeElement(props.studyLocator(studyId));
  },
};
