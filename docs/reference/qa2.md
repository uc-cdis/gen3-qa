# TL;DR

Vision for behavior driven development in gen3.
* We want test plans and acceptance tests to help guide feature development.
* We want to track test plans as artifacts in git
* We want to introduce Gherkin or some similar "living documentation" technology
that allows us to link test automation with human readable test plans
* We want to associate acceptance tests with Jiras and PR's to ensure we develop what we initended to develop.
* We want to have scheduled `gen3` releases that intentionally introduce planned new features that have gone through a validation process with QA
* We want to track and rate outstanding `gen3` bugs and defects
* We want to define and track service level objectives (SLO's) for different gen3 features
* We want to have a clear test plan for evaluating whether a
new `gen3` release is suitable for production.
* We want to have a large suite of regression tests.
* We want our QA tools to be a recursive example of our QA process

## Test Plans

* we should track test plans as artifacts in git alongside gen3-qa 
    - track revisions, pier reviews, etc
* test plans ought to drive test automation
    - there should be a straight forward way to link a human readable test plan to its automation
    - Gherkin https://cucumber.io/docs/guides/overview/
* test plans are written by testers and developers
* for new features test plans are based on examples defined in an
[example mapping](https://cucumber.io/docs/bdd/example-mapping/) meeting

## Automation

* test automation should work standalone and in conjunction with CICD
    - test automation can assume the user or CICD has setup a test environment
* pupeteer - https://www.youtube.com/watch?v=MbnATLCuKI4
* we need to provide utilities 
   - auth 
   - archive files for review
   - timing
   - db-save
   - performance metrics

## Process - BDD

We'll associate each product specification (ex - https://ctds-planx.atlassian.net/wiki/spaces/PLA/pages/41910300/Guppy+-+The+Arranger+replacement) with
a test suite (one or more test plans) that we'll host in the `gen3-qa` github repo
under something like `tests/guppy/` - where each folder has a `README.md` and one or more `.feature` files.

### Example mapping

Once a product summary has been accepted, an [example mapping](https://cucumber.io/docs/bdd/example-mapping/) meeting should be scheduled to drive test plan development.

* yellow card: story
* blue card: rule or acceptance criteria associated with a story
* green card: example to illustrate a rule
* red card: questions that cannot be answered

The data from an example mapping should feed the development of test plans (Gherkin feature definitions), that can be reviewed by the mapping participants (the "3 amigos" - product, dev, test).

    - UX design - workflows - user stories - user journeys

The mapping outputs may also drive the production of an initial jira backlog.
Ideally each jira should include an acceptance criteria in its description - where the
acceptance criteria links directly to a test plan (`.feature`) document if it is external facing.

### Example

* A client has requested a new feature that the PM passes on to the team
* Phillis and Zac sign off on the feature request.  The PM and a developer work together to write up a product summary for the new feature - ex: https://ctds-planx.atlassian.net/wiki/spaces/PLA/pages/41910300/Guppy+-+The+Arranger+replacement
* Phillis and Zac sign off on the product overview and use cases.
* The PM, dev, and QA have an example mapping meeting to write out some concrete example of how the system will behave.
* PM, dev, and QA build up an initial jira backlog - including translation of examples into test plans.

## Process - acceptance testing

We will introduce a new (optional) `QA acceptance testing` github check to our PR review process (and jira pipeline) where the QA team verifies the code passes the acceptance tests 
associated with it.  We can give the QA team tools to deploy a branch to a test environment, and send a message back to github once a PR passes its acceptance tests.

## Process - gen3 releases, CICD, and Metrics

We will schedule periodic `gen3` releases. 
Each release will introduce one or more new
features that QA can track the progress of, and maintain the
latest code running in a QA environment.

We should specify a minimal set of [acceptance tests](https://en.wikipedia.org/wiki/Acceptance_testing) that we
require a new `gen3` release to pass before promotion to production.
    
We should have a quick to run smoke test suite that we can point at a production
commons to check for basic functionality.

We should have a full regression suite that runs through the test plans or
acceptance tests (is there a difference?) for all our feature.s

Our acceptance tests may include a service level objective (SLO)[https://en.wikipedia.org/wiki/Service-level_objective] specifying
throughput, response time, availability - that we should track with metrics.

##QA Process

(initial thoughts)
There are two parts to the QA process carried by both Devs and the QA team. The Dev codes a new feature and performs unit testing. Simultaneously the QA team would create a test plan for the feature and create new test cases for manual testing. Also create test-cases/feature files for automation testing (automate the test cases when feasible). after the unit tests are completed, the feature is deplyed to QA environment. Prior to deployment, there is healthcheck is performed by running the regression suite. This would give us details about if the feature broke something or something is already broken (saves lots of time!). The QA team creates ‘Test Cycle’ (JIRA + Zephyr thing or anyother option instead of Zephyr that works fine with JIRA) to carry out the manual and automated tests on the feature in the QA environment. The report is generated for the manual and automated tests respectively.

For the idea of Test cycle, we could have two folders per test cycle - one is regression tests and others would be featurre tests. after the testing phase is done, move some of the important test cases from feature folder to regression folder. For automating, label the test cases with ‘tobeautomated’ (something like that). As there is bandwidth, someone can start automating those manual tests.

## First Uses

* guppy
* arborist authz
* consent code authz
* qa2 utilities
* bug tracking
