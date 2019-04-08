Feature('ExportToWorkspaceTest');

const I = actor();

BeforeSuite((home) => {
  home.complete.login();
});

// Scenario('Click Workspace tab when logged out and logged in @exportToWorkspace', (portalExportToWorkspace, home) => {
//   portalExportToWorkspace.complete.checkClickWorkspaceTabWithLogoutAndLogin(home);
// });

// Scenario('Check export to workspace message toaster @exportToWorkspace', (portalExportToWorkspace) => {
//   portalExportToWorkspace.complete.checkMessageToaster();
// });

Scenario('Export default manifest, mount it and check manifest name @exportToWorkspace', (portalExportToWorkspace) => {
  portalExportToWorkspace.complete.checkExportDefaultManifestToWorkspace();
});

AfterSuite((home) => {
  I.saveScreenshot('a.png');
  home.complete.logout();
});
