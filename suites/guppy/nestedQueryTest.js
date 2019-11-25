Feature('Support query for nested data - https://ctds-planx.atlassian.net/browse/PXP-3758, https://github.com/uc-cdis/guppy/pull/52');

const chai = require('chai');
const { interactive, ifInteractive } = require('../../utils/interactive.js');

const { expect } = chai;

Scenario('Check guppy is up, and query page is ready @manual', ifInteractive(
  async () => {
    const result = await interactive(`
        1. Goto target commons' gitops config and check guppy is correctly configured. 
        Take qa-mickey as example:
          guppy version entry: https://github.com/uc-cdis/gitops-qa/blob/master/qa-mickey.planx-pla.net/manifest.json#L23
          config: https://github.com/uc-cdis/gitops-qa/blob/master/qa-mickey.planx-pla.net/manifest.json#L96-L104
          related portal config: https://github.com/uc-cdis/gitops-qa/blob/master/qa-mickey.planx-pla.net/portal/gitops.json#L223-L228
        2. Goto target commons' user yaml to check user has access to data. 
        3. Goto target commons (e.g., https://qa-mickey.planx-pla.net/).
        4. Log in, and then click "Query" in nav bar.
        5. You should be able to see GraphiQL editor, the result panel in the right side should not have any error messages. 
    `);
    expect(result.didPass, result.details).to.be.true;
  },
));

Scenario('could query nested data @manual', ifInteractive(
  async () => {
    const result = await interactive(`
        1. Goto target commons' query page (e.g., https://qa-mickey.planx-pla.net/query).
        2. Input a query into GraphiQL editor to get data with some nested properties. 
        For example in qa-mickey:
              query {
                patients {
                  ActionableMutations {
                    Chicago_ID
                  }
                }
              }
        3. Hit the triangle play button or press ^Enter
        4. You should see the return result with nested structure. 
        Example result from qa-mickey: 
              {
                "data": {
                  "patients": [
                    {
                      "ActionableMutations": [
                        {
                          "Chicago_ID": "12345"
                        },
                        {
                          "Chicago_ID": "23456"
                        },
                        ...
                      ]
                    }
                  ]
                }
              }
    `);
    expect(result.didPass, result.details).to.be.true;
  },
));

Scenario('could query data with a filter that contains nested data @manual', ifInteractive(
  async () => {
    const result = await interactive(`
        1. Goto target commons' query page (e.g., https://qa-mickey.planx-pla.net/query).
        2. Input a query into GraphiQL editor, with a filter that contains some nested properties
        For example in qa-mickey:
              query {
                patients {
                  ActionableMutations {
                    Chicago_ID
                    BxMorphology
                  }
                }
              }
          with filter:
              {
                "filter": {
                  "nested": {
                    "path": "ActionableMutations",
                    "=": {
                      "BxMorphology": "ABCDE"
                    }
                  }
                }
              }
        3. Hit the triangle play button or press ^Enter
        4. You should see the return result with nested structure. And the returned result
        should only contain those filtered data. 
        Example result from qa-mickey: 
              {
                "data": {
                  "patients": [
                    {
                      "ActionableMutations": [
                        {
                          "Chicago_ID": "12345",
                          "BxMorphology": "ABCDE"
                        },
                        {
                          "Chicago_ID": "23456",
                          "BxMorphology": "BCDEF"
                        },
                        ...
                      ]
                    }
                  ]
                }
              }
    `);
    expect(result.didPass, result.details).to.be.true;
  },
));

Scenario('get query with a complicated filters that contains two or more nested props @manual', ifInteractive(
  async () => {
    const result = await interactive(`
        1. Goto target commons' query page (e.g., https://qa-mickey.planx-pla.net/query).
        2. Input a query into GraphiQL editor, with a filter that contains some nested properties
        For example in qa-mickey:
              query {
                patients {
                  ActionableMutations {
                    Chicago_ID
                    BxMorphology
                  }
                }
              }
          with filter:
              {
                "filter": {
                  "nested": {
                    "path": "ActionableMutations",
                    "AND": [
                      {
                        "=": {
                          "Chicago_ID": "12345"
                        }
                      },
                      {
                        "=": {
                          "BxMorphology": "ABCDE"
                        }
                      }
                    ]
                  }
                }
              }
        3. Hit the triangle play button or press ^Enter
        4. You should see the return result with nested structure. And the returned result
        should only contain those filtered data. 
        Example result from qa-mickey: 
              {
                "data": {
                  "patients": [
                    {
                      "ActionableMutations": [
                        {
                          "Chicago_ID": "12345",
                          "BxMorphology": "ABCDE"
                        },
                        {
                          "Chicago_ID": "23456",
                          "BxMorphology": "BCDEF"
                        },
                        ...
                      ]
                    }
                  ]
                }
              }
    `);
    expect(result.didPass, result.details).to.be.true;
  },
));

Scenario('get data with a complicated filters that combines nested props and normal props @manual', ifInteractive(
  async () => {
    const result = await interactive(`
        1. Goto target commons' query page (e.g., https://qa-mickey.planx-pla.net/query).
        2. Input a query into GraphiQL editor, with a filter that contains some nested properties
        For example in qa-mickey:
              query {
                patients {
                  anotherProp
                  ActionableMutations {
                    BxMorphology
                  }
                }
              }
          with filter:
              {
                "filter": {
                  "AND": [
                    {
                      "=": {
                        "anotherProp": "12345"
                      },
                    },
                    {
                      "nested": {
                        "path": "ActionableMutations",
                        "=": {
                          "BxMorphology": "ABCDE"
                        }
                      }
                    }
                  ]
                }
              }
        3. Hit the triangle play button or press ^Enter
        4. You should see the return result with nested structure. And the returned result
        should only contain those filtered data. 
        Example result from qa-mickey: 
              {
                "data": {
                  "patients": [
                    {
                      "anotherProp": "12345",
                      "ActionableMutations": [
                        {
                          "BxMorphology": "ABCDE"
                        },
                        {
                          "BxMorphology": "BCDEF"
                        },
                        ...
                      ]
                    }
                  ]
                }
              }
    `);
    expect(result.didPass, result.details).to.be.true;
  },
));
