Guppy is a server that supports GraphQL queries on data from elasticsearch. 
It allows you to query raw data with offset, maximum number of rows, sorting, and filters.
Guppy is like a lightweight version of arranger, but with user-friendly GraphQL query syntax and more fine-grained access control. 
The Windmill data explorer uses these tools to build charts, tables, and download/export functionalities.

Note that the mock responses in the test_data/test_response_*.json may contain their keys in a different order than the
actual results from the API (perform a key-by-key check in an implementation rather than a direct text comparison).

See the [guppy doc](https://github.com/uc-cdis/guppy/blob/master/doc/) for a description of the features tested.

Guppy Endpoints: 
1. /graphql
See [query doc](https://github.com/uc-cdis/guppy/blob/master/doc/queries.md) for details

2. /download
See [download doc](https://github.com/uc-cdis/guppy/blob/master/doc/download.md) for details
