# Non-DBGap projects usersync test plan

## Overview of the service

Current usersync process which pulles telemetry files accepts only phsIDs projects

This feature allows the usersync to accept custom project ids for data access instead of the just accepting phs id projects. The approved party can set up a sftp server which holds telemetry fields just like in dbgap and extending support to any approved project ids.

## Technical Documentation

- [Design Doc](https://docs.google.com/document/d/1gcdBCyTFkfF8xDa46PIybfgrSz6dQKaBqTei8C8wqOI)


## Scope

The user should be able to upload a new indexd record with the custom project id and create a presigned url request for the newly uploaded record with

## Configuration 

1. Ask devops for an SFTP server to execute tests

2. Prepare a test env and update the `fence-config.yaml` for tests that
```
dbGaP:
  - info:
      host: ''
      username: ''
      paswd: '' 
      port: 22
      proxy: 'cloud-proxy.internal.io'
      proxy_user: 'sftpuser'
      encrypted: false
      study_to_resource_namespaces:
        '_default': ['/']
        'PROJECT-12345': ['']
    allow_non_dbgap_whitelist: true
    allowed_id_patterns: ['authentication_file_PROJECT-(\d*).(csv|txt)', 'authentication_file_NCI-(\d*).(csv|txt)']
    protocol: 'sftp'
    decrypt_key: 'KEY'
    parse_consent_code: true
```

NOTE : 

    a. Get the host, username and password from the devops. Also you can leave the `encrypted` field to `false`.

    b. We dont have to create any project manually in the env. The usersync job will create projects and resources in both arborist and fence when it is executed.

3. Create couple of whitelist files. 

    (Make sure the file name matches the Project name (i.e. `PROJECT-12345`) from the fence-config.yaml)

    Example file: `authentication_file_PROJECT-12345.csv`
```
user name,login,project_id
UCtestuser121,UCtestuser121,PROJECT-12345
UCtestuser122,UCtestuser122,PROJECT-12345
main@example.org,main@example.org,PROJECT-12345
```

## Test steps

1. Login into SFTP server with the provided username and password

2. Upload the whitelist files to the sftp server. First you need to connect to the sfto server with creds (username and password)
```
sftp <username>@<host>
put authentication_file_PROJECT-12345.csv
```

3. run the usersync job -
``` 
gen3 job run usersync
```

4. after the usersync is done, check the `/userinfo` endpoint to make sure correct permissions have been added to the user.yaml

5. upload a new indexd record with the `PROJECT-12345` as acl/project IDs

6. perform presigned url tests - positive and negative scenarios are allowed

7. check if the user still has access to their dbgap projects and projects/permission from the useryaml







