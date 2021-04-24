Feature('User Form Submission');

const chai = require('chai');
const { interactive, ifInteractive } = require('../../utils/interactive.js');

const { expect } = chai;

/*
1. User1 with access to project DEV-test
 */

Scenario('The property descriptions in the user form submission page are well-spaced and aligned', ifInteractive(
  async () => {
    const result = await interactive(`
            1. Navigate to project DEV-test (/DEV-test)
            2. Toggle User Form Submission ON
            3. Select a node (e.g. case or subject) from the dropdown below
            4. Verify that the property names, input boxes and descriptions are grouped together
            5. Verify that the properties are well-spaced
       `);
    expect(result.didPass, result.details).to.be.true;
  },
));
