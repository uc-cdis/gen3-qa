'use strict';

let Helper = codecept_helper;

class CDISHelper extends Helper {
  _beforeSuite(suite) {
    console.log("in before suite code")
    if (!suite.title.indexOf('API') >= 0)
    {
      console.log("before_suite: in if statement")
      const helper = this.helpers['WebDriverIO'];
      helper.amOnPage('');
      let access_token = process.env.ACCESS_TOKEN;
      helper.setCookie({name: 'access_token', value: access_token});
      let test = helper.grabCookie('access_token');
      console.log(test)
    }
  }
}

module.exports = CDISHelper;
