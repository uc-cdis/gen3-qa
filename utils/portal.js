/**
 * Util for performing actions in portal using service props
 * @module portalUtil
 */
const { Bash } = require('./bash');

const bash = new Bash();

const I = actor();

// Default seconds to wait to see a prop
const DEFAULT_WAIT = 5;

/**
 * Verifies a prop is defined
 * @param {Object} prop
 */
const validateProp = function (prop) {
  if (prop === undefined || prop === '') {
    throw Error('Missing property');
  }
  if (!prop.locator) {
    throw Error('No locator for given prop');
  }
};

module.exports = {
  /**
   * Clicks on a given prop
   * @param {Object} prop
   */
  clickProp(prop) {
    validateProp(prop);
    if (prop.container) {
      within(prop.container, () => {
        I.click(prop.locator);
      });
    } else {
      I.click(prop.locator);
    }
  },

  /**
   * Waits for prop(s) to exist in DOM after given seconds
   * @param {Object} prop
   * @param {number} seconds - max number of seconds to wait for prop
   * @param {number} num - (css/xpath only) number times prop should be on page
   */
  seeProp(prop, seconds, num) {
    validateProp(prop);
    if ('text' in prop.locator) {
      I.waitForText(prop.locator.text, seconds || DEFAULT_WAIT);
      return;
    }
    if (num === undefined) {
      I.waitForElement(Object.values(prop.locator)[0], seconds || DEFAULT_WAIT);
    } else {
      I.waitNumberOfVisibleElements(
        Object.values(prop.locator)[0],
        num,
        seconds || DEFAULT_WAIT,
      );
    }
  },

  /**
   * Wait for prop to be visible in DOM after given seconds
   * @param {Object} prop
   * @param {number} seconds
   */
  waitForVisibleProp(prop, seconds) {
    validateProp(prop);
    I.waitForVisible(Object.values(prop.locator)[0], seconds);
  },

  async getPortalConfig(field) {
    const cmd = 'g3kubectl get configmaps manifest-global -o json | jq -r \'.data.portal_app\'';
    const portalApp = bash.runCommand(cmd);
    const portalConfigURL = `https://${process.env.HOSTNAME}/data/config/${portalApp}.json`;
    await I.sendGetRequest(portalConfigURL)
      .then((res) => {
        const data = res.body;
        if (field === undefined) {
          return data;
        }
        return data[field];
      });
  },

  async isPortalUsingGuppy() {
    await this.getPortalConfig('dataExplorerConfig')
      .then((res) => {
        if (res && res.guppyConfig === undefined) {
          return false;
        }
        return true;
      });
  },
};
