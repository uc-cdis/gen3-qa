const explorerProps = require('./explorerProps.js');
const user = require('../../../utils/user.js');
const I = actor();
const portal = require('../../../utils/portal.js');

/**
 * explorer Tasks
 */
const BASE_URL = '/api/v0/flat-search/search/graphql';

module.exports = {
  // API Example:
  getFiles() {
    I.sendGetRequest(sheepdog.endpoints.getFile, accessTokenHeaders);
  },
  
  // Portal Example:
  goTo() {
    homepage_service.do.goTo();
    portalUtil.clickProp(navbar.props.dictionary_link)
    portalUtil.seeProp(dictionaryProps.ready_cue)
  },
  
  async openDataExplorer() {
    I.amOnPage('/explorer');
    await I.waitForElement('.data-explorer', 10);
  },
  
  async clickNthFilterTab(n) {
    await I.click('.filter-group__tab:nth-child(' + n + ')');
  },
  
  async clickFirstFilterItemUnderNthGroup(n) {
    await I.click('.aggregation-card:nth-child(' + n + ') .bucket-item');
  }, 
  
  async postRequest(endpoint, payload) {
    const header = {
      'Content-Type': 'application/json'
    };
    return I.sendPostRequest(
      BASE_URL + endpoint,
      payload,
      header,
    ).then((res) => {
      let ret = {
        status: res.status,
        body: res.body,
      };
      return ret;
    });
  },
  
  async pingArranger() {
    const payload = {
      query: "{ subject { __typename } }"
    };
    return postRequest.bind(I)('', payload);
  },
  
  async arrangerAggsStateQuery() {
    const payload = {
      query: "query aggsStateQuery {\
          subject {\
            mapping\
            aggsState {\
              \
              state {\
                field\
                show\
                active\
              }\
            }\
          }\
        }"
    };
    return postRequest.bind(I)('/aggsStateQuery', payload);
  },
  
  async arrangerSubjectAggregationQuery() {
    let aggsRes = await I.arrangerAggsStateQuery();
    let fields = aggsRes.body.data.subject.aggsState.state
      .filter(item => item.show)
      .map(item => item.field);
    const payload = {
      query: 'query SubjectAggregationsQuery(\
                $fields: [String]\
                $sqon: JSON\
              ) {\
                subject {\
                  extended(fields: $fields)\
                  aggregations (\
                    aggregations_filter_themselves: false\
                    filters: $sqon\
                  ) {' +
      fields.map(field => (field +'{\
                        buckets {\
                          doc_count\
                          key_as_string\
                          key\
                        }\
                      }')).join(',')
      + '}}}',
      variables: {
        fields: fields,
        sqon: null
      }
    }
    return postRequest.bind(I)('/SubjectAggregationsQuery', payload);
  },
  
  async arrangerColumnStateQuery() {
    const payload = {
      query: "query columnsStateQuery {\
        subject {\
          columnsState {\
            state {\
              type\
              keyField\
              defaultSorted {\
                id\
                desc\
              }\
              columns {\
                field\
                accessor\
                show\
                type\
                sortable\
                canChangeShow\
                query\
                jsonPath\
              }\
            }\
          }\
        }\
      }"
    };
    return postRequest.bind(I)('/columnsStateQuery', payload);
  }
};
