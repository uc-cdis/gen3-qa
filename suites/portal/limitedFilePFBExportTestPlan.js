Feature('Limited File PFB Export Test Plan');
// https://ctds-planx.atlassian.net/browse/PXP-6544
// https://github.com/uc-cdis/data-portal/pull/729
// Limited File PFB Export is a portal feature that allows users to export PFBs of
// data files from the Files tab, with the restriction that users cannot export multiple
// types of data files at the same time.

const { expect } = require('chai');
const { interactive, ifInteractive } = require('../../utils/interactive.js');

/**
 * Setup
 * - For how to deploy limited file pfb export, see https://github.com/uc-cdis/data-portal/pull/729#Deployment%20changes
 * - Commons should have the `data_type` filter available in the files tab.
 * - Commons should have the `Export to PFB` button (type 'export-files-to-pfb') in the Files tab.
 */
Scenario('In Files tab, user should be able to export PFBs where all files are the same Data Type @manual', ifInteractive(
  async () => {
    const result = await interactive(`
      1. Go to explorer page ('/explorer')
      2. Go to Files tab.
      4. Expect 'Export to PFB' button to be disabled, with a tooltip on hover explaining that you have selected a cohort on 2 different nodes.
      4. Select any cohort of files.
      5. Select exactly one of the values in the Data Type filter, so that all files have the same data type.
      6. Expect 'Export to PFB' button to be enabled.
      7. Click 'Export to PFB'.
      8. Expect PFB export job to run and complete successfully, linking user to finished PFB file.
      `);
    expect(result.didPass, result.details).to.be.true;
  },
));

// SETUP
// This test requires knowledge of which data types are on which nodes in the graph.
// For BDCat, a table showing which data types are on which nodes is available here: https://docs.google.com/document/d/12FkAYOpDuSdQScEgYBxXsPUdm8GUuUZgD6xU7EQga5A/edit#heading=h.pkq07nen0m4
// A copy of that table:
// +----------------------------+------------------+---------------------------+
// | Data Type                  | File Type        | Node                      |
// +----------------------------+------------------+---------------------------+
// | Aligned Reads              | CRAM             | submitted_aligned_reads   |
// +----------------------------+------------------+---------------------------+
// | Simple Germline Variation  | VCF              | simple_germline_variation |
// +----------------------------+------------------+---------------------------+
// | Unharmonized Clinical Data | various          | reference_file            |
// +----------------------------+------------------+---------------------------+
// | Variant Calls              | Multisample VCFs | reference_file            |
// +----------------------------+------------------+---------------------------+
// | Other                      | various          | reference_file            |
// +----------------------------+------------------+---------------------------+
// | Variant Annotation         | ???              | reference_file            |
// +----------------------------+------------------+---------------------------+
// | Principal Component        | ???              | reference_file            |
// +----------------------------+------------------+---------------------------+
// | Kinship Matrix             | ???              | reference_file            |
// +----------------------------+------------------+---------------------------+
// | Script                     | ???              | reference_file            |
// +----------------------------+------------------+---------------------------+
Scenario('In Files tab, user should not be able to export PFBs where files are on different nodes in the graph @manual', ifInteractive(
  async () => {
    const result = await interactive(`
      1. Go to explorer page ('/explorer')
      2. Go to Files tab.
      3. Select two values in the Data Type filter that are on different nodes.
      4. Expect 'Export to PFB' button to be disabled, with a tooltip on hover explaining that you have selected a cohort on 2 different nodes.
      5. Clear the Data Type filter.
      6. Select two values in the Data Type filter that are on the same node. (If possible.)
      6. Expect 'Export to PFB' button to be enabled.
      7. Click 'Export to PFB'.
      8. Expect PFB export job to run and complete successfully, linking user to finished PFB file.
      `);
    expect(result.didPass, result.details).to.be.true;
  },
));

// SETUP
// - You'll need to have jq https://stedolan.github.io/jq/ and pypfb https://github.com/uc-cdis/pypfb installed
// - This test requires knowledge of which data types are on which nodes in the graph.
//   See the above test for a reference for BDCat.
Scenario('PFBs downloaded from the files tab should contain correct-looking data @manual', ifInteractive(
  async () => {
    const result = await interactive(`
      1. Go to explorer page ('/explorer')
      2. Go to Files tab.
      3. Select a single value in the Data Type filter.
      4. Make a note: 'N' = how many data files are selected
      5. Make a note: 'sourceNode' = the data file's source node on the graph.
      6. Click the Export to PFB button and download the PFB file.
      7. In a terminal, run:
      $ pfb show -i /path/to/pfb.avro | jq -s 'group_by(.name) | map({name: .[0].name, count: length})'
      This should output json of this format:
      [
        {
          "name": "aligned_reads",
          "count": 130
        },
        {
          "name": "aligned_reads_index",
          "count": 120
        },
        ...
      8. Expect to see that there are 'N' count of 'sourceNode' entities in the PFB.
      9. Referencing the dictionary viewer at <commonsURL>/DD, expect that all other entities in the PFB are either on children or parent nodes of 'sourceNode'. No sibling nodes should be present in the PFB. E.g. if we're exporting with sourceNode=B, and B and C are children of A, we expect to see only A and not C show up in the pfb.
      `);
    expect(result.didPass, result.details).to.be.true;
  },
));
