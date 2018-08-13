'use strict';

module.exports.seeVisualizations = function () {
  this.seeElement('.data-explorer__visualizations');
};

module.exports.seeSQON = function() {
  this.seeElement('.sqon-view')
}

module.exports.dontSeeSQON = function() {
  this.dontSeeElement('.sqon-view');
}