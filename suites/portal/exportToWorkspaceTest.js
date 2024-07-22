Feature('ExportToWorkspaceTest @requires-portal @requires-hatchery @requires-wts');

Before(async ({ home }) => {
  await home.complete.login();
});

/* Click on the Workspace Tab on the Homepage to redirect user to the Jupyter Notebook page.
Check for different behaviors when user has or has not logged in. */
Scenario('Click Workspace tab when logged out and logged in @exportToWorkspacePortal @portal', async ({ portalExportToWorkspace, home }) => {
  await portalExportToWorkspace.complete.checkClickWorkspaceTabWithLogoutAndLogin(home);
});

/* When clicking on the 'Export to Workspace' button, a message is displayed on
the bottom of the screen.
On the successful request, the file name is specified in the message section.
Verify that the message toaster has correct format. */
Scenario('Check export to workspace success message toaster @exportToWorkspacePortal @portal @manual', async ({ portalExportToWorkspace }) => {
  await portalExportToWorkspace.complete.checkMessageToasterSuccess();
});

Scenario('Export default manifest, mount it and check manifest name @exportToWorkspacePortalHatchery @portal @manual', async ({ portalExportToWorkspace }) => {
  await portalExportToWorkspace.complete.checkExportDefaultManifestToWorkspaceHatchery();
});

After(async ({ portalExportToWorkspace, home }) => {
  await portalExportToWorkspace.do.terminateWorkspaceHatcheryAndExit();
  await home.complete.logout();
});
