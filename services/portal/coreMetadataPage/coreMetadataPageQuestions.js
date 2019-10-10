const chai = require('chai');
const coreMetadataPageProps = require('./coreMetadataPageProps.js');

const I = actor();

// helper functions that come from portal
const typeTransform = function (type) {
  let t = type.replace(/_/g, ' '); // '-' to ' '
  t = t.replace(/\b\w/g, l => l.toUpperCase()); // capitalize words
  return `| ${t} |`;
};

const fileSizeTransform = function (fileSize) {
  const i = fileSize === 0 ? 0 : Math.floor(Math.log(fileSize) / Math.log(1024));
  const fileSizeStr = (fileSize / (1024 ** i)).toFixed(2) * 1;
  const suffix = ['B', 'KB', 'MB', 'GB', 'TB'][i];
  return `${fileSizeStr} ${suffix}`;
};

const dateTransform = date => `Updated on ${date.substr(0, 10)}`;

/**
 * coreMetadataPage Questions
 */
module.exports = {
  doesCoreMetadataPageLooksCorrect(metadata) {
    console.log('validate the appearance of core metadata page for a given file');
    I.seeElement(coreMetadataPageProps.coreMetadataPageBox1Class);
    I.seeElement(coreMetadataPageProps.coreMetadataPageBox2Class);
    I.seeElement(coreMetadataPageProps.coreMetadataPageBox3Class);

    chai.expect(metadata).to.not.be.undefined;

    for (const metadataKey of Object.keys(metadata)) {
      switch (metadataKey) {
        // no show for 'project_id'
        case 'project_id':
          I.dontSee(metadata[metadataKey]);
          break;
        // special cases for 'file_size', 'type' and 'updated_datetime'
        case 'file_size':
          I.see(fileSizeTransform(metadata[metadataKey]));
          break;
        case 'type':
          I.see(typeTransform(metadata[metadataKey]));
          break;
        case 'updated_datetime':
          I.see(dateTransform(metadata[metadataKey]));
          break;
        // all other fields, showing normally
        default:
          I.see(metadata[metadataKey]);
          break;
      }
    }
  },
};
