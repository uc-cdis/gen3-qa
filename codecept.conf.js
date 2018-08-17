let request = require('request');

exports.config = {
  output: "./output",
  helpers: {
    WebDriverIO: {
      url: `https://${process.env.HOSTNAME}`,
      smartWait: 5000,
      browser: "chrome",
      desiredCapabilities: {
        chromeOptions: {
          args: [
            "--headless",
            "--disable-gpu",
            "--window-size=800,600"
          ]
        }
      },
      restart: false,
      timeouts: {
        "script": 6000,
        "page load": 10000
      },
      port: 4444
    },
    REST: {
      "endpoint": `https://${process.env.HOSTNAME}`,
      "defaultHeaders": ""
    },
    CDISHelper: {
      require: "./cdisHelper.js"
    }
  },
  include: {
    I: "./stepsFile.js"
  },
  mocha: {
    reporterOptions: {
      mochaFile: "output/result.xml"
    }
  },
  bootstrap: false,
  teardown: function(done) {
    // session id is a global var retrieved in the helper
    console.log(`Killing Selenium session ${seleniumSessionId}`);
    request.del(`http://localhost:4444/wd/hub/session/${seleniumSessionId}`);
  },
  hooks: [],
  tests: "suites/*/*Test.js",
  timeout: 10000,
  name: "selenium"
};