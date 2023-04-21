const { Bash } = require('../../../utils/bash.js');

const bash = new Bash();

if (process.env.DEBUG === 'true') {
  console.log('### Fetching the studyViewer index datatype from HOSTNAME');
}
const studyViewerIndex = bash.runCommand('gen3 secrets decode portal-config gitops.json | jq \'.studyViewerConfig[].dataType\' | tr -d \'"\'');
if (process.env.DEBUG === 'true') {
  console.log(`### StudyViewer Index : ${studyViewerIndex}`);
}

module.exports = {
  dataset1Path: `study-viewer/${studyViewerIndex}`,
  dataset2Path: 'study-viewer/clinical_trials/NCT04401579',
  studyViewerDivClass: '.study-viewer',
  studyViewerRelPath: '.study-viewer',
  datasetDivClass: '.study-viewer__title',
  dataset1detailedButtonXPath: '.ant-collapse-header:nth-child(1)',
  dataset2detailedButtonXPath: '//body/div[@id=\'root\']/div[1]/div[1]/div[3]/div[1]/div[1]/div[2]/div[2]/div[1]/'
  + 'div[2]/div[1]/div[1]/div[1]',
  modalDivClass: '.ant-modal-content',
  backButton: '.back-link',

  learnMoreButtonXPath: '//button[contains(text(), \'Learn More\')]',
  loginRAButtonXPath: '//button[contains(text(), \'Login to Request Access\')]',
  requestAccessButtonXPath: '//button[contains(text(), \'Request Access\')]',
  // //button[contains(text(), 'Download')]
  downloadButtonXPath: '//button[contains(text(),\'Download\')]',
  modalDownloadButton: '//a[contains(text(),\'download\')]',
  closeButton: '//button[contains(text(), \'Close\')]',
  // TODO : improve the selector
  disabledButton: '//*[@id="root"]/div/div/div[3]/div/div/div/div[2]/div/div[1]/div/div[1]/div/div/button',

  // describes that dataset details is expanded
  activeDivClass: '.ant-collapse-content-active',
};
