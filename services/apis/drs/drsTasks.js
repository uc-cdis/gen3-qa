const uuid = require('uuid');

const drsProps = require('./drsProps.js');
const user = require('../../../utils/user.js');
const { Gen3Response } = require('../../../utils/apiUtil.js');

const I = actor();

/**
 * indexd Utils
 */
const getRevFromResponse = function (res) {
  try {
    return res.data.rev;
  } catch (e) {
    console.log(`Could not get res.data.rev from response: ${res}`);
    return 'ERROR_GETTING_INDEXD';
  }
};


/**
 * indexd Tasks
 */
module.exports = {
  /**
   * Fetches indexd res data for file and assigns 'rev', given an indexd file object with a did
   * @param {Object} file - Assumed to have a did property
   * @param {Object} authHeaders - headers in include in request. defaults to main
   *                 user account (mainAcct)'s access token
   * @returns {Promise<Gen3Response>}
   */
  async getDrsObject(file, authHeaders = user.mainAcct.accessTokenHeader) {
    // get data from indexd
    id = file.did || file.id
    return I.sendGetRequest(
      `${drsProps.endpoints.get}/${id}`,
      authHeaders,
    ).then((res) => {
      file.rev = getRevFromResponse(res);
      return new Gen3Response(res);
    });
  },

  /**
   * Fetches indexd res data for file and assigns 'rev', given an indexd file object with a did
   * @param {Object} file - Assumed to have a did property
   * @param {Object} authHeaders - headers in include in request. defaults to main
   *                 user account (mainAcct)'s access token
   * @returns {Promise<Gen3Response>}
   */
  async getDrsSignedUrl(file, authHeaders = user.mainAcct.accessTokenHeader) {
    // get data from indexd
    id = file.did || file.id;
    access_id = file.link.substr(0,2);
    return I.sendGetRequest(
      `${drsProps.endpoints.get}/${id}/access/${access_id}`,
      authHeaders,
    ).then((res) => {
      file.rev = getRevFromResponse(res);
      return new Gen3Response(res);
    });
  },

  /**
   * Fetches indexd res data for file and assigns 'rev', given an indexd file object with a did
   * @param {Object} file - Assumed to have a did property
   * @param {Object} authHeaders - headers in include in request. defaults to main
   *                 user account (mainAcct)'s access token
   * @returns {Promise<Gen3Response>}
   */
  async getDrsSignedUrlWithoutHeader(file, authHeaders = user.mainAcct.accessTokenHeader) {
    // get data from indexd
    id = file.did || file.id;
    access_id = file.link.substr(0,2);
    return I.sendGetRequest(
      `${drsProps.endpoints.get}/${id}/access/${access_id}`,
    ).then((res) => {
      file.rev = getRevFromResponse(res);
      return new Gen3Response(res);
    });
  },

  /**
   * Hits fence's signed url endpoint
   * @param {string} file - id/did of an indexd file
   * @param {string[]} args - additional args for endpoint
   * @returns {Promise<Gen3Response>}
   */
  async createSignedUrl(file, args = [], userHeader = user.mainAcct.accessTokenHeader) {
    access_id = file.link;
    access_id = access_id.substr(0,2);
    id = file.did || file.id;
    return I.sendGetRequest(
        `${drsProps.endpoints.getFile}/${id}/accdss/${access_id}`.replace(
          /[?]$/g,
          '',
        ),
      userHeader,
    ).then((res) => new Gen3Response(res)); // ({ body: res.body, statusCode: res.statusCode }));
  },
  
  /**
   * Updates indexd data for file
   * @param {Object} file - Assumed to have a did property
   * @param {Object} authHeaders - headers in include in request. defaults to main
   *                 user account (mainAcct)'s access token
   * @returns {Promise<Gen3Response>}
   */
  async updateFile(file, data, authHeaders = user.mainAcct.indexdAuthHeader) {
    authHeaders['Content-Type'] = 'application/json; charset=UTF-8';
    return I.sendGetRequest(
      `${indexdProps.endpoints.get}/${file.did}`,
      authHeaders,
    ).then((res) => {
      // get last revision
      file.rev = getRevFromResponse(res);

      return I.sendPutRequest(
        `${indexdProps.endpoints.put}/${file.did}?rev=${file.rev}`,
        data,
        authHeaders,
      ).then((res) => res.data);
    });
  },

  /**
   * Deletes the file from indexd, given an indexd file object with did and rev
   * Response is added to the file object
   * @param {Object} file - Assumed to have a did property
   * @param {Object} authHeaders - headers in include in request. defaults to main
   *                 user account (mainAcct)'s access token
   * @returns {Promise<Promise|*|PromiseLike<T>|Promise<T>>}
   */
  async deleteFile(file, authHeaders = user.mainAcct.indexdAuthHeader) {
    authHeaders['Content-Type'] = 'application/json; charset=UTF-8';
    // always update revision
    return I.sendGetRequest(
      `${indexdProps.endpoints.get}/${file.did}`,
      authHeaders,
    ).then((res) => {
      console.log(`deleting file: ${file.did}`);
      // get last revision
      file.rev = getRevFromResponse(res);
      console.log(`deleting file with rev: ${indexdProps.endpoints.delete}/${file.did}?rev=${file.rev}`);
      return I.sendDeleteRequest(
        `${indexdProps.endpoints.delete}/${file.did}?rev=${file.rev}`,
        authHeaders,
      ).then((res) => {
        // Note that we use the entire response, not just the response body
        file.indexd_delete_res = res;
        return new Gen3Response(res);
      });
    });
  },

  /**
   * Deletes multiple files from indexd
   * @param {Object[]} files
   * @returns {Promise<void>}
   */
  async deleteFileIndices(files) {
    await Promise.all(
      files.map((file) => this.deleteFile(file)),
    );
  },

  /**
   * Remove the records created in indexd by the test suite
   * @param {array} guidList - list of GUIDs of the files to delete
   */
  async deleteFiles(guidList) {
    const fileList = [];
    for (guid of guidList) {
      const file = {
        did: guid,
      };
      const fileRes = await this.getFile(file); // adds 'rev' to the file
      if (!fileRes.error) {
        const res = await this.deleteFile(file);
        fileList.push(file);
      } else {
        console.log(`Could not delete file, since attempting to get it resulted in error: ${fileRes.error}`);
      }
    }
    return fileList;
  },

  /**
   * Remove all records that userAccount submit in indexd
   * @param {User} userAccount - submitter of files to delete
   */
  async clearPreviousUploadFiles(userAccount) {
    I.sendGetRequest(
      `${indexdProps.endpoints.get}/?acl=null&authz=null&uploader=${userAccount.username}`,
      userAccount.accessTokenHeader,
    ).then((res) => {
      if (!res.data && !res.data.records) return;
      const guidList = res.data.records.reduce((acc, cur) => {
        acc.push(cur.did);
        return acc;
      }, []);
      this.deleteFiles(guidList);
    });
  },
};
