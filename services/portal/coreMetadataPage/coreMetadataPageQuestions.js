const coreMetadataPageProps = require('./coreMetadataPageProps.js');
const chai = require('chai');

const expect = chai.expect;
const I = actor();

// helper functions that come from portal
const fileTypeTransform = function (fileType) {
  let t = fileType.replace(/_/g, ' '); // '-' to ' '
  t = t.replace(/\b\w/g, l => l.toUpperCase()); // capitalize words
  return `| ${t} |`;
};

const fileSizeTransform = function (fileSize) {
  const i = fileSize === 0 ? 0 : Math.floor(Math.log(fileSize) / Math.log(1024));
  const fileSizeStr = (fileSize / (1024 ** i)).toFixed(2) * 1;
  const suffix = ['B', 'KB', 'MB', 'GB', 'TB'][i];
  return `${fileSizeStr} ${suffix}`;
};

/**
 * coreMetadataPage Questions
 */
module.exports = {
  doesCoreMetadataPageLooksCorrect(metadata) {
    console.log('validate the appearance of CoreMetadataPage for a given file');
    I.seeElement(coreMetadataPageProps.coreMetadataPageBox1Class);
    I.seeElement(coreMetadataPageProps.coreMetadataPageBox2Class);
    I.seeElement(coreMetadataPageProps.coreMetadataPageBox3Class);

    expect(metadata).to.not.be.undefined;
    const metadataJson = JSON.parse(metadata);
    
  },
};

