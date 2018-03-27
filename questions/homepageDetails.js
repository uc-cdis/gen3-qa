'use strict';

const seeSummary = function() {
  this.waitForText('Project Submission Summary', 5);
  ['Cases', 'Experiments', 'Aliquots', 'Files'].map(
    item => this.see(item)
  );
};

const seeChart = function() {
  this.seeElement({css: 'div.recharts-responsive-container'});
};

const seeProjectList = function() {
  this.see('List of Projects');
};


const seeTransactionLogs = function() {
  this.see('Recent Submissions');
};

module.exports.seeHomepageDetails = function () {
  let I = actor({
    seeSummary: seeSummary,
    seeChart: seeChart,
    seeProjectList: seeProjectList,
    seeTransactionLogs: seeTransactionLogs,
  });
  I.seeSummary();
  I.seeChart();
  I.seeProjectList();
  I.seeTransactionLogs();
};
