Feature: The Guppy API supports GraphQL queries on data from elasticsearch. 

	Background:
		Given a data commons with a Fence deployment running at /user
		And a Guppy deployment running at /guppy 	
		And a user test_user@example.com registered in the Fence database
		And a manifest dictionary_url value of 'https://s3.amazonaws.com/dictionary-artifacts/gtexdictionary/master/schema.json'

	Scenario: I want to make a query to Guppy, but my access token is invalid or expired.
		Given a test database containing case documents in the qa-dcp_etl index
		And an ETL job completed so as to enable the use of flat queries
		And test_user@example.com with access token is expired
		When I make an API request to /guppy/graphql with 'test_query_1.json'
		Then the response will fail with a status code 401

	Scenario: I want a list of patients (cases) strictly younger than 30 with a past stroke in ascending order of BMI.
		Given a test database containing case documents in the qa-dcp_etl index
		And an ETL job completed so as to enable the use of flat queries
		When I make an API request to '/guppy/graphql' with 'test_query_1.json'
		Then the response will be successful with status code 200
		And match the contents of 'test_response_1.json'

	Scenario: I want a total count of patients matching the filter in the scenario above.
		Given a test database containing case documents in the qa-dcp_etl index
		And an ETL job completed so as to enable the use of flat queries
		When I make an API request to /guppy/graphql with 'test_query_2.json'
		Then the response will be successful with status code 200
		And match the contents of 'test_response_2.json'

	Scenario: I want to render a set of visualizations summarizing data in the commons.
		Given a test database containing case documents in the qa-dcp_etl index
		And an ETL job completed so as to enable the use of flat queries
		When I make an API request to /guppy/graphql with 'test_query_6.json'
		Then the response will be successful with status code 200
		And match the contents of 'test_response_6.json'

	Scenario: I want to make multiple histograms describing the BMI parameter to gain an understanding of its distribution.
		Given a test database containing case documents in the qa-dcp_etl index
		And an ETL job completed so as to enable the use of flat queries
		When I make an API request to /guppy/graphql with 'test_query_7.json'
		Then the response will be successful with status code 200
		And match the contents of 'test_response_7.json'

	Scenario: I want a high-level overview of the data in the database as it pertains to stroke occurence and age groups represented.
		Given a test database containing case documents in the qa-dcp_etl index
		And an ETL job completed so as to enable the use of flat queries
		When I make an API request to /guppy/graphql with 'test_query_3.json'
		Then the response will be successful with status code 200
		And match the contents of 'test_response_3.json'

	Scenario: I want a range-stepped high-level overview of the data in the database as it pertains to stroke occurence and age groups represented.
		Given a test database containing case documents in the qa-dcp_etl index
		And an ETL job completed so as to enable the use of flat queries
		When I make an API request to /guppy/graphql with 'test_query_4.json'
		Then the response will be successful with status code 200
		And match the contents of 'test_response_4.json'

	Scenario: I would like to list the fields on the case document.
		Given a test database containing case documents in the qa-dcp_etl index
		And an ETL job completed so as to enable the use of flat queries
		When I make an API request to /guppy/graphql with 'test_query_5.json'
		Then the response will be successful with status code 200
		And match the contents of 'test_response_5.json'

	Scenario: I want to make a filtering query without worrying about paginating the results, or whether the result will be > 10k records.
		Given a test database containing case documents in the qa-dcp_etl index
		And an ETL job completed so as to enable the use of flat queries
		When I make an API request to /guppy/download with 'test_query_8.json'
		Then the response will be successful with status code 200
		And match the contents of 'test_response_8.json'