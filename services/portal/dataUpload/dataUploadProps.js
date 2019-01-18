/**
 * dataUpload Properties
 */
module.exports = {
  submissionPath: '/submission',
  mapFilesPath: '/submission/files',

  submissionHeaderClassLocator: {
    locator: {
      css: '.submission-header',
    }
  },
  
  unmappedFilesTableClassLocator: {
    locator: {
      css: '.map-files__tables',
    }
  },
  unmappedFileRowClass: '.map-files__table-row',

  submissionFormClassLocator: {
    locator: {
      css: '.map-data-model__form',
    }
  },
  
  // filterTab: {
  //   context: '.some-container',
  //   locator: {
  //     css: '.my-tab-class'
  //   }
  // }

  unmappedFilesStringFormat: '%d files | %dB', 
};
