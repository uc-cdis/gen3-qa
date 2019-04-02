Feature('ExportToWorkspaceTest');

const I = actor();

Before((home) => {
  home.complete.login();
});

Scenario('Export default manifest and see successful popup', (portalExportToWorkspace) => {
  portalExportToWorkspace.complete.checkExportDefaultManifestToWorkspace();
});

After((home) => {
  home.complete.logout();
});
