const { Env } = require('./utils/env');

Env.setupEnvVariables();

// Set hostname according to namespace
exports.config = {
  output: './output',
  helpers: {
    WebDriver: {
      url: `https://${process.env.NAMESPACE}.planx-pla.net${process.env.PORTAL_SUFFIX}/`,
      smartWait: 30000,
      browser: 'chrome',
      // fullPageScreenshots: true,
      disableScreenshots: true,
      desiredCapabilities: {
        chromeOptions: {
          args: [
            '--headless', // for dev, you can comment this line to open actual chrome for easier test
            '--disable-gpu', // https://stackoverflow.com/questions/51959986/how-to-solve-selenium-chromedriver-timed-out-receiving-message-from-renderer-exc
            '--whitelisted-ips=*',
            '--disable-features=VizDisplayCompositor', // https://stackoverflow.com/a/55371396/491553
            '--window-size=1280,720',
            '--no-sandbox',
            // '--enable-features=NetworkService,NetworkServiceInProcess',
            '--disable-infobars', // https://stackoverflow.com/a/43840128/1689770
            '--disable-dev-shm-usage', // https://stackoverflow.com/a/50725918/1689770
            '--disable-browser-side-navigation', // https://stackoverflow.com/a/49123152/1689770
          ],
        },
      },
      restart: true, // restart browser for every test
      timeouts: {
        script: 6000,
        // 'page load': 10000,
      },
      port: 4444,
    },
    REST: {
      endpoint: `https://${process.env.HOSTNAME}`,
      timeout: 300000,
      defaultHeaders: {
        common: {
          Accept: 'application/json',
        },
        get: {},
        head: {},
        delete: {},
        post: { 'Content-Type': 'application/json' },
        patch: { 'Content-Type': 'application/json' },
        put: { 'Content-Type': 'application/json' },
      },
    },
    CDISHelper: {
      require: './helpers/cdisHelper.js',
    },
    browserLogHelper: {
      require: './helpers/browserLogHelper.js',
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
    drs: './services/apis/drs/drsService.js',
    peregrine: './services/apis/peregrine/peregrineService.js',
    pidgin: './services/apis/pidgin/pidginService.js',
    fence: './services/apis/fence/fenceService.js',
    dataClient: './services/apis/dataClient/dataClientService.js',
    etl: './services/apis/etl/etlService.js',
    manifestService: './services/apis/manifestService/manifestServiceService.js',
    guppy: './services/apis/guppy/guppyService.js',
    mds: './services/apis/mds/mdsService.js',
    auditService: './services/apis/auditService/auditService.js',

    // Pages
    home: './services/portal/home/homeService.js',
    gwas: './services/portal/GWASpp/GWASppService.js',
    indexing: './services/portal/indexing/indexingService.js',
    login: './services/portal/login/loginService.js',
    explorer: './services/portal/explorer/explorerService.js',
    portalDataUpload: './services/portal/dataUpload/dataUploadService.js',
    portalExportToWorkspace: './services/portal/exportToWorkspace/exportToWorkspaceService.js',
    portalCoreMetadataPage: './services/portal/coreMetadataPage/coreMetadataPageService.js',
    discovery: './services/portal/discovery/discoveryService.js',
    workspace: './services/portal/workspace/workspaceService.js',
    gen3ffLandingPage: './services/portal/gen3ffLandingPage/gen3ffLandingPageService.js',
  },
  mocha: {
    reporterOptions: {
      'codeceptjs-cli-reporter': {
        stdout: '-',
        options: {
          verbose: true,
          steps: true,
        },
      },
      'mocha-junit-reporter': {
        stdout: 'output/result[hash].xml',
        options: {
          mochaFile: 'output/result[hash].xml',
          verbose: true,
          steps: true,
        },
      },
    },
  },
  bootstrap: require('./test_setup.js'), // eslint-disable-line global-require
  hooks: [
    require('./hooks/test_results.js'), // eslint-disable-line global-require
    require('./hooks/test_conditions.js'), // eslint-disable-line global-require
  ],
  tests: './suites/**/*.js',
  gherkin: {
    features: './suites/bdd/**/*.feature',
    steps: './suites/bdd/**/*.js',
  },
  plugins: {
    allure: {},
    tryTo: {
      enabled: true,
    },
    screenshotOnFail: {
      enabled: true,
      uniqueScreenshotNames: true,
      fullPageScreenshots: true,
    },
  },
  timeout: 900, // in seconds (15 min)
  name: 'selenium',
};
