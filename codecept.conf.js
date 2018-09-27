const request = require('request');

// Set hostname according to namespace
let subdomain = process.env.NAMESPACE;
if (subdomain === '' || subdomain === undefined) {
  throw Error('NAMESPACE environment variable must be set.');
}
if (subdomain === 'default') {
  subdomain = 'qa';
}
process.env.HOSTNAME = `${subdomain}.planx-pla.net`;
console.log(`NAMESPACE: ${process.env.NAMESPACE}`);
console.log(`HOSTNAME: ${process.env.HOSTNAME}`);

exports.config = {
  output: './output',
  helpers: {
    WebDriverIO: {
      url: `https://${process.env.HOSTNAME}`,
      smartWait: 5000,
      browser: 'chrome',
      desiredCapabilities: {
        chromeOptions: {
          args: ['--headless', '--disable-gpu', '--window-size=1000,900'],
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
      defaultHeaders: '',
    },
    CDISHelper: {
      require: './helpers/cdisHelper.js',
    },
  },
  include: {
    // General Utils
    commons: './utils/commonsUtil.js',
    nodes: './utils/nodesUtil.js',
    users: './utils/usersUtil.js',
    google: './utils/googleUtil.js',

    // APIs
    sheepdog: './services/apis/sheepdog/sheepdogService.js',
    indexd: './services/apis/indexd/indexdService.js',
    peregrine: './services/apis/peregrine/peregrineService.js',
    fence: './services/apis/fence/fenceService.js',

    // Pages
    home: './services/portal/home/homeService.js',
  },
  mocha: {
    reporterOptions: {
      mochaFile: 'output/result.xml',
    },
  },
  bootstrap: './test_setup.js',
  teardown() {
    // session id is a global var retrieved in the helper
    console.log(`Killing Selenium session ${seleniumSessionId}`);
    request.del(`http://localhost:4444/wd/hub/session/${seleniumSessionId}`);
  },
  hooks: [],
  tests: './suites/*/*.js',
  timeout: 10000,
  name: 'selenium',
};
