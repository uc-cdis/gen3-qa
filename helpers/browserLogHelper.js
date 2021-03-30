const Helper = codecept_helper; // eslint-disable-line

class browserLogHelper extends Helper {
  async captureBrowserLog() {
    const { browser } = this.helpers.WebDriver;
    const browserlogs = await browser.getLogs('browser');
    console.log(browserlogs);
  }
}

module.exports = browserLogHelper;
