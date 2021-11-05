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

const I = actor();
I.cache = {};
I.cache.tabs = [];

async function getAlltabs(I){
  // get all tabs which have available data, only do it once
  I.useWebDriverTo('check property of the download button', async ({ browser }) => {
    browser.setWindowSize(1920, 1080);
  });
  I.amOnPage('/explorer');
  I.wait(5);
  I.saveScreenshot('explorePageDownloadButton.png');
  // click accept for the user agreement
  I.click('//button[contains(text(), \'Accept\')]');
  // get the number of tabs
  const numOfTbas = await I.grabNumberOfVisibleElements('//button[@role="tab"]');
  for (let i = 1; i < numOfTbas + 1; i++) {
    I.waitForClickable(`//button[@role="tab"][position()=${i}]`);
    const tabName = await I.grabTextFrom(`//button[@role="tab"][position()=${i}]`);
    I.click(`//button[@role="tab"][position()=${i}]`);
    I.wait(2);
    I.saveScreenshot(`CheckButtonInTab${i}.png`);
    /*let btPending = 'true';
      I.useWebDriverTo('check property of the download button', async (Webdriver) => {
        const button = await Webdriver._locate('//button[contains(text(),"Login to download")][position()=1]');
        btPending = await button[0].getAttribute('isPending');
        console.log(`### ##In tab ${tabName}, the download is pending: ${btPending}`)
    });*/
    btPending = await tryTo(() => I.waitForElement('//button[contains(text(),"Login to download") and @class="explorer-button-group__download-button g3-button g3-button--disabled"]', 2));
    //I.seeElement('//button[contains(text(),"Login to download")][position()=1]');
    //btPending = await I.grabAttributeFrom('//button[contains(text(),"Login to download")][position()=1]', 'isPending');
    if(!btPending){
      console.log(`### ##Data in ${tabName} is available to download!`);
      I.cache.tabs.push(`//button[@role="tab"][position()=${i}]`);
    }
    else{
      console.log(`### ##The download button is disabled. The data number of ${tabName} should be 0`);
      I.seeElement('//div[@class="count-box__number--align-center special-number" and text()="0"]');
    }
  }
}


Scenario('redirect to login page from the download button @registerUser',
  async ({ I }) => {
    await getAlltabs(I);
    for (let i = 0; i < I.cache.tabs.length; i++){
      // Click the tab
      const tab = I.cache.tabs[i];
      I.waitForClickable(tab, 5);
      I.click(tab);
      // Click the button
      I.waitForClickable('//button[contains(text(),"Login to download")][position()=1]', 5);
      I.click('//button[contains(text(),"Login to download")][position()=1]');
      I.seeCurrentUrlEquals('/login');
      // go back to explore page
      I.amOnPage('/explorer');
    }
  });

Scenario('redirect to register page after login @registerUser',
  async ({ I, home, users }) => {
    await home.do.login(users.mainAcct.username);
    I.wait(3);
    I.saveScreenshot('afterLogin.png');
    I.seeCurrentUrlEquals('/user/register/');
  });

  Scenario('register to get access to download data @registerUser',
  async ({ I, home, users }) => {
    await home.do.login(users.mainAcct.username);
    I.seeCurrentUrlEquals('/user/register/');
    I.wait(3);
    I.saveScreenshot('registerPage.png');
    I.fillField('#firstname', 'Cdis');
    I.fillField('#lastname', 'Test');
    I.fillField('#organization', 'Uchiago');
    I.click('//button[contains(text(),\'Register\')]');

    // after complete register
    I.amOnPage('/explorer');
    I.wait(5);
    I.saveScreenshot('expolerPageAfterRegisted1.png');
    for (let i = 0; i < I.cache.tabs.length; i++){
      // Click the tab
      const tab = I.cache.tabs[i];
      I.waitForClickable(tab, 5);
      I.click(tab);
      // Click the button
      I.waitForClickable('//button[contains(text(),"Download")][position()=1]', 5);
      I.click('//button[contains(text(),"Download")][position()=1]');
      // TODO: check download url
    }
  });

Scenario('registered user should have access to download data @registerUser',
  async ({ I, home, users }) => {
    await home.do.login(users.mainAcct.username);
    I.amOnPage('/explorer');
    I.wait(5);
    I.saveScreenshot('expolerPageAfterRegisted2.png');
    for (let i = 0; i < I.cache.tabs.length; i++){
      // Click the tab
      const tab = I.cache.tabs[i];
      I.waitForClickable(tab, 5);
      I.click(tab);
      // Click the button
      I.waitForClickable('//button[contains(text(),"Download")][position()=1]', 5);
      I.click('//button[contains(text(),"Download")][position()=1]');
      // TODO: check download url
    }
  });
