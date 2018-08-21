'use strict';

var rule = require('./node_modules/eslint-plugin-codeceptjs/lib/rules/no-actor-in-scenario');
var actorMethods = require('./node_modules/eslint-plugin-codeceptjs/lib/rules/actorMethods');
var RuleTester = require('eslint').RuleTester;

var myconfig = {
	"parserOptions": {
    "ecmaVersion": 8,
    "sourceType": "module",
    "ecmaFeatures": {
      "jsx": true
    }
  }
}

var ruleTester = new RuleTester(myconfig);

function invalidScenarios(functionStyle) {
  var invalidScenarios = actorMethods.map(function(actorMethod) {
    return {
      code: `Scenario('My scenario', ${functionStyle} { I.${actorMethod}() })`,
      parserOptions: { ecmaVersion: 6 },
      errors: [{
        message: "Do not use actor in Scenario, prefer delegating to page objects"
      }]
    };
  });
  return invalidScenarios;
}

ruleTester.run("no-actor-in-scenario", rule, {
  valid: [
    "Before(function(I) { I.amOnPage() }); Scenario('My scenario', async function (Page) { await Page.submit() });",
  ],
  invalid: invalidScenarios("function(I)").concat(invalidScenarios("(I) =>"))
});