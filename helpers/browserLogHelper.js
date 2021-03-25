const Helper = codecept_helper;

class browserLogHelper extends Helper {
  async captureBrowserLog(){
    const browser = this.helpers.WebDriver.browser;
    let browserlogs = await browser.getLogs('browser');
    console.log(browserlogs);
    //I.useWebDriverTo('capture browser log', async ({ browser }) => {
      //let browserlogs = await browser.getLogs('browser');
      //console.log(browserlogs);
    //});
  }
}

module.exports = browserLogHelper;


