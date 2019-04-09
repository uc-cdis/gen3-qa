Feature('ExportToWorkspaceAPITest');

const I = actor();

/* POST request with user creds to the manifestservice endpoint at /manifests/ to get a list of exported manifests of that user.
Verify that user cannot see other users' manifests if don't have their creds.
This scenario requires two user accounts */
Scenario('Export default manifest and check if it exists in manifestservice endpoint @exportToWorkspace', async (manifestService, users) => {
  // Create manifest for user1 using dummy data
  const manifestFilename = await manifestService.do.postManifestForUser(users.mainAcct);
  // POST to get manifest listing as user1
  let res = await manifestService.do.getManifestForUser(users.mainAcct);
  // Verify user1 can see the created manifest
  manifestService.ask.doesHaveManifestVisible(res, manifestFilename);
  // POST to get manifest listing as user2
  res = await manifestService.do.getManifestForUser(users.auxAcct1);
  // Verify user2 cannot see the manifest created by user1
  manifestService.ask.doesNotHaveManifestVisible(res, manifestFilename);
});

