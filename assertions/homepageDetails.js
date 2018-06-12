'use strict';

const seeSummary = function() {
  this.seeNumberOfElements('.h1-typo', 1);
  // this.seeNumberOfElements('.h4-typo', 7);
  this.seeNumberOfElements('.h3-typo', 5);
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
