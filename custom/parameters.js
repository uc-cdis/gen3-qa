const codecept = {
  "output": "./output",
  "helpers": {
    "WebDriverIO": {
      "url": `https://${process.env.HOSTNAME}`,
        "smartWait": 5000,
        "browser": "chrome",
        "desiredCapabilities": {
        "chromeOptions": {
          "args": [ "--headless", "--disable-gpu", "--window-size=1280,720" ]
        }
      },
      "restart": false,
        "timeouts": {
        "script": 6000,
          "page load": 10000
      }
    },
    "REST": {
      "endpoint": `https://${process.env.HOSTNAME}`,
        "defaultHeaders": ""
    },
    "CDISHelper": {
      "require": "./cdisHelper.js"
    }
  },
  "include": {
    "I": "./stepsFile.js"
  },
  "mocha": {
    "reporterOptions": {
      "mochaFile": "output/result.xml"
    }
  },
  "bootstrap": false,
  "teardown": null,
  "hooks": [],
  "tests": "suites/*/*Test.js",
  "timeout": 10000,
  "name": "selenium"
};

module.exports = {
  codecept,
};
