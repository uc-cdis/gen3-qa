'use strict';

const seeSummary = function() {
  this.waitNumberOfVisibleElements('.h1-typo', 1, 5);
  // this.seeNumberOfElements('.h4-typo', 7);
  this.waitNumberOfVisibleElements('.h3-typo', 5, 5);
  // this.seeNumberOfElements('.special-number', 4);
};

const seeChart = function() {
  // this.seeElement({css: 'div.recharts-responsive-container'});
};

module.exports.seeHomepageDetails = function () {
  let I = actor({
    seeSummary: seeSummary,
    seeChart: seeChart,
  });
  I.seeSummary();
  I.seeChart();
};
