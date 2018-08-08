let chai = require('chai');
let chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);
let expect = chai.expect;
chai.config.includeStack = true;
chai.config.truncateThreshold = 0;

let util = require('../../steps/utilSteps');
const I = actor();

/**
 * Sheepdog Actor
 * @type {{root: string, endpoints: {add: string, delete: string, describe: string}, accessTokenHeader: {Accept, Authorization}, _seeNodePass(*=): void, _getIdFromResponse(*): (*|string), _getDidFromResponse(*): (*|string), _getDidFromFileId(*, *): *, will: {addNode(*): Promise<*>, submitFile(*=, *=): Promise<*>}, see: {nodeAddSuccess(*): void}}}
 */
class sheepdogActor {
  constructor () {
    this.root = `/api/v0/submission/${this.program_name}/${this.project_name}`;
    this.endpoints= {
      add: `${this.root}/`,
        delete: `${this.root}/entities/`,
        describe: `${this.root}/export/`
    };
    this.accessTokenHeader = util.getAccessTokenHeader();
  }


  /**
   * Internal Helpers
   */
  _seeNodePass (res) {
    expect(res).to.have.property('success', true);
    expect(res).to.have.property('entity_error_count', 0);
    expect(res).to.have.property('transactional_error_count', 0);
  };

  _getIdFromResponse (res) {
    let body = res.body;
    try {
      return body.entities[0].id;
    } catch (e) {
      return "ERROR_ADDING_NODE";
    }
  };

  _getDidFromResponse (res) {
    try {
      let body = JSON.parse(res.body);
      return body[0].object_id;
    } catch(e) {
      return "ERROR_GETTING_SHEEPDOG"
    }
  };

  _getDidFromFileId (file) {
    // get did from sheepdog id
    let get_file_endpoint = `${this.endpoints.describe}?ids=${file.data.id}&format=json`;

    return this.sendGetRequest(get_file_endpoint, this.accessTokenHeader).then(
      (res) => {
        file.did = this._getDidFromResponse(res);
      })
  };

  /**
   * Tasks
   */
  //will: {
  addNode (node) {
    // PUT to sheepdog
    node.success = true;
    console.log(this);
    return this;
    // return I.sendPutRequest(
    //   this.endpoints.add, JSON.stringify(node.data), this.accessTokenHeader)
    //   .then((res) => {
    //     node.data.id = this._getIdFromResponse(res);
    //     node.add_res = res.body;
    //   })
  };

  async submitFile (file) {
    return this.will.addNode(file).then(
      () => {
        return this._getDidFromFileId(file)
      });
  };

  async deleteNode (node) {
    // DELETE to sheepdog
    let delete_endpoint = `${this.endpoints.delete}${node.data.id}`;
    return I.sendDeleteRequest(delete_endpoint, this.accessTokenHeader)
      .then( (res) => {
        node.delete_res = res.body
      });
  };
  //},

  /**
   * Questions
   */
  //sees: {
  nodeAddSuccess (node) {
    expect(node).to.have.property('add_res');
    this._seeNodePass(node.add_res);
    expect(node.add_res).to.have.property('created_entity_count', 1);
  };
  //},

  /**
   * WIP chainers
   */
  get then () {
    return this;
  };
  get see () {
    return this;
  };
}

module.exports = sheepdogActor;