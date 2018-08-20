## PR Checklist
- [ ] Wrapped failing tests in try/catch blocks, made comment next to fail with link to bug issue
- [ ] Removed any debugging `console.log()`
- [ ] Successfully ran _all_ tests (not just my new ones) on my own qa commons
- [ ] Successfully ran _all_ tests on a qa commons which uses the feature (qa-kidsfirst, qa-bloodpac, qa-brain, qa-niaid)
- [ ] Successfully completed a Jenkins build on a qa commons with my gen3-qa test branch
(See below for details)

## Making Pull Requests
Before making a pull request, you should verify that your new tests work on commons that use the feature you wrote the test for. First, test it on your own qa commons. Once you have that passing, run the tests on another qa-commons (e.g. qa-kidsfirst).

Once you have gotten the tests to pass when running from your local machine, you want to make sure Jenkins will build it successfully as well. To do this, go to [jenkins.planx-pla.net](https://jenkins.planx-pla.net/) > click on a commons > Configure > Pipeline > enter your branch in Branch Specifier. Then go back to the qa commons and click Build with Parameters.

If your test exposes a bug (i.e. it fails every time) and it won't be fixed any time soon, wrap the failing assertion in a try/catch and write a comment next it with a reference to the bug's issue. This isn't a great thing to do, so if you find a better solution please change this recommendation!

