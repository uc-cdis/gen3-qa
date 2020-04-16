Feature('Support aggregation over nested data - https://ctds-planx.atlassian.net/browse/PXP-4737, https://github.com/uc-cdis/guppy/pull/83');

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

// NOTE: all values here in the return result are mock values
Scenario('could aggregate on nested data with nested text props only @manual', ifInteractive(
  async () => {
    const result = await interactive(`
        1. Goto target commons' query page (e.g., https://qa-mickey.planx-pla.net/query).
        2. Input a query into GraphiQL editor to get aggregated data with some nested text properties. 
        For example in qa-mickey:
              query {
                  _aggregation {
                    patients {
                        ActionableMutations {
                            BxMorphology {
                                histogram {
                                    key
                                    count
                                }
                            }
                        }
                    }
                  }
                }
              }
        3. Hit the triangle play button or press ^Enter
        4. You should see the return result with nested structure. 
        Example result from qa-mickey: 
              {
                "data": {
                    "_aggregation": {
                        "patients": {
                            "ActionableMutations": {
                                "BxMorphology": {
                                    "histogram": [
                                        {
                                            "key": "ABCDE",
                                            "count": 41
                                          },
                                          {
                                            "key": "BCDEF",
                                            "count": 32
                                          },
                                          {
                                            "key": "CDEFG",
                                            "count": 19
                                          },
                                          ...
                                    ]
                                }
                            }
                        }
                    }
                }
              }
    `);
    expect(result.didPass, result.details).to.be.true;
  },
));

Scenario('could aggregate on nested data with nested numeric props only @manual', ifInteractive(
  async () => {
    const result = await interactive(`
          1. Goto target commons' query page (e.g., https://qa-mickey.planx-pla.net/query).
          2. Input a query into GraphiQL editor to get aggregated data with some nested numeric properties. 
          For example in qa-mickey:
                query {
                    _aggregation {
                      patients {
                          ActionableMutations {
                            ActionableMutationsCount {
                                  histogram(rangeStep: 3) {
                                      key
                                      count
                                  }
                              }
                          }
                      }
                    }
                  }
                }
          3. Hit the triangle play button or press ^Enter
          4. You should see the return result with nested structure. 
          Example result from qa-mickey: 
                {
                  "data": {
                      "_aggregation": {
                          "patients": {
                              "ActionableMutations": {
                                  "ActionableMutationsCount": {
                                      "histogram": [
                                          {
                                              "key": [
                                                  1,
                                                  4
                                              ],
                                              "count": 41
                                            },
                                            {
                                              "key": [
                                                  4,
                                                  7
                                              ]
                                              "count": 32
                                            },
                                            {
                                              "key": [
                                                  7,
                                                  10
                                              ]
                                              "count": 19
                                            },
                                            ...
                                      ]
                                  }
                              }
                          }
                      }
                  }
                }
      `);
    expect(result.didPass, result.details).to.be.true;
  },
));

Scenario('could aggregate on nested data with both nested props and normal props @manual', ifInteractive(
  async () => {
    const result = await interactive(`
          1. Goto target commons' query page (e.g., https://qa-mickey.planx-pla.net/query).
          2. Input a query into GraphiQL editor to get aggregated data with some nested and some normal properties. 
          For example in qa-mickey:
                query {
                    _aggregation {
                      patients {
                          gender {
                              histogram {
                                  key
                                  count
                              }
                          }
                          ActionableMutations {
                              BxMorphology {
                                  histogram {
                                      key
                                      count
                                  }
                              }
                          }
                      }
                    }
                  }
                }
          3. Hit the triangle play button or press ^Enter
          4. You should see the return result with nested structure. 
          Example result from qa-mickey: 
                {
                  "data": {
                      "_aggregation": {
                          "patients": {
                              "gender": {
                                  "histogram": [
                                      {
                                        "key": "male",
                                        "count": 24
                                      },
                                      {
                                        "key": "female",
                                        "count": 23
                                      },
                                      {
                                        "key": "unknown",
                                        "count": 17
                                      },
                                      ...
                                  ]
                              }
                              "ActionableMutations": {
                                  "BxMorphology": {
                                      "histogram": [
                                            {
                                              "key": "ABCDE",
                                              "count": 41
                                            },
                                            {
                                              "key": "BCDEF",
                                              "count": 32
                                            },
                                            {
                                              "key": "CDEFG",
                                              "count": 19
                                            },
                                            ...
                                      ]
                                  }
                              }
                          }
                      }
                  }
                }
      `);
    expect(result.didPass, result.details).to.be.true;
  },
));

Scenario('could aggregate on nested data with both nested props and normal props, and also with filters applied @manual', ifInteractive(
  async () => {
    const result = await interactive(`
            1. Goto target commons' query page (e.g., https://qa-mickey.planx-pla.net/query).
            2. Input a query into GraphiQL editor to get aggregated data with some nested and some normal properties. 
            For example in qa-mickey:
                  query {
                      _aggregation {
                        patients {
                            gender {
                                histogram {
                                    key
                                    count
                                }
                            }
                            ActionableMutations {
                                BxMorphology {
                                    histogram {
                                        key
                                        count
                                    }
                                }
                            }
                        }
                      }
                    }
                  }
            with filter:
                  {
                    "filter": {
                      "AND": [
                        {
                          "=": {
                            "gender": "male"
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
            4. You should see the return result with nested structure. 
            Example result from qa-mickey: 
                  {
                    "data": {
                        "_aggregation": {
                            "patients": {
                                "gender": {
                                    "histogram": [
                                        {
                                          "key": "male",
                                          "count": 13
                                        }
                                    ]
                                }
                                "ActionableMutations": {
                                    "BxMorphology": {
                                        "histogram": [
                                              {
                                                "key": "ABCDE",
                                                "count": 13
                                              }
                                        ]
                                    }
                                }
                            }
                        }
                    }
                  }
        `);
    expect(result.didPass, result.details).to.be.true;
  },
));
