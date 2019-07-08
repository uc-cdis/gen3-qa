const request = require('request');
const { Env } = require('./utils/env');

Env.setupEnvVariables();

// Set hostname according to namespace
exports.config = {
  output: './output',
  helpers: {
    WebDriverIO: {
      url: `https://${process.env.HOSTNAME}`,
      smartWait: 5000,
      browser: 'chrome',
      desiredCapabilities: {
        chromeOptions: {
          args: [
            '--headless', // for dev, you can comment this line to open actual chrome for easier test
            '--disable-gpu',
            '--window-size=1920,1080'
          ],
        },
      },
      restart: false,
      timeouts: {
        script: 6000,
        'page load': 10000,
      },
      port: 4444,
    },
    REST: {
      endpoint: `https://${process.env.HOSTNAME}`,
      timeout: 60000,
      defaultHeaders: '',
    },
    CDISHelper: {
      require: './helpers/cdisHelper.js',
    },
  },
  include: {
    // General Utils
    nodes: './utils/nodes.js',
    users: './utils/user.js',
    google: './utils/google.js',
    files: './utils/file.js',
    dataUpload: './utils/dataUpload.js',

    // APIs
    sheepdog: './services/apis/sheepdog/sheepdogService.js',
    indexd: './services/apis/indexd/indexdService.js',
    peregrine: './services/apis/peregrine/peregrineService.js',
    pidgin: './services/apis/pidgin/pidginService.js',
    fence: './services/apis/fence/fenceService.js',
    dataClient: './services/apis/dataClient/dataClientService.js',
    etl: './services/apis/etl/etlService.js',
    guppy: './services/apis/guppy/guppyService.js',

    // Pages
    home: './services/portal/home/homeService.js',
    pelican: './services/portal/pelican/pelicanService.js',
    portalDataUpload: './services/portal/dataUpload/dataUploadService.js',
  },
  mocha: {
    reporterOptions: {
      'codeceptjs-cli-reporter': {
        stdout: '-',
        options: {
          verbose: true,
          steps: true,
        }
      },
      'mocha-junit-reporter': {
        stdout: 'output/result[hash].xml',
        options: {
          mochaFile: 'output/result[hash].xml',
          verbose: true,
          steps: true,
        }
      }
    },
  },
  bootstrap: './test_setup.js',
  teardown() {
    // session id is a global var retrieved in the helper
    if ( typeof seleniumSessionId !== 'undefined' && seleniumSessionId ) {
      console.log(`Killing Selenium session ${seleniumSessionId}`);
      request.del(`http://localhost:4444/wd/hub/session/${seleniumSessionId}`);
    }
  },
  hooks: [],
  tests: './suites/*/*.js',
  timeout: 60000,
  name: 'selenium',
};
