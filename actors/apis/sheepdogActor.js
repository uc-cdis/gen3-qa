let chai = require('chai');
let chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);
let expect = chai.expect;
chai.config.includeStack = true;
chai.config.truncateThreshold = 0;

let util = require('../../steps/utilSteps');
const I = actor();

const api_root = `/api/v0/submission/${util.getProgramName()}/${util.getProjectName()}`;

/**
 * Sheepdog Actor
 */
module.exports = {
  // API Config
  endpoints: {
    root: api_root,
    add: api_root,
    delete: `${api_root}/entities`,
    describe: `${api_root}/export`
  },
  accessTokenHeader: util.getAccessTokenHeader(),

  /**
   * Internal Helpers
   */
  _seeNodePass (res) {
    expect(res).to.have.property('success', true);
    expect(res).to.have.property('entity_error_count', 0);
    expect(res).to.have.property('transactional_error_count', 0);
  },

  _getIdFromResponse (res) {
    let body = res.body;
    try {
      return body.entities[0].id;
    } catch (e) {
      // return nothing
    }
  },

  _getDidFromResponse (res) {
    try {
      let body = JSON.parse(res.body);
      return body[0].object_id;
    } catch(e) {
      // return nothing
    }
  },

  _getDidFromFileId (file) {
    // get did from sheepdog id
    if (file.data.id === '' || file.data.id === undefined)
      return;
    let get_file_endpoint = `${this.endpoints.describe}?ids=${file.data.id}&format=json`;
    return I.sendGetRequest(get_file_endpoint, this.accessTokenHeader).then(
      (res) => {
        file.did = this._getDidFromResponse(res);
      })
  },

  /**
   * Tasks
   */
  async addNode (node) {
    // PUT to sheepdog
    return I.sendPutRequest(
    this.endpoints.add, JSON.stringify(node.data), this.accessTokenHeader)
    .then( (res) => {
      node.data.id = this._getIdFromResponse(res); // res.statusCode === 200 ? res.body.entities[0].id : "ERROR_ADDING_NODE";
      node.add_res = res.body || {};
    })
  },

  async submitFile (file) {
    return this.addNode(file).then(
      () => {
        return this._getDidFromFileId(file)
      });
  },

  async deleteNode (node) {
    // DELETE to sheepdog
    let delete_endpoint = `${this.endpoints.delete}${node.data.id}`;
    return I.sendDeleteRequest(delete_endpoint, this.accessTokenHeader)
      .then( (res) => {
        node.delete_res = res.body
      });
  },

  /**
   * Questions
   */
  seeNodeAddSuccess (node) {
    expect(node).to.have.property('add_res');
    this._seeNodePass(node.add_res);
    expect(node.add_res).to.have.property('created_entity_count', 1);
  },

  seeNodeDeleteSuccess (node) {
    expect(node).to.have.property('add_res');
    this._seeNodePass(node.add_res);
    expect(node.add_res).to.have.property('created_entity_count', 1);
  }

};
