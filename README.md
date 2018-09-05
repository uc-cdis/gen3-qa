# Gen3 Automated Integration Test
This is the repository for managing integration tests used for Gen3 data commons. 

Frameworks/Tools:
- CodeceptJS: primary testing framework ([docs](https://codecept.io/))
- Chai: additional assertion writing ([docs](http://www.chaijs.com/api/))
- Jenkins: CI, automated builds and tests 

# Setup
## General Info
The testsuite is is run either in Jenkins, when testing a build, or on a local machine, when developing tests. The setup is slightly different for each and is explained below.
### Environent Variables
Tests require access tokens, usernames, passwords, etc., which we store in environment variables. The process of fetching these variables is automated by the script set for `bootstrap` in the CodeceptJS configuration file.

TODO: Document difference in running tests locally and running in Jenkins, and as a result the difference in setup requirements (environment variables, .gen3/auto-qa-config.json, etc).
## Local
After cloning this repo, get the required packages by running `npm install`.
### Selenium
To automate web browser actions, CodeceptJS requires a Selenium webserver. You have two options here: Docker or npm. Note that for both methods, you can visit `localhost:4444/wd/hub/sessions` to see current Selenium session/check that the server is running.
#### Docker ([link](https://github.com/SeleniumHQ/docker-selenium))
If you have docker, you can just run the preconfigured container
```
docker run -d -p 4444:4444 -v /dev/shm:/dev/shm selenium/standalone-chrome
```
To kill the server just kill the container.
#### npm ([link](https://www.npmjs.com/package/selenium-standalone))
If you'd rather not fool with docker, you can run the server yourself with an npm package. 
If you already ran `npm install`, the package selenium-standalone should have been installed. You'll also need to install the webdriver, just run `npm run selenium-install`.

You'll need the Java SDK, version 8, to use Selenium so make sure you have that installed as well (`javac -version`, e.g. javac 1.8.0_171 means I have version 8.0_171)

Once this is done, you can run `npm run selenium-start`, and the server will start running on port 4444 by default.

You can kill the server with `npm run selenium-kill`

### Data _(optional)_
Some tests need data to submit, so this step is required only if you plan on running/writing tests that submit, delete, or query graph data (aka nodes). If your test doesn't need this stuff, just skip this step.
_WIP_ Currently you have to clone the occ/data-simulator repo, install R, install the required packages, and manually run the command for generating simulated data. This is to be automated soon. Please just ask for help until this is resolved.

# Test Development
## Running Tests
Once everything is setup and your Selenium server is running, you should be able to successfully run the tests. Try running the following
```
npm test
```
If all the tests start running (and passing), everything should be good to go for you to start writing your own tests. 
Note that you can also run a selection of tests with `@Tags` (explained below) by running the following:
```
npm test -- --grep "@MyTag"
```

## Writing Tests
Tests are single .js files that test a group of closely related features. They are stored in `suites/apis` and `suites/portal`, with filenames matching the pattern `*Test.js`.

Refer to the [CodeceptJS docs](https://codecept.io/basics/) and tests already written for how to write them.

### Actors
An actor is basically a helper for a specific service or web page for use in a test (e.g. sheepdog actor or dictionary page actor). Actors allow you to perform actions and ask about the state of it's subject. Rather than making direct API calls or clicking around on a page within a test, we use actors to abstract away the specifics.

#### Attributes
Actors have the following attributes

| attribute | description | verb/accessor | example |
| --- | --- | --- | --- |
| props | collection of properties about the service/page (e.g. endpoints, or page element locators) | props | homepage.props.chart |
| tasks | performs a single action of the service/page | do | sheepdog.do.addNode(aliquot_node) |
| questions | makes assertions about the service/page | ask | homepage.ask.seeProp(homepage.props.chart)
| sequences | sequence of multiple tasks and questions | complete | sheepdog.complete.addNodes(all_nodes_list) |

It's recommended that you only make assertions about state in `questions`, keep 'em out of any `tasks`. If you're tempted to write an assertion in a `task`, think about whether you are really doing a fundamental action of the service/page.
There are exceptions of course, one being loading a web page; when asking a page to load, you want to make sure it's loaded before you continue.

`tasks` are usually composed of calls to CodeceptJS's actor(), which is referenced as `I`. CodeceptJS's actor gives us easy access to things like navigating webpages and making REST API calls (e.g. `I.click('.my-button')` and `I.sendGetRequest('/user/user')`). Get familiar with the helpers and their functions ([WebdriverIO](https://codecept.io/helpers/WebDriverIO/), [REST](https://codecept.io/helpers/REST/)) .

`questions` for web pages are usually also written using CodeceptJS's actor() (e.g. `I.seeNumberOfElements('.header1', 2)`). For everything that we can't use CodeceptJS's actor for (usually API assertions) we use Chai. Checkout the Chai expect [documentation here](http://www.chaijs.com/api/bdd/).

#### Using actors in tests
To use an actor in a test, insert it in the `Scenario` callback
```js
Scenario('submit and delete node'), (sheepdog) => {
  let node = { ... node data structure ... };
  await sheepdog.do.addNode(node); // appends request result to node object
  sheepdog.ask.addNodeSuccess(node); // check the node add_res
})
```

#### Creating new actors
To create a new actor, use the command `npm create-actor`.
A couple of files will be generated with the given actor name in the directory according to the actor type (api/portal).
After running the command, you must add the actor to the codecept.conf.js file for it to be accessible by Scenarios:
```js
// codecept.conf.js
...
  include: {
    myactor: "./path/to/myactor.js"
  }
...

// myTest.js
Scenario('test 123', (myactor) => {...})
```

#### Async tasks/questions
Most `tasks` are asynchronous, so asking `questions` about their state require a little async/await work. For most funcitons, you can return another funciton's promise and `await` for the promise to resolve in the Scenario. For example
```js
// actor_tasks.js
module.exports = {
  async getSomething() {
    return I.sendGetRequest('/endpoint')
  }
}

// actor_questions.js
module.exports = {
  hasNoErrors(something) {
    expect(something).to.not.have.property('error')
  }
}

// myTest.js
Scenario('my test', (actor) => {
  const result = await actor.do.getSomething();
  actor.ask.hasNoErrors(result);
});
```

When creating new Promises, avoid using reject unless you are going to catch it yourself. If we end up calling the reject() it will throw an error into the "global promise chain" of CodeceptJS, and importantly the test will fail without any meaningful stacktrace about what went wrong. Instead, you could do resolve({ error: err_obj }), and in a question assert there is no error.

### Tags
Adding a tag (`@Tag`) to a Scenario name allows filtering which tests are run. If your test is special for some reason (e.g. only applies to one commons) add a tag like so:
```
Scenario('test something @ImSpecial', () => {...});
```
Then using CodeceptJS's `--grep` flag we can filter the tags for example, to run only tests that have been flagged with `@DCF`, we could do `npm test -- --grep '@DCFOnly'`. We can also invert the flags with `--grep '@DCFOnly' --invert` (see [CodeceptJS's command docs](https://codecept.io/commands/)).
