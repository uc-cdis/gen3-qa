Guppy is a server that support GraphQL queries on data from elasticsearch. 
It allows you to query raw data with offset, maximum number of rows, sorting and filters.
Guppy is like a lightweight version of arranger, but with user-friendly GraphQL query syntax and more fine-grained access control. 
The Windmill data explorer uses these tools to build charts, tables, and download/export functionalities.

Note that the mock responses in the test plan may contain their keys in a different order than the
actual results from the API (perform a key-by-key check in an implementation rather than a direct text comparison).

[Guppy Doc](https://github.com/uc-cdis/guppy/blob/master/doc/queries.md)

Guppy Endpoints: /graphql, /download

Background:
	Given a data commons with a Fence deployment running at /user
	And a a Guppy deployment running at /guppy 
	And a user mingfei@example.com registered in the Fence database
	And a manifest dictionary_url value of https://s3.amazonaws.com/dictionary-artifacts/gtexdictionary/master/schema.json
	And a test database containing case documents in test_data/test_data_1.json
	And an ETL job completed so as to enable the use of flat queries

Feature: A user will be denied access to Guppy in the case that their auth is expired, and will be informed that their auth is invalid.
	
	Scenario: Mingfei wants to make a query to Guppy, but his access token is expired.
		Given mingfei@example.com's access token is expired
		When Mingfei makes an API request to guppy/graphql with test_query_1.json
		Then the response will fail with a status code 401

Feature: A user can query the raw data with offset parameter, maximum number of rows, sorting and filters to facilitate their data exploration.
	
	Scenario: (*) Mingfei wants a list of patients (cases) strictly younger than 30 with a past stroke in ascending order of BMI.
		When Mingfei makes an API request to guppy/graphql with test_query_1.json
		Then the response will be successful with status code 200
		And match the contents of test_response_1.json

Feature: A user can obtain the total count of the query result with a total count aggregation.

	Scenario: Mingfei wants a total count of patients matching the filter in the scenario labeled (*).
		When Mingfei makes an API request to guppy/graphql with test_query_2.json
		Then the response will be successful with status code 200
		And match the contents of test_response_2.json

Feature: A user can obtain bin counts of data classifications using text aggregation.

	Scenario: Mingfei wants a high-level overview of the data in the database as it pertains to stroke occurence and age groups represented.
		When Mingfei makes an API request to guppy/graphql with test_query_3.json
		Then the response will be successful with status code 200
		And match the contents of test_response_3.json

Feature: A user can compute statistical summaries of a numerical field with parameters like min, max, avg, sum, count.

	Scenario: Mingfei wants a high-level overview of the data in the database as it pertains to stroke occurence and age groups represented.
		When Mingfei makes an API request to guppy/graphql with test_query_4.json
		Then the response will be successful with status code 200
		And match the contents of test_response_4.json

Feature: A user can list the fields on a document type with a mapping query.

	Scenario: Mingfei would like to list the fields on the case document.
		When Mingfei makes an API request to guppy/graphql with test_query_5.json
		Then the response will be successful with status code 200
		And match the contents of test_response_5.json













