const dataUploadProps = require('./dataUploadProps.js');
const user = require('../../../utils/user.js');
const I = actor();
const portal = require('../../../utils/portal.js');

/**
 * dataUpload Tasks
 */
module.exports = {
  goToSubmissionPage() {
    I.amOnPage(dataUploadProps.submissionPath);
    portal.waitForVisibleProp(dataUploadProps.submissionHeaderClassLocator, 5);
  },

  goToMapFilesPage() {
    I.amOnPage(dataUploadProps.mapFilesPath);
    portal.waitForVisibleProp(dataUploadProps.unmappedFilesTableClassLocator, 5);
  },

  selectFilesAndGotoMappingPage(fileObjects) {
    // click checkboxes
    fileObjects.forEach(obj => {
      const guid = obj.fileGuid;
      portal.clickProp({locator: `input[id='${guid}']`});
    });
    
    // click "Map Files" and wait for loading 
    I.click("Map Files");
    portal.waitForVisibleProp(dataUploadProps.submissionFormClassLocator, 5);
  },

  selectProject() {
    // TODO
  },
  selectFileNode() {
    // TODO
  },
  fillAllRequireFields() {
    // TODO
  },
  linksToParentNodes() {
    // TODO
  },
  
  clickSubmit() {
    // TODo
  },
};
