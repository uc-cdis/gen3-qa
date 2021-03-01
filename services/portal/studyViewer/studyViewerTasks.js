const studyViewerProps = require('./studyViewerProps.js');

const I = actor();

module.exports = {

  goToStudyViewerPage() {
    I.amOnPage(studyViewerProps.path); // study-viewer/clinical_trials
    I.waitForVisible(studyViewerProps.studyViewerDivClass, 5); // .study-viewer
    I.saveScreenshot('study_viewer_page.png');
  },

  goToStudyPage() {
    // /study-viewer/clinical_trials/ACTT
    I.amOnPage(studyViewerProps.datasetPath);
    I.waitForVisible(studyViewerProps.datasetDivClass, 5);
    I.saveScreenshot('dataset_page.png');
  },

  async clickRequestAccess() {
    await I.seeElement(studyViewerProps.requestAccessButtonXPath);
    I.click(studyViewerProps.requestAccessButtonXPath);
  },

  async loginToRequestAccess() {
    await I.seeElement(studyViewerProps.loginRAButtonXPath);
    I.click(studyViewerProps.loginRAButtonXPath);
  },

  // testing `Learn More` button
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

  // testing multiple datasets
  async multipleStudyViewer() {
    await this.learnMoreButton();
    await I.seeElement(studyViewerProps.backButton);
    I.saveScreenshot('back_button.png');
    I.click(studyViewerProps.backButton);
    await I.seeElement(studyViewerProps.detailedButtonXPath1);
    I.click(studyViewerProps.detailedButtonXPath1);
    await I.seeElement(studyViewerProps.activeDivClass);
    await I.seeElement(studyViewerProps.learnMoreButtonXPath);
    I.click(studyViewerProps.learnMoreButtonXPath);
    I.amOnPage(studyViewerProps.datasetPath1);
    await I.seeElement(studyViewerProps.studyViewerRelPath);
  },

  // click download button on dataset page
  async clickDownload() {
    await I.seeElement(studyViewerProps.downloadButtonXPath);
    I.saveScreenshot("before_click_download.png")
    I.click(studyViewerProps.downloadButtonXPath);
    await I.waitForVisible(studyViewerProps.modalDivClass, 5);
    I.saveScreenshot('click_download.png');
    I.seeElement(studyViewerProps.modalDownloadButton);
    I.click(studyViewerProps.modalDownloadButton);
    I.click(studyViewerProps.closeButton);
  },
};
