const studyViewerProps = require('./studyViewerProps.js');

const I = actor();

module.exports = {

  goToStudyViewerPage() {
    I.amOnPage(studyViewerProps.dataset1Path); // study-viewer/clinical_trials
    I.waitForVisible(studyViewerProps.studyViewerDivClass, 5); // .study-viewer
    I.wait(5);
    I.saveScreenshot('study_viewer_page.png');
  },

  // goToStudyPage() {
  //   // /study-viewer/clinical_trials/ACTT
  //   I.amOnPage(studyViewerProps.datasetPath);
  //   I.wait(10);
  //   I.saveScreenshot('dataset_page.png');
  //   I.waitForVisible(studyViewerProps.datasetDivClass, 5);
  // },

  async clickRequestAccess() {
    await I.seeElement(studyViewerProps.requestAccessButtonXPath);
    I.click(studyViewerProps.requestAccessButtonXPath);
  },

  async loginToRequestAccess() {
    await I.seeElement(studyViewerProps.loginRAButtonXPath);
    I.click(studyViewerProps.loginRAButtonXPath);
  },

  // testing `Learn More` button
  learnMoreButton() {
    I.seeElement(studyViewerProps.dataset1detailedButtonXPath);
    I.saveScreenshot('before_click.png');
    I.click(studyViewerProps.dataset1detailedButtonXPath);
    I.saveScreenshot('after_click.png');
    I.seeElement(studyViewerProps.activeDivClass);
    I.seeElement(studyViewerProps.learnMoreButtonXPath);
    I.click(studyViewerProps.learnMoreButtonXPath);
    I.seeElement(studyViewerProps.datasetDivClass);
  },

  // testing multiple datasets
  multipleStudyViewer() {
    this.learnMoreButton();
    I.seeElement(studyViewerProps.backButton);
    I.saveScreenshot('back_button.png');
    I.click(studyViewerProps.backButton);
    I.seeElement(studyViewerProps.dataset2detailedButtonXPath);
    I.click(studyViewerProps.dataset2detailedButtonXPath);
    I.seeElement(studyViewerProps.activeDivClass);
    I.saveScreenshot('expand_dataset_studyViewer.png');
    I.seeElement(studyViewerProps.learnMoreButtonXPath);
    I.click(studyViewerProps.learnMoreButtonXPath);
    I.amOnPage(studyViewerProps.dataset2Path);
    I.seeElement(studyViewerProps.studyViewerRelPath);
  },

  // click download button on dataset page
  async clickDownload() {
    I.seeElement(studyViewerProps.downloadButtonXPath);
    I.saveScreenshot('before_click_download.png');
    I.click(studyViewerProps.downloadButtonXPath);
     I.waitForVisible(studyViewerProps.modalDivClass, 5);
    I.saveScreenshot('click_download.png');
    I.seeElement(studyViewerProps.modalDownloadButton);
    I.click(studyViewerProps.modalDownloadButton);
    I.click(studyViewerProps.closeButton);
  },
};
