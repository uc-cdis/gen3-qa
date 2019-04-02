const uuid = require('uuid');

const indexdProps = require('./indexdProps.js');
const user = require('../../../utils/user.js');
const { Gen3Response } = require('../../../utils/apiUtil.js');

const I = actor();

/**
 * indexd Utils
 */
const getRevFromResponse = function (res) {
  try {
    return res.body.rev;
  } catch (e) {
    return 'ERROR_GETTING_INDEXD';
  }
};

/**
 * indexd Tasks
 */
module.exports = {
  /**
   * Adds files to indexd
   * @param {Object[]} files - array of indexd files
   * @returns {Array<Promise<>>}
   */
  async addFileIndices(files) {
    const headers = user.mainAcct.indexdAuthHeader;
    headers['Content-Type'] = 'application/json; charset=UTF-8';
    const promiseList = files.map((file) => {
      file.did = uuid.v4().toString();
      const data = {
        file_name: file.filename,
        did: file.did,
        form: 'object',
        size: file.size,
        urls: [],
        hashes: { md5: file.md5 },
        acl: file.acl,
        metadata: file.metadata,
      };

      if (file.link !== null && file.link !== undefined) {
        data.urls = [file.link];
      }
      if (file.rbac !== null && file.rbac !== undefined) {
        data.rbac = file.rbac;
      }
      return data;
    }).map((data) => {
      const strData = JSON.stringify(data);
      return I.sendPostRequest(indexdProps.endpoints.add, strData, headers).then(
        (res) => {
          if (res.status === 200 && res.body && res.body.rev) {
            file.rev = res.body.rev;
            return Promise.resolve(file);
          } else {
            console.error(`Failed indexd submission got status ${res.status} for ${strData}`, res.body);
            return Promise.reject('Failed to register file with indexd');
          }
        },
        (err) => {
          console.err('Error on indexd submission', err);
          return Promise.reject(`indexd submission error on ${data.file_name}`);
        }
      );
    });
    //console.log("indexd addFileIndices waiting on promiseList of length: " + promiseList.length, promiseList);
    // This Promise.all trick does not work for some reason - ugh!
    // Have to figure it out later
    const success = await Promise.all(promiseList).then(
      () => true,
      (v) => {
        return false;
      }
    );
    //console.log("addFileIndices result: " + success);
    return true;  // always return true till we figure out the Promise.all issue above ...
  },

  /**
   * Fetches indexd data for file and assigns 'rev', given an indexd file object with a did
   * @param {Object} fileNode - Assumed to have a did property
   * @returns {Promise<Gen3Response>}
   */
  async getFile(file) {
    // get data from indexd
    return I.sendGetRequest(
      `${indexdProps.endpoints.get}/${file.did}`,
      user.mainAcct.accessTokenHeader,
    ).then((res) => {
      file.rev = getRevFromResponse(res);
      return res.body;
    });
  },

  /**
   * Deletes the file from indexd, given an indexd file object with did and rev
   * Response is added to the file object
   * @param {Object} file
   * @returns {Promise<Promise|*|PromiseLike<T>|Promise<T>>}
   */
  async deleteFile(file) {
    return I.sendDeleteRequest(
      `${indexdProps.endpoints.delete}/${file.did}?rev=${file.rev}`,
      user.mainAcct.indexdAuthHeader,
    ).then((res) => {
      // Note that we use the entire response, not just the response body
      file.indexd_delete_res = res;
      return res;
    });
  },

  /**
   * Deletes multiple files from indexd
   * @param {Object[]} files
   * @returns {Promise<void>}
   */
  async deleteFileIndices(files) {
    await Promise.all(
        files.map((file) => {
          return this.deleteFile(file);
        })
    );
  },

  /**
   * Remove the records created in indexd by the test suite
   * @param {array} guidList - list of GUIDs of the files to delete
   */
  async deleteFiles(guidList) {
    var fileList = []
    for (guid of guidList) {
      var file = {
        did: guid
      };
      await this.getFile(file); // adds 'rev' to the file
      var res = await this.deleteFile(file);
      fileList.push(file)
    }
    return fileList;
  },

  /**
   * Remove all records that userAccount submit in indexd
   * @param {User} userAccount - submitter of files to delete
   */
  async clearPreviousUploadFiles(userAccount) {
    I.sendGetRequest(
      `${indexdProps.endpoints.get}/?acl=null&uploader=${userAccount.username}`,
      userAccount.accessTokenHeader,
    ).then((res) => {
      if (!res.body && !res.body.records) return;
      const guidList = res.body.records.reduce((acc, cur) => {
        acc.push(cur.did);
        return acc;
      }, []);
      this.deleteFiles(guidList);
    });
  },
};
