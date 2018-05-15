'use strict';

const seeSummary = function() {
  this.waitForText('Data Commons Hub', 5);
  ['Cases', 'Studies', 'Aliquots', 'Files'].map(
    item => this.see(item)
  );
};

const seeChart = function() {
  this.seeElement({css: 'div.recharts-responsive-container'});
};

const seeButtonBar = function() {
  ['Define Data Field', 'Explore Data', 'Access Data', 'Analyze Data'].map(
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
