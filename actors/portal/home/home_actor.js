let I = actor();

/**
 * Homepage Actor
 */
module.exports = {
  props: "hi",
  do: {
    goTo() {
      I.amOnPage('');
      I.waitForText('Data Commons', 5)
    }
  }
};