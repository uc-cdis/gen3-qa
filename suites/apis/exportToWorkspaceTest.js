Feature('ExportToWorkspaceAPITest @requires-fence @requires-manifestservice').retry(2);

/* POST request with user creds to the manifestservice endpoint at /manifests/
to get a list of exported manifests of that user.
Verify that user cannot see other users' manifests if don't have their creds.
This scenario requires two user accounts */
Scenario('Export default manifest and check if it exists in manifestservice endpoint @exportToWorkspaceAPI', async ({ manifestService, users }) => {
  // Create manifest for user1 using dummy data
  const postRes = await manifestService.do.postManifestForUser(users.mainAcct);
  // Check if the response looks correct
  manifestService.ask.assertPostManifestSuccess(postRes);
  // Extract the manifest filename from the response
  const manifestFilename = await manifestService.do.extractManifestFilenameFromResponse(postRes);
  // POST to get manifest listing as user1
  let getRes = await manifestService.do.getManifestForUser(users.mainAcct);
  // Verify user1 can see the created manifest
  manifestService.ask.doesHaveManifestVisible(getRes, manifestFilename);
  // POST to get manifest listing as user2
  getRes = await manifestService.do.getManifestForUser(users.auxAcct1);
  // Verify user2 cannot see the manifest created by user1
  manifestService.ask.doesNotHaveManifestVisible(getRes, manifestFilename);
});
