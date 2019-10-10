const coreMetadataPageProps = require('./coreMetadataPageProps.js');

const I = actor();

/**
 * coreMetadataPage Tasks
 */
module.exports = {
  goToCoreMetadataPage(file) {
    const coreMetadataPagePath = `${coreMetadataPageProps.filesPagePath}/${file.did}`;
    I.amOnPage(coreMetadataPagePath);
    I.waitForVisible(coreMetadataPageProps.coreMetadataPageClass, 10);
  },
};
