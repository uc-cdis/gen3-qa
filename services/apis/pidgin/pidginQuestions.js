let chai = require('chai');
let expect = chai.expect;
chai.config.includeStack = true;
chai.config.truncateThreshold = 0;

const pidginProps = require('./pidginProps.js');

/**
 * pidgin Questions
 */
module.exports = {
  
  seeJsonCoremetadata(file, metadata) {
    let data = JSON.parse(metadata);
    expect(data['file_name'], 'file_name not in core metadata').to.equal(file.data.file_name);
    expect(data['object_id'], 'object_id not in core metadata').to.equal(file.did);
    expect(data['type'], 'type not in core metadata').to.equal(file.data.type);
    expect(data['data_format'], 'data_format not in core metadata').to.equal(file.data.data_format);
  },
  
  seeBibtexCoremetadata(file, metadata) {
    expect(metadata, `file_name ${file.data.file_name} not in core metadata`).to.contain(file.data.file_name);
    
    expect(metadata,`object_id ${file.did} not in core metadata`).to.contain(file.did);
  
    expect(metadata, `type ${file.data.type} not in core metadata`).to.contain(file.data.type);
  
    expect(metadata, `data_format ${file.data.data_format} not in core metadata`).to.contain(file.data.data_format);
  },
  
  seeSchemaorgdata(file, metadata){
    console.log(metadata)
  },

  seePidginError(data) {
    // this should throw if the result is an error because the error is a string, not json
    var tryParseErr = function () { JSON.parse(data); };
    expect(tryParseErr).to.throw(Error);
  },
};

