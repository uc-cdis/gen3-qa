const coreMetadataTasks = require('./coreMetadataTasks.js');
const coreMetadataQuestions = require('./coreMetadataQuestions.js');
const coreMetadataProps = require('./coreMetadataProps.js');
const coreMetadataSequences = require('./coreMetadataSequences.js');

/**
 * coreMetadata Service
 */
module.exports = {
  props: coreMetadataProps,

  do: coreMetadataTasks,

  ask: coreMetadataQuestions,

  complete: coreMetadataSequences,
};
