const Helper = codecept_helper;

class browserLogHelper extends Helper {
  async captureBrowserLog(){
    const browser = this.helpers.WebDriver.browser;
    let browserlogs = await browser.getLogs('browser');
    console.log(browserlogs);
  }
}

module.exports = browserLogHelper;


