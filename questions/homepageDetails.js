'use strict';

const seeSummary = function() {
  this.waitForText('Data Commons Hub', 5);

  // figure
  this.waitForElement('.recharts-surface', 5);
  ['Cases', 'Studies', 'Aliquots', 'Files'].map(
    item => this.see(item)
  );
  ['GENOMEL', '4TEST', 'TEST', 'topmed-public', 'others'].map(
    item => this.see(item)
  );

  this.see('Submit Data')
};

const seeChart = function() {
  this.seeElement({css: 'div.recharts-responsive-container'});
};

const seeButtonBar = function() {
  // headers
  ['Define Data Field', 'Explore Data', 'Access Data', 'Analyze Data'].map(
    item => this.see(item)
  );
  // buttons
  ['Learn more', 'Explore data', 'Query data', 'Run analysis'].map(
    item => this.see(item)
  );
};

module.exports.seeHomepageDetails = function () {
  let I = actor({
    seeSummary: seeSummary,
    seeChart: seeChart,
    seeButtonBar: seeButtonBar,
  });
  I.seeSummary();
  I.seeChart();
  I.seeButtonBar();
};
