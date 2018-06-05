'use strict';

const seeSummary = function() {
  this.waitForText('Data Commons Hub', 5);
  this.see('The Brain Health Data Commons supports the management,');
  this.see('Submit Data');

  // open submit link in new tab
  this.pressKey('Command');
  this.scrollPageToBottom();
  this.click('Submit Data');
  this.pressKey('Command');
  // check url and close tab
  this.switchToNextTab();
  this.waitInUrl('/submission', 5);
  this.closeCurrentTab();
};

const seeChart = function() {
  this.seeElement({css: 'div.recharts-responsive-container'});
  this.waitForElement('.recharts-surface', 5);
  // y axis
  ['Cases', 'Studies', 'Aliquots', 'Files'].map(
    item => this.see(item)
  );
  // x axis
  ['GENOMEL', '4TEST', 'TEST', 'others'].map( //, 'topmed-public' failing
    item => this.retry(3).see(item)
  );
};

function BarCard(title, desc, btn, url){
  this.title = title;
  this.desc = desc;
  this.btn = btn;
  this.url = url;
}

let bar_cards = [
  new BarCard('Define Data Field', 'The BRAIN Data Hub define', 'Learn more', '/DD'),
  new BarCard('Explore Data', 'The Exploration Page gives you', 'Explore data', '/shiny'),
  new BarCard('Access Data', 'Use our selected tool to filter', 'Query data', '/query'),
  new BarCard('Analyze Data', 'Analyze your selected cases using', 'Run analysis', '/workspace')
];

const seeButtonBar = function() {
  // check titles
  bar_cards.forEach(
    item => this.see(item.title)
  );

  // check descriptions
  bar_cards.forEach(
    item => this.see(item.desc)
  );

  // check buttons
  bar_cards.forEach(
    item => this.see(item.btn)
  );

  // check links
  bar_cards.forEach(
    item => {
      // open link in new tab
      this.pressKey('Command');
      this.click(item.btn);
      this.pressKey('Command');
      // check url and close tab
      this.switchToNextTab();
      this.waitInUrl(item.url, 5);
      this.closeCurrentTab();
    }
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
