Feature('ExportPFB');

Before((home) => {
  home.complete.login();
});

Scenario('Export PBF with access to data @Pelican', (pelican) => {
	// run the test export sequence 
	pelican.complete.testExport();
});

Scenario('Export PFB without access to data @Pelican', (pelican) => {
	// run the export and expect to see no button
});
