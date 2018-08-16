'use strict';

let I = actor();

const DEFAULT_WAIT = 5;

module.exports = {
  clickProp(prop) {
    // click on a property (locator must be {css: ...} or {xpath: ...})
    if (prop === undefined)
      throw new Error('Missing prop');
    I.click(prop.locator);
  },

  seeProp(prop, seconds, num) {
    // checks if a property is on page (locator can be text, css, or xpath
    if (prop === undefined)
      throw new Error('Missing property');
    if (prop.locator.hasOwnProperty('text')) {
      I.waitForText(prop.locator.text, seconds || DEFAULT_WAIT);
      return;
    }
    if (num === undefined) {
      I.waitForElement(Object.values(prop.locator)[0], seconds || DEFAULT_WAIT);
    } else {
      I.waitNumberOfVisibleElements(Object.values(prop.locator)[0], num, seconds || DEFAULT_WAIT)
    }
  }
};