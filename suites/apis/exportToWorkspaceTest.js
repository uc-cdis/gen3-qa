Feature('ExportToWorkspaceAPITest');

const I = actor();

Scenario('Export default manifest and check if it exists in manifestservice endpoint @exportToWorkspace', async (manifestService, users) => {
  const manifestFilename = await manifestService.do.postManifestForUser(users.mainAcct);
  let res = await manifestService.do.getManifestForUser(users.mainAcct);
  manifestService.ask.doesHaveManifestVisible(res, manifestFilename);
  res = await manifestService.do.getManifestForUser(users.auxAcct1);
  manifestService.ask.doesNotHaveManifestVisible(res, manifestFilename);
});

