'use strict';

let I = actor();

const generic_tasks = {
  clickProp(prop) {
    if (prop === undefined)
      throw new Error('Missing prop');
    //let locator = prop.locators.css || prop.locators.text || prop.locators.xpath;
    I.click(prop.locators);
  }
};

const generic_questions = {
  seeProp(prop) {
    if (prop === undefined)
      throw new Error('Missing property');
    if (prop.locators.hasOwnProperty('text')) {
      I.waitForText(prop.locators.text);
      return;
    }
    I.seeElement(Object.values(prop.locators)[0]);
  }
};

module.exports = {
  props: null,

  do: generic_tasks,

  ask: generic_questions
};