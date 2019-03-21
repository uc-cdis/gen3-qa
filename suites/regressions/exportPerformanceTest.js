Feature('Export Performance Tests')
  .tag('@ExportPerformanceTests')
  .tag('@Performance');

const chai = require('chai');
const r = require('../../utils/regressions.js');

const expect = chai.expect;

Data(r.longestPath)
  .Scenario(`Export all nodes of type:`, async (current, sheepdog) => {
    const nodeType = await current.nodes;
    expect(r.programSlashProject).to.not.equal('', 'Please provide a value for the PROGRAM_SLASH_PROJECT environment variable');
    expect(typeof r.programSlashProject).to.not.equal('undefined', 'Please provide a value for the PROGRAM_SLASH_PROJECT environment variable');

    const res = await r.exportAllNodesOfASingleType(r.programSlashProject, nodeType);
    sheepdog.ask.hasStatusCode(res, 200);
  });

Data(r.representativeIDs)
  .Scenario(`Exporting a record by ID on nodes of type:`, async (current, sheepdog) => {
    const id = await current.nodes;
    expect(r.programSlashProject).to.not.equal('', 'Please provide a value for the PROGRAM_SLASH_PROJECT environment variable');
    expect(typeof r.programSlashProject).to.not.equal('undefined', 'Please provide a value for the PROGRAM_SLASH_PROJECT environment variable');

    const res = await r.exportNodesByID(id);
    sheepdog.ask.hasStatusCode(res, 200);
  });
