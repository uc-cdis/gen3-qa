let chai = require('chai');
let chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);
let expect = chai.expect;

'use strict';

module.exports.seeFileContentEqual = function(id, content) {
  let access_token = process.env.ACCESS_TOKEN;
  return expect(this.sendGetRequest(
    `/user/data/download/${id}`,
    {
      'Accept': 'application/json',
      'Authorization': `bearer ${access_token}`
    }).then(
    (res) => {
      return this.sendGetRequest(res.body.url).then(
        (res) => {
          return res.body;
        }
      ).catch(
        (e) => {
          console.error(e);
          return e;
        }
      )
    }).catch(
      (e) => {
        console.error(e);
        return e;
      }
    )
  ).to.eventually.equal(content);
};
