const studyViewerProps = require('./studyViewerProps.js');

const I = actor();

module.exports = {

  goToStudyViewerPage() {
    I.amOnPage(studyViewerProps.path); /// study-viewer/clinical_trials
    I.waitForVisible(studyViewerProps.studyViewerDivClass, 5); // .study-viewer
    I.saveScreenshot('study_viewer_page.png');
  },

  goToStudyPage() {
    // /study-viewer/clinical_trials/ACTT
    I.amOnPage(studyViewerProps.datasetPath);
    I.wait(10);
    I.saveScreenshot('dataset_page.png');
    I.waitForVisible(studyViewerProps.datasetDivClass, 5);
  },

  async clickRequestAccess() {
    await I.seeElement(studyViewerProps.requestAccessButtonXPath);
    I.click(studyViewerProps.requestAccessButtonXPath);
  },

  async loginToRequestAccess() {
    await I.seeElement(studyViewerProps.loginRAButtonXPath);
    I.click(studyViewerProps.loginRAButtonXPath);
  },

  async learnMoreButton() {
    await I.seeElement(studyViewerProps.detailedButtonXPath);
    I.click(studyViewerProps.detailedButtonXPath);
    await I.seeElement(studyViewerProps.activeDivClass);
    I.saveScreenshot('expand_dataset_studyViewer.png');
    await I.seeElement(studyViewerProps.learnMoreButtonXPath);
    I.click(studyViewerProps.learnMoreButtonXPath);
    I.amOnPage(studyViewerProps.datasetPath);
    await I.seeElement(studyViewerProps.studyViewerDivClass);
  },

  async clickDownload() {
    await I.seeElement(studyViewerProps.downloadButtonXPath);
    I.click(studyViewerProps.downloadButtonXPath);
    await I.waitForVisible(studyViewerProps.modalDivClass, 5);
    I.click(studyViewerProps.modalDownloadButton);
    I.click(studyViewerProps.closeButton);
  },
};
