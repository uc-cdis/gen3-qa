const exportToWorkspaceQuestions = require('./exportToWorkspaceQuestions.js');
const exportToWorkspaceTasks = require('./exportToWorkspaceTasks.js');
const exportToWorkspaceProps = require('./exportToWorkspaceProps.js');

/**
 * exportToWorkspace sequences
 */
module.exports = {
  checkExportDefaultManifestToWorkspace() {
    exportToWorkspaceTasks.goToExplorerPage();
    exportToWorkspaceTasks.exportDefaultManifestToWorkspace();
    exportToWorkspaceQuestions.isManifestSavedToWorkspaceSucceeded();
  },

  checkUnmappedFilesAreInSubmissionPage(fileObjects, isReady) {
    // goto '/submission' page and check file number and sizes are correct
    exportToWorkspaceTasks.goToSubmissionPage();
    const expectedFileCount = fileObjects.length;
    let expectedFileTotalSize = 0;
    if (isReady) {
      expectedFileTotalSize = fileObjects.reduce((acc, cur) => {
        return acc + cur.fileSize;
      }, 0);
    }
    exportToWorkspaceQuestions.isNumberAndSizeOfUnmappedFilesCorrect(expectedFileCount, expectedFileTotalSize);
  },

  async checkUnmappedFilesAreNotInFileMappingPage(fileObjects) {
    // goto '/submission/files' page and check all files are not displayed
    exportToWorkspaceTasks.goToMapFilesPage();
    const unexpectedFileNames = fileObjects.reduce((acc, cur) => {
      acc.push(cur.fileName);
      return acc;
    }, []);
    await exportToWorkspaceQuestions.cannotSeeUnmappedFilesOnPage(unexpectedFileNames);
  },

  async mapFiles(fileObjects, submitterID) {
    // go to "Map My Files" page, and see if all unmapped files names are correctly displayed
    exportToWorkspaceTasks.goToMapFilesPage();
    const expectedFileNames = fileObjects.reduce((acc, cur) => {
      acc.push(cur.fileName);
      return acc;
    }, []);
    exportToWorkspaceQuestions.canSeeAllUnmappedFilesOnPage(expectedFileNames);

    // select all unmapped files, should go to file mapping page `/submission/map`
    exportToWorkspaceTasks.selectFilesAndGotoMappingPage(fileObjects);

    // select project and file node, can see '.input-with-icon' element with select options inside, fill all blanks
    exportToWorkspaceTasks.selectProject();
    exportToWorkspaceTasks.selectFileNode();
    await exportToWorkspaceTasks.fillAllRequiredFields();
    exportToWorkspaceTasks.linksToParentNodes(submitterID);

    // click "submit", can return success status
    exportToWorkspaceTasks.clickSubmit();
    await exportToWorkspaceQuestions.isSuccessfullySubmitted(fileObjects.length);
  },
};
