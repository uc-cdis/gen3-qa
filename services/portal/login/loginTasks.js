const loginProps = require('./loginProps.js');
const portal = require('../../../utils/portal.js');
const { Bash } = require('../../../utils/bash.js');

const bash = new Bash();
const I = actor();

/**
 * login tasks
 */
module.exports = {
  goToLoginPage() {
    I.amOnPage(loginProps.path);
    portal.seeProp(loginProps.ready_cue, 60);
  },

  async systemUseMsg() {
    I.saveScreenshot('SystemUseMessage.png');
    const title = await bash.runCommand('gen3 secrets decode portal-config gitops.json | jq \'.components.systemUse.systemUseTitle\'');
    console.log(title);
    if (title !== null && title !== '') {
      const numberOfElements = await I.grabNumberOfVisibleElements(`//div[contains(text(), ${title})]//ancestor::div[contains(@class, "popup__box")]`);
      console.log(`### numberOfElements:${numberOfElements}`);
      if (numberOfElements > 0) {
        I.click(loginProps.systemUseAcceptButton.locator);
      }
    }
  },

  /**
   * Logs into windmill. Uses the "dev_login" cookie to tell fence
   * which username to use when mocking the login.
   * /!\ remember to logout after logging in or following tests will fail!
   */
  async login(username) {
    if (I.seeCurrentUrlEquals(loginProps.path)) {
      console.log('Already on Login Page');
    } else {
      if (process.env.testedEnv.includes('mickey') || process.env.testedEnv.includes('va')) {
        await this.systemUseMsg();
      }
      this.goToLoginPage();
    }
    I.setCookie({ name: 'dev_login', value: username });
    portal.clickProp(loginProps.googleLoginButton);
  },

  // This should become default once all Commons move to the version of portal
  // with Login button on top bar
  topBarLogin(username) {
    this.goToLoginpage();
    I.setCookie({ name: 'dev_login', value: username });
    portal.clickProp(loginProps.loginButton);
    portal.clickProp(loginProps.googleLoginButton);
  },

  /**
   * Logs out of windmill
   */
  logout() {
    portal.clickProp(loginProps.logoutButton);
  },

  logoutThroughDropdown() {
    I.waitForElement({ css: '.g3-icon--user-circle' }, 15);
    I.click('.g3-icon--user-circle');
    portal.clickProp({ locator: { xpath: '//a[contains(text(), \'Logout\')]' } });
  },
};
