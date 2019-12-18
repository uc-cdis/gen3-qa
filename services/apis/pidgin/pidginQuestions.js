const chai = require('chai');

const { expect } = chai;
chai.config.includeStack = true;
chai.config.truncateThreshold = 0;


/**
 * pidgin Questions
 */
module.exports = {

  seeJsonCoremetadata(file, metadata) {
    let data;
    try {
      data = (typeof metadata === 'string') ? JSON.parse(metadata) : metadata;
    } catch (error) {
      console.log(metadata);
      throw new Error(`Unable to parse the data returned by Pidgin:\n${metadata}`);
    }

    expect(data.file_name, 'file_name not in core metadata').to.equal(file.data.file_name);
    expect(data.object_id, 'object_id not in core metadata').to.equal(file.did);
    expect(data.type, 'type not in core metadata').to.equal(file.data.type);
    expect(data.data_format, 'data_format not in core metadata').to.equal(file.data.data_format);
  },

  seeBibtexCoremetadata(file, metadata) {
    expect(metadata, `file_name ${file.data.file_name} not in core metadata`).to.contain(file.data.file_name);

    expect(metadata, `object_id ${file.did} not in core metadata`).to.contain(file.did);

    expect(metadata, `type ${file.data.type} not in core metadata`).to.contain(file.data.type);

    expect(metadata, `data_format ${file.data.data_format} not in core metadata`).to.contain(file.data.data_format);
  },

  // to be implemented to support application/vnd.schemaorg.ld+json format
  // seeSchemaorgCoremetadata(file, metadata){
  //   console.log(metadata)
  // },

  seePidginError(data) {
    // this should throw if the result is an error because the error is a string, not json
    const tryParseErr = function () { JSON.parse(data); };
    expect(tryParseErr).to.throw(Error);
  },
};
