Feature: Nested Aggregation in Guppy

    JIRA: https://ctds-planx.atlassian.net/browse/PXP-4737
    Github Docs: https://github.com/uc-cdis/guppy/blob/master/doc/queries.md#4-nested-aggregation
    Google Docs: https://docs.google.com/document/d/1T622ny7U960_pUWDguyfx4EQ-gEdboaR5-RgeD3OwAQ/

    The queries have been designed against index etl_mickey_1 which contains nested data

    @manual
    Scenario Outline: Nested aggregation tests
        Given guppy is configured in the commons @manual
        # ensure manifest.json and gitops.json are configured correctly
        And the user navigates to the query page @manual
        # e.g. https://qa-brain.planx-pla.net/query
        When the user enters the query from "./testData/<guppyQueryFile>" @manual
        # in the GraphiQL editor's query pane
        And the user enters the variable from "./testData/<variableFile>" @manual
        # in the GraphiQL editor's variables pane
        And saves the response as guppyResponse
        And the user queries elasticsearch with "./testData/<elasticQueryFile>" @manual
        # using port-forward to aws-es-proxy-deployment
        And saves the response as elasticResponse
        Then guppyResponse matches elasticResponse @manual

        Examples:
            | Test                            | guppyQueryFile  | variableFile           | elasticQueryFile  |
            | Simple terms agg                | guppyQuery1.txt | variablesForQuery1.txt | elasticQuery1.txt |
            | Simple missing agg              | guppyQuery2.txt | variablesForQuery2.txt | elasticQuery2.txt |
            | Invalid field in terms agg      | guppyQuery3.txt | variablesForQuery3.txt | elasticQuery3.txt |
            | Invalid field in missing agg    | guppyQuery4.txt | variablesForQuery4.txt | elasticQuery4.txt |
            | Terms and missing aggs combined | guppyQuery5.txt | variablesForQuery5.txt | elasticQuery5.txt |