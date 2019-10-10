const coreMetadataPageQuestions = require('./coreMetadataPageQuestions.js');
const coreMetadataPageTasks = require('./coreMetadataPageTasks.js');

/**
 * coreMetadataPage sequences
 */
module.exports = {
  /* The 'check file metadata page appearance' test sequence */
  checkFileCoreMetadataPage(metadata) {
    coreMetadataPageTasks.goToCoreMetadataPage(metadata.object_id);
    coreMetadataPageQuestions.doesCoreMetadataPageLooksCorrect(metadata);
  },
};
