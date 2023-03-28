const chai = require('chai');
const coreMetadataPageProps = require('./coreMetadataPageProps.js');

const I = actor();

// Some metadata fields ('project_id' for now) should not show up in the page
const noShowFieldList = ['project_id'];
// Some metadata fields should show but we don't check the content since they
// are reformatted into an different format in Portal
const noCheckFieldList = ['file_size', 'type', 'updated_datetime', 'citation'];

/**
 * coreMetadataPage Questions
 */
module.exports = {
  doesCoreMetadataPageLookCorrect(metadata) {
    console.log('validate the appearance of core metadata page for a given file');
    // validate UI components
    I.seeElement(coreMetadataPageProps.coreMetadataPagePictureClass);
    I.seeElement(coreMetadataPageProps.coreMetadataPageHeaderClass);
    I.seeElement(coreMetadataPageProps.coreMetadataPageTableClass);
    I.seeElement(coreMetadataPageProps.backLinkClass);
    I.seeElement(coreMetadataPageProps.downloadButtonXPath);
    I.see(coreMetadataPageProps.tableTitleText);

    chai.expect(metadata).to.not.be.undefined;

    Object.keys(metadata).forEach((metadataKey) => {
      if (noShowFieldList.includes(metadataKey)) {
        I.dontSee(metadata[metadataKey]);
      } else if (!noCheckFieldList.includes(metadataKey)) {
        I.see(metadata[metadataKey]);
      }
    });
  },
};
