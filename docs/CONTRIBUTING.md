## General rules/guidelines
- Avoid using Codecept's `I` actor directly in a Scenario - toss it into an actor.
- Avoid using Chai assertions directly in a Scenario - toss it into a question.
- Keep assertions out of `tasks`, keep actions out of `questions` - combine them in `sequences`
- Avoid hardcoding page and API attributes (e.g. locators, endpoints) into `questions` and `tasks`, put them in `props`
- When creating Promises, avoid using reject() - it can erase the stacktrace if mishandled

## PR Checklist
- [ ] Wrapped failing tests (from known bugs) in try/catch blocks, made comment next to fail with link to bug issue
- [ ] Avoided putting questions (assertions) inside of any Tasks you wrote
- [ ] Implemented cleanup in `After()` for any test that modified state shared across Tests/Suites
- [ ] Added appropriate `@tags` to tests that require/do something *special* (e.g. requires simulated data)
- [ ] Successfully ran _all_ tests on a qa commons which uses the feature (qa-kidsfirst, qa-bloodpac, qa-brain, qa-niaid)
- [ ] Successfully completed a Jenkins build on a qa commons with my gen3-qa test branch
(See below for details)

## Making Pull Requests
Before making a pull request, you should verify that your new tests work on commons that use the feature you wrote the test for. First, test it on your own dev namespace. Don't run the tests on a jenkins-* or qa-* namespace, this could mess up other tests!

Once you have gotten the tests to pass when running from your local machine, make a PR and it should trigger a jenkins build.

If your test exposes a bug (i.e. it fails every time) and it won't be fixed any time soon, wrap the failing assertion in a try/catch and write a comment next it with a reference to the bug's issue. This isn't a great thing to do, so if you find a better solution please change this recommendation!
