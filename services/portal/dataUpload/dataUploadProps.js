/**
 * dataUpload Properties
 */
module.exports = {
  submissionPath: 'submission',
  mapFilesPath: 'submission/files',

  submissionHeaderClass: '.submission-header',

  unmappedFilesHeaderClass: '.map-files',
  unmappedFileRowClass: '.map-files__table-row',

  submissionFormClass: '.map-data-model__form',

  projectSelectionDropdownSelector: '//*[contains(@class, "map-data-model__form-section")]//*[contains(@class, "Select-arrow") or contains(@class, "react-select__indicator")]',
  testProjectName: 'jnkns-jenkins',
  selectOptionClass: '//*[contains(@class, "Select-option") or contains(@class, "react-select__option")]',

  fileNodeSelectionDropdownSelector: '//*[contains(@class, "map-data-model__node-form-section")]//*[contains(@class, "Select-arrow") or contains(@class, "react-select__indicator")]',
  fileNodeSelectionOuterClass: '//*[contains(@class, "map-data-model__node-form-section")]//*[contains(@class, "Select-menu-outer") or contains(@class, "react-select__menu")]',
  fileNodeSelectionFirstItemClass: '//*[contains(@class, "map-data-model__node-form-section")]//*[contains(@class, "Select-menu-outer") or contains(@class, "react-select__menu")]//*[contains(@class, "Select-option") or contains(@class, "react-select__option")][1]',

  fileNodeRequiredFieldTextInputXPath: '//*[contains(@class, "map-data-model__detail-section")]//*[contains(@class, "map-data-model__required-field")]//*[contains(@class, "map-data-model__input")]',
  fileNodeRequiredFieldSelectionInputXPath: '//*[contains(@class, "map-data-model__detail-section")]//*[contains(@class, "map-data-model__required-field")]//*[contains(@class, "map-data-model__dropdown")]',

  selectionArrowXPath: '//span[contains(@class, "Select-arrow") or contains(@class, "react-select__indicator")]',
  selectionMenuXPath: '//div[contains(@class, "Select-menu-outer") or contains(@class, "react-select__menu")]',
  firstSelectionItemXPath: '//div[contains(@class, "Select-menu-outer") or contains(@class, "react-select__menu")]//div[contains(@class, "Select-option") or contains(@class, "react-select__option")][1]',

  parentSelectionXPath: '//*[contains(@class, "map-data-model__parent-id-section")]//*[contains(@class, "map-data-model__dropdown")]',

  submitButtonXPath: '//button[contains(text(), "Submit")]',

  unmappedFilesStringFormat: '%d files | %d B',
  successMessageFormate: '%d files mapped successfully!',
};
