# Generating and publishing Allure reports to share executable test results

## Generating reports locally

Thanks to PR [#190](https://github.com/uc-cdis/gen3-qa/pull/190), the Allure plugin is already enabled in `codecept.conf.js` and the `package.json` contains an alias that augments the `npm test` command to run `codeceptjs run --plugins allure`. Therefore, whenever any test is executed, a new `<guid>-testsuite.xml` file is created inside the `output` folder.

### Local preview of reports

The following command can be used to visualize the test results in the Allure web server:
`allure serve output`

This will open a new browser window/tab with the Allure interface. This can be useful to preview the test results before they are ready for publishing.

### Generating Static Website for Allure reports

The `allure generate <folder>` command is the one that generates the actual artifacts that will be published. It will create a folder called `allure-report` containing all the static web resources that assemble the Allure reporting interface and the `data/test-cases/*.json` files.

e.g.:
```
% allure generate output
Report successfully generated to allure-report
% ls allure-report
app.js      data        export      favicon.ico history     index.html  plugins     styles.css  widgets
```

## Publishing reports through the Dashboard service

Test reports are published through a `cloud-automation` tool called `dashboard`, which allows users to upload static assets to an AWS S3 bucket and make web pages available through one of the Gen3 Commons instances' domains. [Here](https://github.com/uc-cdis/cloud-automation/blob/master/doc/dashboard.md) is the full documentation on it.

The environment of choice that will host all reports is the "" instance.

In order to publish the reports to the QA dashboard, the static files generated in the previous section must be copied to the Dev VM and then deployed as a new web page through the following command (this must be executed from the DEV VM, logged in as `qaplanetv1`

`gen3 dashboard publish secure ./allure-report <name_of_your_choice>`
e.g.,
`gen3 dashboard publish secure ./allure-report QA/2019/12/pre-release-tests-for-A`

Once that is executed, the Allure Web GUI containing all the test results can be visualized in an address such as:
https://qa.planx-pla.net/dashboard/Secure/QA/2019/11/pre-release-tests-for-A/index.html

Only authorized users with the `dashboard` capability declared in their environment-specific `users.yaml` will be allowed to access this page.

## Automated test reports publishing

The `` script was developed to 
