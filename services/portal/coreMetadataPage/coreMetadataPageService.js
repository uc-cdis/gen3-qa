const coreMetadataPageTasks = require('./coreMetadataPageTasks.js');
const coreMetadataPageQuestions = require('./coreMetadataPageQuestions.js');
const coreMetadataPageProps = require('./coreMetadataPageProps.js');
const coreMetadataPageSequences = require('./coreMetadataPageSequences.js');

/**
 * coreMetadataPage Service
 */
module.exports = {
  props: coreMetadataPageProps,

  do: coreMetadataPageTasks,

  ask: coreMetadataPageQuestions,

  complete: coreMetadataPageSequences,
};
