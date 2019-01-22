const dataUploadQuestions = require('./dataUploadQuestions.js');
const dataUploadTasks = require('./dataUploadTasks.js');
const dataUploadProps = require('./dataUploadProps.js');

/**
 * dataUpload sequences
 */
module.exports = {
  // Sequences are for an service to combine multiple tasks and questions
  async checkUnmappedFilesAreInSubmissionPage(fileObjects, isReady) {
    // goto '/submission' page and check file number and sizes are correct
    dataUploadTasks.goToSubmissionPage();
    const expectedFileCount = fileObjects.length;
    let expectedFileTotalSize = 0;
    if (isReady) {
      expectedFileTotalSize = fileObjects.reduce((acc, cur) => {
        return acc + cur.fileSize;
      }, 0);
    }
    await dataUploadQuestions.isNumberAndSizeOfUnmappedFilesCorrect(expectedFileCount, expectedFileTotalSize);
  },

  async checkUnmappedFilesAreNotInFileMappingPage(fileObjects) {
    // goto '/submission/files' page and check all files are not displayed
    dataUploadTasks.goToMapFilesPage();
    const unexpectedFileNames = fileObjects.reduce((acc, cur) => {
      acc.push(cur.fileName);
      return acc;
    }, []);
    await dataUploadQuestions.cannotSeeUnmappedFilesOnPage(unexpectedFileNames);
  },

  async checkCouldMapFiles(fileObjects) {
    // go to "Map My Files" page, and see if all unmapped files names are correctly displayed
    dataUploadTasks.goToMapFilesPage();
    const expectedFileNames = fileObjects.reduce((acc, cur) => {
      acc.push(cur.fileName);
      return acc;
    }, []);
    dataUploadQuestions.canSeeAllUnmappedFilesOnPage(expectedFileNames);

    // select all unmapped files, should go to file mapping page `/submission/map`
    dataUploadTasks.selectFilesAndGotoMappingPage(fileObjects);

    // select project and file node, can see '.input-with-icon' element with select options inside, fill all blanks
    dataUploadTasks.selectProject();
    dataUploadTasks.selectFileNode();
    await dataUploadTasks.fillAllRequireFields();
    dataUploadTasks.linksToParentNodes();

    // click "submit", can return success status
    dataUploadTasks.clickSubmit();
    dataUploadQuestions.isSuccessfullySubmitted();
  },
};
