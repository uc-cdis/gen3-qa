const studyViewerProps = require('./studyViewerProps.js');

const I = actor();

module.exports = {

  goToStudyViewerPage() {
    I.amOnPage(studyViewerProps.dataset1Path); // study-viewer/clinical_trials
    I.waitForVisible(studyViewerProps.studyViewerDivClass, 30); // .study-viewer
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
  async learnMoreButton() {
    await I.seeElement(studyViewerProps.dataset1detailedButtonXPath);
    I.saveScreenshot('before_click.png');
    I.click(studyViewerProps.dataset1detailedButtonXPath);
    I.saveScreenshot('after_click.png');
    await I.seeElement(studyViewerProps.activeDivClass);
    await I.seeElement(studyViewerProps.learnMoreButtonXPath);
    I.click(studyViewerProps.learnMoreButtonXPath);
    await I.seeElement(studyViewerProps.datasetDivClass);
  },

  // testing multiple datasets
  async multipleStudyViewer() {
    await this.learnMoreButton();
    await I.seeElement(studyViewerProps.backButton);
    I.saveScreenshot('back_button.png');
    I.click(studyViewerProps.backButton);
    await I.seeElement(studyViewerProps.dataset2detailedButtonXPath);
    I.click(studyViewerProps.dataset2detailedButtonXPath);
    await I.seeElement(studyViewerProps.activeDivClass);
    I.saveScreenshot('expand_dataset_studyViewer.png');
    await I.seeElement(studyViewerProps.learnMoreButtonXPath);
    I.click(studyViewerProps.learnMoreButtonXPath);
    I.amOnPage(studyViewerProps.dataset2Path);
    await I.seeElement(studyViewerProps.studyViewerRelPath);
  },

  // click download button on dataset page
  async clickDownload() {
    await I.seeElement(studyViewerProps.downloadButtonXPath);
    I.saveScreenshot('before_click_download.png');
    I.click(studyViewerProps.downloadButtonXPath);
    await I.waitForVisible(studyViewerProps.modalDivClass, 5);
    I.saveScreenshot('click_download.png');
    I.seeElement(studyViewerProps.modalDownloadButton);
    I.click(studyViewerProps.modalDownloadButton);
    I.click(studyViewerProps.closeButton);
  },
};
