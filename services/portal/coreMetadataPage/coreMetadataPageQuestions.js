const chai = require('chai');
const coreMetadataPageProps = require('./coreMetadataPageProps.js');

const I = actor();

// The following metadata fields are excluded from being checked because they are either:
// 1. didn't show up in Portal (project_id)
// or
// 2. the string has been reformatted into a different style
// in Portal ('file_size', 'type' and 'updated_datetime')
const excludedFieldList = ['project_id', 'file_size', 'type', 'updated_datetime'];

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

    Object.keys(metadata).forEach(metadataKey => {
      if (excludedFieldList.includes(metadataKey)) {
        I.dontSee(metadata[metadataKey]);
      } else {
        I.see(metadata[metadataKey]);
      }
    });
    }
  },
};
