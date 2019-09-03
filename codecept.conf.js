const request = require('request');
const { Env } = require('./utils/env');

Env.setupEnvVariables();

// Set hostname according to namespace
exports.config = {
  output: './output',
  helpers: {
    WebDriver: {
      url: `https://${process.env.HOSTNAME}`,
      smartWait: 5000,
      browser: 'chrome',
      fullPageScreenshots: true,
      desiredCapabilities: {
        chromeOptions: {
          args: [
            '--headless', // for dev, you can comment this line to open actual chrome for easier test
            '--disable-gpu',
            '--window-size=1920,1080',
          ],
        },
      },
      restart: true, // restart browser for every test
      timeouts: {
        script: 6000,
        'page load': 10000,
      },
      port: 4444,
    },
    REST: {
      endpoint: `https://${process.env.HOSTNAME}`,
      timeout: 60000,
      defaultHeaders: {
        common: {
          'Accept': 'application/json',
        },
        get: {},
        head: {},
        delete: {},
        post: {'Content-Type': 'application/json'},
        patch: {'Content-Type': 'application/json'},
        put: {'Content-Type': 'application/json'},
      },
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
    manifestService: './services/apis/manifestService/manifestServiceService.js',
    guppy: './services/apis/guppy/guppyService.js',

    // Pages
    home: './services/portal/home/homeService.js',
    portalDataUpload: './services/portal/dataUpload/dataUploadService.js',
    portalExportToWorkspace: './services/portal/exportToWorkspace/exportToWorkspaceService.js',
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
  hooks: [],
  tests: './suites/*/*.js',
  timeout: 60000,
  name: 'selenium',
};
