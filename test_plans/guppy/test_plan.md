Guppy is a server that support GraphQL queries on data from elasticsearch. 
It allows you to query raw data with offset, maximum number of rows, sorting and filters. The Windmill data explorer uses these aggregations to provide charts, tables, and download/export functionalities.
Guppy is like a lightweight version of arranger, but with user-friendly GraphQL query syntax and more fine-grained access control. 

[Guppy Doc](https://github.com/uc-cdis/guppy/blob/master/doc/queries.md)

Endpoints: /graphql, /download

Feature: A user can query the raw data with offset parameter, maximum number of rows, sorting and filters to facilitate their data exploration.
	Background:
		Given a data commons with a Guppy deployment running at /guppy
		And a test database containing case documents in test_data/test_data_1.json
		And an ETL job completed so as to enable the use of flat queries

	Scenario: Mingfei wants a list of patients (cases) strictly younger than 30 with a past stroke, in ascending order by BMI.
		When the user makes an API request with test_request_1.json
		Then the response will be the contents of test_response_1.json with a status code of 200

Feature: A user can obtain the total count of the query result with a total count aggregation.
	Background:
		Given a data commons with a Guppy deployment running at /guppy
		And a 

	Scenario: 

Feature: A user can obtain bin counts of data classifications using text aggregation.
	Background:
		Given a data commons with a Guppy deployment running at /guppy
		And a 

	Scenario: 

Feature: A user can compute statistical summaries of a numerical field with parameters like min, max, avg, sum, count. 
	Background:
		Given a data commons with a Guppy deployment running at /guppy
		And a 

	Scenario: 

Feature: A user can list the fields on a document type with a mapping query.
	Background:
		Given a data commons with a Guppy deployment running at /guppy
		And a 

	Scenario: 