const { output } = require('codeceptjs');

const mdsProps = require('./mdsProps.js');
const { Bash } = require('../../../utils/bash.js');
const { checkPod } = require('../../../utils/apiUtil.js');

const bash = new Bash();
const I = actor();

/**
 * MDS Tasks
 */
module.exports = {
  async createMetadataRecord(accessTokenHeader, guid, record) {
    output.print(`Creating metadata record with GUID ${guid}`);
    const resp = await I.sendPostRequest(`${mdsProps.endpoints.metadata}/${guid}`, record, accessTokenHeader);
    output.log(resp);
  },

  async editMetadataRecord(accessTokenHeader, guid, updatedRecord) {
    output.print(`Updating metadata record with GUID ${guid}`);
    const resp = await I.sendPutRequest(`${mdsProps.endpoints.metadata}/${guid}`, updatedRecord, accessTokenHeader);
    output.log(resp);
  },

  async deleteMetadataRecord(accessTokenHeader, guid) {
    output.print(`Deleting metadata record with GUID ${guid}`);
    const resp = await I.sendDeleteRequest(`${mdsProps.endpoints.metadata}/${guid}`, accessTokenHeader);
    output.log(resp);
  },

  async readMetadataRecord(accessTokenHeader, guid) {
    const resp = await I.sendGetRequest(`${mdsProps.endpoints.metadata}/${guid}`, accessTokenHeader);
    output.log(resp);
    if (resp.status === 200) {
      return resp.data;
    }
    return { status: resp.status };
  },

  async readAggMetadataRecord(accessTokenHeader, guid) {
    const resp = await I.sendGetRequest(`${mdsProps.endpoints.aggMetadata}/guid/${guid}`, accessTokenHeader);
    console.log(resp);
    if (resp.status === 200) {
      return resp.data;
    }
    return { status: resp.status };
  },

  async reSyncAggregateMetadata() {
    bash.runJob('metadata-aggregate-sync');
    await checkPod(I, 'metadata-aggregate-sync', 'gen3job,job-name=metadata-aggregate-sync', { nAttempts: 30, ignoreFailure: false, keepSessionAlive: false });
  },
};
