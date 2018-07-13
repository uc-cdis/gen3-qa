'use strict';

let Helper = codecept_helper;

class CDISHelper extends Helper {
  async _beforeSuite(suite) {
    if (!suite.title.indexOf('API') >= 0)
    {
      const helper = this.helpers['WebDriverIO'];
      helper.amOnPage('');
      let access_token = process.env.ACCESS_TOKEN;
      helper.setCookie({name: 'access_token', value: access_token});
    }
  }
}

module.exports = CDISHelper;
