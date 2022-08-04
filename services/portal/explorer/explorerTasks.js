const explorerProps = require('./explorerProps.js');
// const loginProps = require('../login/loginProps.js');
// const portal = require('../../../utils/portal.js');
// const user = require('../../../utils/user.js');

const I = actor();

/**
 * explorer Tasks
 */
module.exports = {

  goToExplorerPage() {
    I.amOnPage(explorerProps.path);
  },

  // API Example:
  // getFiles() {
  //   I.sendGetRequest(sheepdog.endpoints.getFile, accessTokenHeaders)
  // }
  //
  // Portal Example:
  // goTo() {
  //   homepage_service.do.goTo();
  //   portalUtil.clickProp(navbar.props.dictionary_link)
  //   portalUtil.seeProp(dictionaryProps.ready_cue)
  // }
  //
  // FROM ORIGINAL EXPLORER STEPS FILE:
  // module.exports.openDataExplorer = async function() {
  //   this.amOnPage('explorer');
  //   await this.waitForElement('.data-explorer', 10);
  // }
  //
  // module.exports.clickNthFilterTab = async function(n) {
  //   await this.click('.filter-group__tab:nth-child(' + n + ')');
  // }
  //
  // module.exports.clickFirstFilterItemUnderNthGroup = async function(n) {
  //   await this.click('.aggregation-card:nth-child(' + n + ') .bucket-item');
  // }
  //
  // const BASE_URL = '/api/v0/flat-search/search/graphql';
  //
  // let postRequest = async function(endpoint, payload) {
  //   const header = {
  //     'Content-Type': 'application/json'
  //   };
  //   return this.sendPostRequest(
  //     BASE_URL + endpoint,
  //     payload,
  //     header,
  //   ).then((res) => {
  //     let ret = {
  //       status: res.status,
  //       body: res.body,
  //     };
  //     return ret;
  //   });
  // };
  //
  // module.exports.pingArranger = async function() {
  //   const payload = {
  //     query: "{ subject { __typename } }"
  //   };
  //   return postRequest.bind(this)('', payload);
  // }
  //
  // module.exports.arrangerAggsStateQuery = async function() {
  //   const payload = {
  //     query: "query aggsStateQuery {\
  //         subject {\
  //           mapping\
  //           aggsState {\
  //             \
  //             state {\
  //               field\
  //               show\
  //               active\
  //             }\
  //           }\
  //         }\
  //       }"
  //   };
  //   return postRequest.bind(this)('/aggsStateQuery', payload);
  // }
  //
  // module.exports.arrangerSubjectAggregationQuery = async function() {
  //   let aggsRes = await this.arrangerAggsStateQuery();
  //   let fields = aggsRes.body.data.subject.aggsState.state
  //     .filter(item => item.show)
  //     .map(item => item.field);
  //   const payload = {
  //     query: 'query SubjectAggregationsQuery(\
  //               $fields: [String]\
  //               $sqon: JSON\
  //             ) {\
  //               subject {\
  //                 extended(fields: $fields)\
  //                 aggregations (\
  //                   aggregations_filter_themselves: false\
  //                   filters: $sqon\
  //                 ) {' +
  //     fields.map(field => (field +'{\
  //                       buckets {\
  //                         doc_count\
  //                         key_as_string\
  //                         key\
  //                       }\
  //                     }')).join(',')
  //     + '}}}',
  //     variables: {
  //       fields: fields,
  //       sqon: null
  //     }
  //   }
  //   return postRequest.bind(this)('/SubjectAggregationsQuery', payload);
  // }
  //
  // module.exports.arrangerColumnStateQuery = async function() {
  //   const payload = {
  //     query: "query columnsStateQuery {\
  //       subject {\
  //         columnsState {\
  //           state {\
  //             type\
  //             keyField\
  //             defaultSorted {\
  //               id\
  //               desc\
  //             }\
  //             columns {\
  //               field\
  //               accessor\
  //               show\
  //               type\
  //               sortable\
  //               canChangeShow\
  //               query\
  //               jsonPath\
  //             }\
  //           }\
  //         }\
  //       }\
  //     }"
  //   };
  //   return postRequest.bind(this)('/columnsStateQuery', payload);
  // }
};
