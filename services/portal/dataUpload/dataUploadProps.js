/**
 * dataUpload Properties
 */
module.exports = {
  submissionPath: '/submission',
  mapFilesPath: '/submission/files',

  submissionHeaderClass: '.submission-header',

  unmappedFilesHeaderClass: '.map-files',
  unmappedFileRowClass: '.map-files__table-row',

  submissionFormClass: '.map-data-model__form',

  projectSelectionDropdownSelector: '.map-data-model__form-section .Select-arrow',
  testProjectName: 'jnkns-jenkins',
  selectOptionClass: '.Select-option',

  fileNodeSelectionDropdownSelector: '.map-data-model__node-form-section .Select-arrow',
  fileNodeSelectionOuterClass: '.map-data-model__node-form-section .Select-menu-outer',
  fileNodeSelectionFirstItemClass: '.map-data-model__node-form-section .Select-menu-outer .Select-option:first-child',

  fileNodeRequiredFieldTextInputXPath: '//*[contains(@class, "map-data-model__detail-section")]//*[contains(@class, "map-data-model__required-field")]//*[contains(@class, "map-data-model__input")]',
  fileNodeRequiredFieldSelectionInputXPath: '//*[contains(@class, "map-data-model__detail-section")]//*[contains(@class, "map-data-model__required-field")]//*[contains(@class, "map-data-model__dropdown")]',

  selectionArrowXPath: '//span[contains(@class, "Select-arrow")]',
  selectionMenuXPath: '//div[contains(@class, "Select-menu-outer")]',
  firstSelectionItemXPath: '//div[contains(@class, "Select-menu-outer")]//div[contains(@class, "Select-option")][1]',

  parentSelectionXPath: '//*[contains(@class, "map-data-model__parent-id-section")]//*[contains(@class, "map-data-model__dropdown")]',

  submitButtonXPath: '//button[contains(text(), "Submit")]',

  unmappedFilesStringFormat: '%d files | %d B',
  successMessageFormate: '%d files mapped successfully!',
};
