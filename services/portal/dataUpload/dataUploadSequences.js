const dataUploadQuestions = require('./dataUploadQuestions.js');
const dataUploadTasks = require('./dataUploadTasks.js');

/**
 * dataUpload sequences
 */
module.exports = {
  checkUnmappedFilesAreInSubmissionPage(I, fileObjects, isReady) {
    // goto '/submission' page and check file number and sizes are correct
    dataUploadTasks.goToSubmissionPage();
    I.saveScreenshot('checkUnmappedFilesAreInSubmissionPage.png');
    const expectedFileCount = fileObjects.length;
    let expectedFileTotalSize = 0;
    if (isReady) {
      expectedFileTotalSize = fileObjects.reduce((acc, cur) => acc + cur.fileSize, 0);
    }
    dataUploadQuestions.isNumberAndSizeOfUnmappedFilesCorrect(
      expectedFileCount,
      expectedFileTotalSize,
    );
  },

  async checkUnmappedFilesAreNotInFileMappingPage(I, fileObjects) {
    // goto '/submission/files' page and check all files are not displayed
    dataUploadTasks.goToMapFilesPage();
    I.saveScreenshot('checkUnmappedFilesAreNotInFileMappingPage.png');
    const unexpectedFileNames = fileObjects.reduce((acc, cur) => {
      acc.push(cur.fileName);
      return acc;
    }, []);
    await dataUploadQuestions.cannotSeeUnmappedFilesOnPage(unexpectedFileNames);
  },

  async mapFiles(I, fileObjects, submitterID) {
    // go to "Map My Files" page, and see if all unmapped files names are correctly displayed
    dataUploadTasks.goToMapFilesPage();
    I.saveScreenshot('checkUnmappedFilesAreNotInFileMappingPage_goToMapFilesPage.png');
    const expectedFileNames = fileObjects.reduce((acc, cur) => {
      acc.push(cur.fileName);
      return acc;
    }, []);
    dataUploadQuestions.canSeeAllUnmappedFilesOnPage(
      expectedFileNames,
    );

    // select all unmapped files, should go to file mapping page `/submission/map`
    dataUploadTasks.selectFilesAndGotoMappingPage(fileObjects);
    I.saveScreenshot('checkUnmappedFilesAreNotInFileMappingPage_selectFilesAndGotoMappingPage.png');
    // select project and file node, can see '.input-with-icon'
    // element with select options inside, fill all blanks
    dataUploadTasks.selectProject();
    dataUploadTasks.selectFileNode();
    await dataUploadTasks.fillAllRequiredFields();
    dataUploadTasks.linksToParentNodes(submitterID);

    // click "submit", can return success status
    dataUploadTasks.clickSubmit();
    await dataUploadQuestions.isSuccessfullySubmitted(fileObjects.length);
  },
};
