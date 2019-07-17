Feature('ExportPFB');

Before((home) => {
  home.complete.login();
});

Scenario('Export PBF with access to data @Pelican', (pelicanPortal) => {
	// run the test export sequence 
	pelicanPortal.complete.testExport();
});

Scenario('Export PFB without access to data @Pelican', (pelicanPortal) => {
	// run the export and expect to see no button
});
