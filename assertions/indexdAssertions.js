'use strict';

let chai = require('chai');
let chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);
let expect = chai.expect;


const getUpdateDateFromResponse = function(res) {
  // parse updated date from indexd response
  return Date.parse(res.updated_date);
};


module.exports.seeIndexdGetFilePass = function(res) {
  expect(res).to.not.have.property('error');
  expect(res).to.have.property('updated_date'); // used in elsewhere, so making sure it exists
};


module.exports.seeIndexdEqualsFile = function(indexd_res, file) {
  this.seeIndexdGetFilePass(indexd_res);

  expect(indexd_res).to.have.property('hashes');
  expect(indexd_res.hashes).to.have.property('md5', file.data.md5sum);

  expect(indexd_res).to.have.property('size', file.data.file_size);

  expect(indexd_res).to.have.property('urls');
  if (typeof file.data.urls !== 'undefined') {
    expect(indexd_res).to.have.property('urls');
    expect(indexd_res.urls).to.have.lengthOf.above(0);
    expect(indexd_res.urls[0]).to.equal(file.data.urls)
  }
};


module.exports.seeFileDeleteSuccess = function(file) {
  // Note that we are looking at the entire resposne, not response.body
  // This is because indexd's body is undefined on success for deletion

  expect(file.indexd_delete_res).to.have.property('raw_body', '');
};


module.exports.seeIndexdFileUpdated = function(original_res, new_res) {
  this.seeIndexdGetFilePass(original_res);
  this.seeIndexdGetFilePass(new_res);

  let previous_date = getUpdateDateFromResponse(original_res);
  let new_date = getUpdateDateFromResponse(new_res);

  expect(new_date).to.be.above(previous_date);
};