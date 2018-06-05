'use strict';

const seeSummary = function() {
  this.waitForText('Data Submission Summary', 5);
  ['Cases', 'Studies', 'Aliquots', 'Files'].map(
    item => this.see(item)
  );
};

const iterateProjectTable = async function(linkNames) {
  // iterate through linkNames, clicking buttons and verifying links
  let i = 0;
  for (const name of linkNames) {
    let row_select = 'tr.sc-jWBwVP:nth-child(' + (i + 1) + ')';
    this.scrollTo(row_select);
    within(row_select, async () => {
      await this.verifyLink('Submit Data', name)
    });
    ++i;
  }
};

const seeProjectList = async function() {
  let proj_list_header = ['Project', 'Cases', 'Studies', 'Aliquots', 'Files'];
  this.waitForText('List of Projects', 10);

  // check table header
  within(".sc-eHgmQL", () => {
    proj_list_header.map(
      item => this.see(item)
    );
  });

  // projects list - NOTE: tests this ordering for links!
  let projects = [
    'BPA-TEST', 'DEV-BLGSP', 'DEV-open', 'DEV-test',
    'DEV-topmed-public', 'GENOMEL-GENOMEL', 'QA-4TEST'
  ];
  // verify project names are in the table
  projects.map(
    item => this.see(item)
  );

  // click buttons for each project and verify it links to correct page
  await iterateProjectTable.call(this, projects);
};

const seeRecentSubmissions = function() {
  let proj_list_header = ['Id', 'Project', 'Created date', 'State'];
  this.waitForText('Recent Submissions', 10);

  proj_list_header.map(
    item => this.see(item)
  )
};

module.exports.seeSubmissionDetails = function () {
  const { verifyLink } = require('../steps/homepage');
  let I = actor({
    verifyLink: verifyLink,
    seeSummary: seeSummary,
    seeProjectList: seeProjectList,
    seeRecentSubmissions: seeRecentSubmissions
  });
  I.seeSummary();
  I.seeProjectList();
  I.seeRecentSubmissions();
};