Feature('ExportToWorkspaceTest');

const I = actor();

Before((home) => {
  home.complete.login();
});

/* Click on the Workspace Tab on the Homepage to redirect user to the Jupyter Notebook page.
Check for different behaviors when user has or has not logged in. */
Scenario('Click Workspace tab when logged out and logged in @exportToWorkspacePortal', async (portalExportToWorkspace, home) => {
  await portalExportToWorkspace.complete.checkClickWorkspaceTabWithLogoutAndLogin(home);
});

/* When clicking on the 'Export to Workspace' button, a message is displayed on the bottom of the screen.
On the successful request, the file name is specified in the message section.
Verify that the message toaster has correct format. */
Scenario('Check export to workspace success message toaster @exportToWorkspacePortal', async (portalExportToWorkspace) => {
  await portalExportToWorkspace.complete.checkMessageToasterSuccess();
});

/* Export default manifest to workspace, mount the exported manifest using Python commands,
and verify the mounted manifest file name should be same as the previously exported manifest. */
Scenario('Export default manifest, mount it and check manifest name @exportToWorkspacePortal', async (portalExportToWorkspace) => {
  await portalExportToWorkspace.complete.checkExportDefaultManifestToWorkspace();
});

After((home) => {
  home.complete.logout();
});
