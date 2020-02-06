Manual test for open access data availability

Requires arborist >2.4.0

- Setup: all_users_policies should have a valid policy in it (_loggedIn policy_)
    containing a resource (_open access resource_).
- Setup: Some project should have the _open access resource_.
    - In BDCat internalstaging and prod, tutorial-synthetic_data_set_1  is an example project that already has this setup.
-[ ] Log in as any user NOT in user.yaml
-[ ] Go to Exploration page
-[ ] Click on 'Subject' in the filters > 'Project ID'
-[ ] Expect to see open access projects.
    - In BDCat internalstaging and prod, tutorial-synthetic_data_set_1
-[ ] Expect to be able to download PFB of the data
-[ ] Go to /user/user
-[ ] Expect to see open access resources included in 'authz'
-[ ] Expect to see open access resources included in 'resources'