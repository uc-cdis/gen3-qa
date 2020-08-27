/*
 Exploration page & Export to PFB Button
 (Focused on functionality. Ignoring data accuracy / input & output assertions)
 This test plan has a few pre-requisites:
 1. Sower and pelican-export must be enabled
 2. It assumes the Data Dictionary + clinical data submission + etl operations are healthy
 3. The .avro file that is downloaded must be compatible with the latest-latest pyPfb version (https://github.com/uc-cdis/pypfb) -- Testing with master branch (*NOT* with the latest version from PyPy: https://pypi.org/project/pypfb/)
*/
Feature('Export to PFB Button');

const { expect } = require('chai');
const { checkPod, sleepMS, Gen3Response } = require('../../utils/apiUtil.js');
const { Bash } = require('../../utils/bash.js');

const bash = new Bash();

AfterSuite(async (I, files) => {
  // clean up test files
});

// Scenario #1 - Submit some dummy clinical metadata
Scenario('Run batch process to generate and submit clinical metadata @pfbButton', async (I) => {
  bash.runJob('gentestdata');
  await checkPod('gentestdata', 'gen3job,job-name=gentestdata');
});

// Scenario #2 - Run ETL
Scenario('Run batch process to ETL the clinical metadata @pfbButton', async (I) => {
  bash.runJob('etl');
  await checkPod('etl', 'gen3job,job-name=etl');
});

// Scenario #3 - Click on Export to PFB button
Scenario('Navigate to Explorer page, assemble cohort and click on Export to PFB Button @pfbButton', async (I, home, users) => {
  home.do.goToHomepage();
  home.complete.login(users.mainAcct);
  I.amOnPage('/explorer');
  I.click({ xpath: 'xpath: //p[contains(text(), \'Subject\') and @class=\'g3-filter-group__tab-title\']' });
  I.saveScreenshot('I_open_the_subject_tab_on_explorer_page.png');
  I.click({ xpath: 'xpath: //span[contains(text(), \'Other\') and @class=\'g3-single-select-filter__label\']' });

  I.click({ xpath: 'xpath: //span[contains(text(), \'Export to PFB\') and @class=\'explorer-button-group__download-button g3-button g3-button--primary\']' });
  I.saveScreenshot('I_click_on_export_to_pfb_button.png');

  await checkPod('pelican-export', 'sowerjob');

  // TODO: wait for URL to show up on the footer's panel
  // TODO: Capture URL, download .avro file and decode it
});
