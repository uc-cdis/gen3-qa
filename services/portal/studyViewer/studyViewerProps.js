module.exports = {
  path: '/study-viewer/clinical_trials',
  datasetPath: '/study-viewer/clinical_trials/ACTT',
  studyViewerDivClass: '.study-viewer',
  datasetDivClass: '.study-viewer__title',
  detailedButtonXPath: '.ant-collapse-header',
  modalDivClass: '.ant-modal-header',

  learnMoreButtonXPath: '//button[contains(text(), \'Learn More\')]',
  loginRAButtonXPath: '//button[contains(text(), \'Login to Request Access\')]',
  requestAccessButtonXPath: '//button[contains(text(), \'Request Access\')]',
  downloadButtonXPath: '//button[contains(text(), \'Download\')]',
  modalDownloadButton: '//a[contains(text(), \'download\')]',
  closeButton: '//button[contains(text(), \'Close\')]',

  // describes that dataset details is expanded
  activeDivClass: '.ant-collapse-content-active',
};
