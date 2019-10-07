Pelican Test Plan

Pelican service provides support to PFB (Portable Format for Biomedical data). This format is for data serialization of clinical data, metadata and ontology and it is based on Avro serialization format.

PFB allows us to efficiently store and send files to Postgres. It will also supports versioning which allows to resubmit all in a commons if there is a dictionary changes.

Features : 

1. export to PFB : (currently deployed on qa-dcp)   

    a. Download whole of the database 
        1. The user should login with a valid user login credentials (Google login). After successful login, user should be able to see all the cases in the Graph.
        2. Click on 'Exploration Tab' on the top. Exploration Page is opened with Filters and Cases tables.
        3. Click on 'Export to PFB' button. A pop-on window opens on the bottom of the the page which shows the progress of the export and shows extimated time.
        4. After the export is completed, the pop-on windown will show a pre-assigned URL. 

    b. Download some of the database
        1. The user should login with a valid user login credentials (Google login). After a successful login, user should be able to see all the cases in the Graph.
        2. Click on 'Exploration Tab' on the top. Exploration Page is opened with Filters and Cases tables.
        3. The user selects some of the filters from the side facet. The cases table should update according to the filter selections.
        4. Click on 'Export to PFB' button. The pop-on window opens on the bottom of the the page which shows the progress of the export and shows extimated time.
        5. After the export is completed, the pop-on windown will show a pre-assigned URL. 

    c. No permission
        1. When the user logs in with a valid user login credentials (Google login), but the user do not have permissions to the data commons. 
        2. Click on 'Exploration Tab' on the top of the page after a successful login. All the buttons are disabled.

2. import in PFB (future)