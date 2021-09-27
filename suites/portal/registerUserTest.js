Feature('Register User For Data Downloading');

/*
USER STORIES
* As a MIDRC Administrator and Sponsor I want to contact users downloading 
* data in the MIDRC data portal. Registering users permits me to know who 
* specifically is able to download data, and contact them if necessary.  I want 
* to know their full name, organization/affiliation, and email address. 

SCENARIOS
* 1. For users who are not registered and not logged in:
*   1) click login button 
*   2) click download button on explore page
*   to redirect to login and register page
*   Or they only can browse data, but not download
* 2. For useres who are logged in but not regitered:
*    they will be prompted to fill in registration information
* 3. For useres who are logged in and regitered:
*    they are able to download data
*/


Scenario('redirect to login page from the download button @registerUser',
  async ({I}) => {
    I.amOnPage('/explorer');
    I.wait(5);
    I.saveScreenshot('explorePageDownloadButton.png');
    I.waitForClickable('//button[contains(text(),"Login to download case metadata")]', 5);
    I.click('//button[contains(text(),"Login to download case metadata")]')
    I.seeCurrentUrlEquals('/login');
  }); 

Scenario('redirect to register page after login @registerUser',
  async ({I, home, users}) => {
    home.do.login(users.mainAcct.username);
    I.seeCurrentUrlEquals('/user/register/');
  });

Scenario('register to get access to download data @registerUser',
  async ({I, home, users}) => {
    home.do.login(users.mainAcct.username);
    I.seeCurrentUrlEquals('/user/register/');
    I.wait(5);
    I.saveScreenshot('registerPage.png')
    I.fillField('#firstname', 'Cdis');
    I.fillField('#lastname', 'Test');
    I.fillField('#organization', 'Uchiago');
    I.click('//a[contains(text(),\'Terms and Conditions.\')]');
    I.click('//input[@id=\'checkbox\']')
    I.click('//button[contains(text(),\'Register\')]');

    // after complete register
    I.amOnPage('/explorer');
    I.wait(5);
    I.saveScreenshot('expolerPageAfterRegisted1.png');
    I.waitForClickable('//button[contains(text(),"Download Case Metadata")]', 5);
    I.click('//button[contains(text(),"Download Case Metadata")]');
    
    // handle download
    I.handleDownloads();
    I.amInPath('/output/downloads');
    I.seeFileNameMatching('MIDRC_case_metadata');
  });

/*Scenario('registered user should have access to download data @registerUser',
  async ({I, home, users}) => {
    home.do.login(users.mainAcct.username);
    I.amOnPage('/explorer');
    I.wait(5);
    I.saveScreenshot('expolerPageAfterRegisted2.png');
    I.waitForClickable('//button[contains(text(),"Download Case Metadata")]', 5);
    I.click('//button[contains(text(),"Download Case Metadata")]');
    I.seeFileNameMatching('MIDRC_case_metadata');
  });*/

