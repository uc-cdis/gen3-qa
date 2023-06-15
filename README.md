# TL;DR Test PR

gen3 integration tests - run by https://jenkins.planx-pla.net/ via a `Jenkinsfile` pipeline in each github repo

## Prerequisites (may not need to install on MAC):

* docker-compose (see https://docs.docker.com/compose/install/)
* gnupg2 pass
```
sudo apt install gnupg2 pass
```

## Basic test run
### Start test infra (influxdb, grafana, selenium)

For using linux/amd64 selenium images:
```
# start test infra
docker compose -f docker-compose-test-infra.yaml up -d
```

For using arm64 selenium images:
```
docker compose -f docker-compose-test-infra-arm64.yaml up -d
```

### Initial setup of influxdb and grafana (only needed on a new containers)
```
# create database
curl -i -XPOST http://localhost:8086/query --data-urlencode "q=CREATE DATABASE ci_metrics"
```
Configure the grafana dashboard by importing `grafana_test_observability.json`. This is a pre-configured dashboard, though the data source needs to be selected while importing.

Edit your `/etc/hosts` file to point the `selenium-hub` and `influxdb` host to your Docker container running on `localhost`.
_/etc/hosts_
```
127.0.0.1 selenium-hub
127.0.0.1 influxdb
```

More information about Selenium Hub in [`cloud-automation's documentation`](https://github.com/uc-cdis/cloud-automation/blob/master/kube/services/selenium/README.md)

### Test with dev environment (ssh backend access)

Run a test locally against a dev environment that you can ssh to and run gen3 commands like this:

```
RUNNING_LOCAL=true NAMESPACE=yourDevNamespace PORTAL_SUFFIX="" TEST_DATA_PATH=./testData npm test -- --verbose --grep '@dataClientCLI|@reqGoogle' --invert --reporter mocha-multi suites/.../myTest.js
```

### Test an arbitrary gen3 commons

Some of our test suites require access to the commons backend, but most of our tests can run against an arbitrary commons given an access token that can interact with the gen3 api.

The `getAccessToken.sh` script is a little helper that can retrieve an access token given an API key.

* First - generate some test data (if necessary for the test) with the appropriate dictionary (see below)
* Next - generate an access token (it will expire in 20 minutes) using an API key from the target commons

```
mkdir -p output
export GEN3_TOKEN_MAIN=$(bash ./getAccessToken.sh ~/Secrets/gen3/qa-brain.planx-pla.net/credentials.json)
```

* Finally - run some tests
```
GEN3_SKIP_PROJ_SETUP=true GEN3_COMMONS_HOSTNAME=qa-brain.planx-pla.net npm test -- --verbose suites/portal/roleBasedUITest.js | tee output/roleBasedResults.txt
```

```
GEN3_SKIP_PROJ_SETUP=true GEN3_COMMONS_HOSTNAME=qa-brain.planx-pla.net TEST_DATA_PATH=./testData npm test -- --verbose suites/sheepdogAndPeregrine/submitAndQueryNodesTest.js | tee output/sheepdogPeregrineResults.txt
```

### Run an interactive test plan

Interactive test plans are our way of managing manual 
test plans.  An interactive test presents a manual tester with 
instructions, collects the results of each test, and
generates a report.

```
mkdir -p output
GEN3_SKIP_PROJ_SETUP=true GEN3_COMMONS_HOSTNAME=qa-brain.planx-pla.net npm test -- --verbose suites/portal/roleBasedUITest.js | tee output/roleBasedResults.txt
```

### Notes

* the OAuth flow tests require `fence-config.yaml` to be configured with `MOCK_GOOGLE_AUTH: true`, since Google doesn't trust robots
* set the GEN3_INTERACTIVE environment variable to `false` to disable interactive tests that require user feedback.  See the [executable test plans overview](./docs/executableTestPlans.md) for more details.


## Generating test data for tests

```
export TEST_DATA_PATH="$(pwd)/testData"
mkdir -p "$TEST_DATA_PATH"

export TEST_DICTIONARY=https://s3.amazonaws.com/dictionary-artifacts/datadictionary/develop/schema.json

docker run -it -v "${TEST_DATA_PATH}:/mnt/data" --rm --name=dsim --entrypoint=data-simulator quay.io/cdis/data-simulator:master simulate --url "${TEST_DICTIONARY}" --path /mnt/data --program jnkns --project jenkins --max_samples 10

docker run -it -v "${TEST_DATA_PATH}:/mnt/data" --rm --name=dsim --entrypoint=data-simulator quay.io/cdis/data-simulator:master submission_order --url "${TEST_DICTIONARY}" --path /mnt/data --node_name submitted_unaligned_reads

RUNNING_LOCAL=true NAMESPACE=reuben npm test -- --verbose --grep '@dataClientCLI|@reqGoogle' --invert suites/sheepdogAndPeregrine/submitAndQueryNodesTest.js
```

Note that the `--grep ... --invert ...` is necessary to disable
setup for "google" tests that require a custom test environment.

After running the test suite several times (or once) you may need to clear out the
databases in your dev environment, so that old data does not interfere with new test runs.  The [`gen3 reset`](https://github.com/uc-cdis/cloud-automation/blob/master/doc/reset.md) command automates the process to reset the `fence`, `indexd`, and `sheepdog` databases, but should only be run against a personal copy of the database (most of our dev environments point at a personal database schema). `gen3 reset` also deletes and recreates all deployments and secrets, so you will need to run usersync again too (`gen3 job run usersync`).

## Install data-client for data-upload tests

```
# change linux to osx on mac
ssh -t reuben@cdistest.csoc bash -c 'source ~/.bashrc; source cloud-automation/gen3/gen3setup.sh; gen3 aws s3 cp s3://cdis-dc-builds/master/dataclient_linux.zip dataclient.zip'
scp you@dev.csoc:dataclient.zip ~/dataclient.zip
(cd ~/ && unzip ~/dataclient.zip)
chmod a+rx ~/gen3-client
```

## Basic test writing

- a test suite goes in `suites/../test.js`
- `test.js` imports a tasks and a questions module
- basic test structure:
```
run some task
ask questions about whether the task result matches expectations
```

# Gen3 Automated Integration Test
This is the repository for managing integration tests used for Gen3 data commons.

Frameworks/Tools:
- CodeceptJS: primary testing framework ([docs](https://codecept.io/))
- Chai: additional assertion writing ([docs](http://www.chaijs.com/api/))
- Jenkins: CI, automated builds and tests

# Setup
## General Info
The testsuite is run either in Jenkins, when testing a build, or on a local machine, when developing tests. The setup is slightly different for each and is explained below.
### Environment Variables
Tests require access tokens, usernames, passwords, etc., which we store in environment variables.

The environment variable `NAMESPACE` must be defined in your shell running the tests. This variable defines the data commons to run the test on. Note that this variable must be a variable in your shell, not in your auto-qa-config file (explained below).

The process of fetching most of the commons variables is automated by the script set for `bootstrap` in the CodeceptJS configuration file.
If there are things which cannot/should not be fetched in the commons by the setup script, you can setup a JSON config file named `auto-qa-config.json` in a `.gen3` folder in your home directory, `~/.gen3/auto-qa-config.json`. For example:
```
# homeDirectory/.gen3/auto-qa-config.json
{
  SPECIAL_SECRET: '*******',
  MY_VAR: {
    myString: 'abcd123'
    myNum: 12
  }
}
```
In setup, these values will be read and exported to environment variables before running the test. So in the example above `MY_VAR` is actually going to be a string that will need to be parsed when it's used. Note that the setup gives environment variables higher priority over the config file. So if you did `export MY_VAL="rock"` in the shell you're running the test and in your config had `{ MY_VAL: "scissors" }`, when the test is run, `process.env.MY_VAL === "rock"`.

## Local
After cloning this repo, get the required packages by running `npm install`.

# Test Development
## Running Tests
Once you have your environment variables configured and the Selenium server is running, you should be able to successfully run the tests.

If you want to run `gen3-qa` against a dev environment, you just need to set the environment variable `NAMESPACE={dev env namespace}` and the `GOOGLE_APP_CREDS_JSON` to the credentials getting from Google
(`export GOOGLE_APP_CREDS_JSON="$(cat creds.json)"`), then run `./run-tests-local.sh`.

But as mentioned above, some tests have special requirements so you may not want to run them. Instead, you can run a selection of tests that have certain tag by altering the line in `run-tests-local.sh` file `npm test -- --grep "@MyTag"` (see info about tags in the Writing Tests section).

The special dev environment setup that is required by some tests is described [here](https://github.com/uc-cdis/cdis-wiki/blob/master/dev/gen3/guides/gen3qa-dev-env.md).

## Writing Tests

Each API or web page feature is contained in a singe .js file. They are stored in `suites/**` filenames matching the pattern `*Test.js`.

Refer to the [CodeceptJS docs](https://codecept.io/basics/) existing tests for info and writing patterns. TLDR for the basics:
- A `*Test.js` file tests a single `Feature`
- A `Feature` is a collection of `Scenario`s
- A `Scenario` is a single use case/flow of a feature (e.g. a flow with good input, a flow with bad input)

Here's what it looks like in code:
```js
// in myFeatureTest.js
Feature('MyFeature');

Scenario('use feature good input', () => {
  // do something with good input and expect success!
});

Scenario('use feature bad input', () => {
  // do something with bad input and expect some error!
});
```

`Scenario`s are where we actually do things and ask questions about the results. So what does the 'doing' and the 'asking'? That's the job of a `service`!

### Services
A `service` directly translates to a single gen3 API or web page (e.g. sheepdog API or dictionary web page). They allow you to perform actions and ask about the state of it's subject. Rather than making direct API calls or clicking around on a page within a test, we create a `service` to abstract away the details (e.g. specific endpoints, css locators for HTML elements, etc) for doing a task or making an assertion about state.

`service`s are located in the directories `service/api` and `service/portal`. To include a service in a `Scenario`, see [Using services in Scenarios](#using-services-in-scenarios) below.

#### Attributes
Services have the following attributes

| attribute | description | verb/accessor | example |
| --- | --- | --- | --- |
| props | collection of properties about the service/page (e.g. endpoints, or page element locators) | props | homepage.props.chart |
| tasks | performs a single action of the service/page | do | sheepdog.do.addNode(aliquotNode) |
| questions | makes assertions about the service/page | ask | homepage.ask.seeProp(homepage.props.chart)
| sequences | sequence of multiple tasks and questions | complete | sheepdog.complete.addNodes(allNodesList) |

##### task
A task is usually composed of calls to CodeceptJS's `actor()`, which is referenced as `I`. CodeceptJS's actor gives us easy access to things like navigating webpages and making REST API calls (e.g. `I.click('.my-button')` and `I.sendGetRequest('/user/user')`). Get familiar with the CodeceptJS helpers and their functions:
- [WebdriverIO](https://codecept.io/helpers/WebDriver/) (web page stuff)
- [REST](https://codecept.io/helpers/REST/) (API stuff)

##### question
A question is a method that makes an assertion. For web pages, they are usually written using CodeceptJS's `actor()` (e.g. `I.seeNumberOfElements('.header1', 2)`). For everything that we can't use CodeceptJS's actor for (API assertions) we use Chai. Checkout the Chai expect [documentation here](http://www.chaijs.com/api/bdd/).

##### props
A `service`'s props is just a collection of values that are used when performing tasks and asking questions. This would include:
- API endpoints
- Expected API results
- Web page URL
- Locators for HTML elements

##### sequence
A sequence is just a collection of tasks and questions. For example, if you had a series of tasks and questions you were repeating in your tests (e.g. submitting something then validating it was submitted successfully) you can just create a sequence to wrap this up into one call.

It's recommended that you only make assertions about state in questions, keep 'em out of any tasks. If you're tempted to write an assertion in a task, think about whether you are really doing a fundamental action of the service/page. Just write it into a sequence if you really need to do both a task and question.

#### Using `service`s in `Scenario`s
To use a service in a `Scenario`, insert it in the `Scenario` callback:
```js
// in file myTest.js
Feature('MyFeatureA')

// See codeceptjs docs for info on Before/BeforeSuite/After/AfterSuite
BeforeSuite((myService) => {
  myService.complete.someSetup();
});

Scenario('use feature with good input', (myService) => {
  const result = myService.do.someTask(goodInput);
  myService.ask.resultSuccess(result);
});

Scenario('use feature with bad input', (myService) => {
  const result = myService.do.someTask(badInput);
  myService.ask.resultHasError(result, 'invalid input!');
});
```

#### Creating a new `service`
To create a new service, use the command `npm create-service`.
A couple of files will be generated with the given service name in either `services/apis` or `services/portal` depending on the service type you select.
After running the command, you must add the service to the codecept.conf.js file for it to be accessible by `Scenario`s:
```js
// in codecept.conf.js
...
  include: {
    myService: "./services/apis/myService.js"
  }
...
```

#### Async tasks/questions
Most tasks are asynchronous, so asking questions about their state require a little async/await work. For most funcitons, you can return another funciton's promise and `await` for the promise to resolve in the Scenario. For example
```js
// myServiceTasks.js
module.exports = {
  async getSomething() {
    return I.sendGetRequest('/endpoint')
  }
}

// myServiceQuestions.js
module.exports = {
  hasNoErrors(response) {
    expect(response).to.not.have.property('error')
  }
}

// myTest.js
Scenario('my test', (actor) => {
  // we have to await here before continuing!
  const response = await actor.do.getSomething();
  actor.ask.hasNoErrors(response);
});
```

When creating new Promises, avoid using reject unless you are going to catch it yourself. If we end up calling the reject() it will throw an error into the "global promise chain" of CodeceptJS, and importantly the test will fail without any meaningful stacktrace about what went wrong. Instead, you could do resolve({ error: err_obj }), and in a question assert there is no error.

### Tags
Adding a tag (`@tag`) to a Scenario name allows filtering which tests are run. If your test is special for some reason (e.g. only applies to one commons) add a tag like so:
```
Scenario('test something @reqGoogle', () => {...});
```
Then using CodeceptJS's `--grep` flag we can filter the tags for example, to run only tests that have been flagged with `@DCFOnly`, we could do `npm test -- --grep '@DCFOnly'`. We can also invert the flags with `--grep '@DCFOnly' --invert` (see [CodeceptJS's command docs](https://codecept.io/commands/)).


### Conditionally Running Tests Based on Service Versions

Edit `run-tests.sh`.

_Example situation_: Fence only supports centralized auth after version `3.0.0`. In other words, we don't want to run the `@centralizedAuth` tag in envs that are *not* running at least fence `3.0.0`. You can make that explicit in the `run-tests.sh` file:

```
runTestsIfServiceVersion "@centralizedAuth" "fence" "3.0.0"
```

This will disable the `@centralizedAuth` tests on any pinned version of fence less than `3.0.0`.

> NOTE: Fence `master` and **any** branch *will* run the tests.

