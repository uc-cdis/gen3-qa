Core Metadata: Pidgin was a light-weight API which works on top of Peregrine. Its functionality is now included in Peregrine. It takes a file's GUID as input which queries Peregrine for information about the file and returns an abstract of the file to the user.

Integration Test Coverage for Core Metadata:
Single endpoint  - `/<GUID of a file>`

Endpoints :	

1. `/<GUID of file>` - this endpoint queries Peregrine and returns core metadata about the file. By default, it returns core metadata as JSON document.
                
    Three formats are supported by this endpoint - JSON, bibliography, and JSON-LD. The user should specify the format of the output with the help of "Accept" header. 
    ```
    a. Accept: application/json # for JSON format -
       the output of the JSON format
       `{"file_name": "my-file.txt", "data_format": "TXT", "file_size": 10, "object_id": "123"}`

    b. Accept: x-bibtex # for bibliography format -
       the output of the x-bibliography format
       `@misc {123, file_name = "my-file.txt", data_format = "TXT", file_size = "10", object_id = "123"}`

    c. Accept: application/vnd.schemaorg.ld+json # for JSON-LD format -	
       the output of the JSON-LD format
       `{"@context": "http://schema.org",
              "@type": "Dataset", "@id": "https://dataguids.org/index/123", "identifier":
              [{"@type": "PropertyValue", "propertyID": "dataguid", "value": "123"},
              {"@type": "PropertyValue", "propertyID": "md5", "value": "bc575394b5565a1d3fa20abe2b132896"}],
              "publisher": {"@type": "Organization", "name": "my-org"}, "author":
              {"name": "my-author"}, "description": "my-description", "additionalType":
              "submitted_aligned_reads", "name": "my-file.txt", "datePublished": "2019-01-24T19:40:02.537991+00:00"}`
    
    d.Invalid GUID - `No core metadata was found for this object_id`
    ```

2. `/_status` - Health-check endpoint
    
    ```
    200 if `healthy`

    default is `unhealthy`
    ```




