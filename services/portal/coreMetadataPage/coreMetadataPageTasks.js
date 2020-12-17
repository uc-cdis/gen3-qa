const coreMetadataPageProps = require('./coreMetadataPageProps.js');

const I = actor();

/**
 * coreMetadataPage Tasks
 */
module.exports = {
  goToCoreMetadataPage(guid) {
    const coreMetadataPagePath = `${coreMetadataPageProps.filesPagePath}/${guid}`;
    I.amOnPage(coreMetadataPagePath);
    I.waitForVisible(coreMetadataPageProps.coreMetadataPageClass, 10);
    I.saveScreenshot('coremetadata_page.png');
  },
};
