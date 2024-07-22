# Configuring Cascading Authorization for dbGaP Sync Tests

1. Add the `authentication_file_phs001194.txt` in this directory to the SFTP Server used by the integration test environments. 
2. Update the integration test environments' fence-config.yaml to include the `parent_to_child_studies_mapping` for the dbGaP.info configuration for the SFTP Server in Step 1.
3. Run `gen3 kube-setup-fence` so the changes to the fence-config.yaml changes are applied to the cluster.

fence-config.yaml example: 

```
dbGaP:
  - info:
      host: 'sftp.server.example.not-a-real-server.amazonaws.com'
      username: 'jenkins-dcp'
      password: ''
      port: 22
      proxy: 'cloud-proxy.internal.io'
      proxy_user: 'sftpuser'
      encrypted: false
    study_to_resource_namespaces:
        '_default': ['/']
    allow_non_dbGaP_whitelist: true
    allowed_whitelist_patterns: ['authentication_file_PROJECT-(\d*).(csv|txt)', 'authentication_file_NCI-(\d*).(csv|txt)']  
    protocol: 'sftp'
    decrypt_key: <redacted>
    parse_consent_code: false
    parent_to_child_studies_mapping:
      'phs001194': ['phs000571']
```