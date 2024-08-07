/**
 * MDS Properties
 */
const rootUrl = '/mds';

/*
METADATA: /metadata
- Query all metadata: GET /metadata
- Query metadata by GUID: GET /metadata/{guid}
- Batch create metadata: POST /metadata
- Create metadata record: POST /metatata (batch)
- Update metadata record: PUT /metadata/{guid}
- Delete metadata record: DELETE /metadata/{guid}
*/

module.exports = {
  endpoints: {
    metadata: `${rootUrl}/metadata`,
    metadataIndex: `${rootUrl}/metadata_index`,
    objects: `${rootUrl}/objects`,
    aggMetadata: `${rootUrl}/aggregate/metadata`,
  },
};
