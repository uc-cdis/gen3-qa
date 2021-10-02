/*
 Single Passport with single RAS Visas - positive and negative tests (PXP-8795)
 This test plan has a few pre-requisites:
 1. Fence > 4.22.3 must be deployed.
 2. There must be an upstream client previously registered with NIH/RAS and
    the test environment must have its client & secret ID stored into its Fence config.
    e.g., $ cat gen3_secrets_folder/configs/fence-config.yaml | yq .OPENID_CONNECT.ras
          {
              "client_id": "****",
              "client_secret": "****",
              "redirect_url": "{{BASE_URL}}/login/ras/callback"
          }
*/
Feature('DRS access with RAS passport');

const axios = require('axios');
const { expect } = require('chai');

BeforeSuite(async ({ I }) => {
  console.log('Setting up dependencies...');
  I.cache = {};
});

Scenario('Send DRS request with a single RAS ga4gh passport and confirm the access is authorized @RASJWT4DRS', async () => {
  const drsDataAccessReq = await axios({
    url: '/ga4gh/drs/v1/objects/dg.4DFC/046b37f6-2b5b-4460-9ec6-6b740ee92fc0/access/s3',
    baseURL: 'https://nci-crdc.datacommons.io',
    method: 'post',
    responseType: 'arraybuffer',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    data: {
      passports: ['eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsImtpZCI6ImRlZmF1bHRfc3NsX2tleSJ9.ew0KInN1YiI6Ikt5Y3NaLU8xRDF0SmxIZThxbGo4cFZ5UjRfMkNZbC1LeHZSY001clNRSDAiLA0KImp0aSI6ImM1MGM2NmExLTNhNWEtNDE2OS04NzZhLTE3MjEzNzY1OWE4MiIsDQoic2NvcGUiOiJlbWFpbCBwcm9maWxlIGdhNGdoX3Bhc3Nwb3J0X3YxIG9wZW5pZCIsDQoidHhuIjoieHZGajByQzBKQ2s9LjU0MWI2N2FkM2NkZmEyODMiLA0KImlzcyI6ICJodHRwczovL3N0c3N0Zy5uaWguZ292IiwgCiJpYXQiOiAxNjA4NzQ1OTgzLAoiZXhwIjogMTYwODc4OTE4MywKImdhNGdoX3Bhc3Nwb3J0X3YxIiA6IFsKICAgImV3MEtJQ0FpZEhsd0lqb2dJa3BYVkNJc0RRb2dJQ0poYkdjaU9pQWlVbE15TlRZaUxBMEtJQ0FpYTJsa0lqb2dJbVJsWm1GMWJIUmZjM05zWDJ0bGVTSU5DbjAuZXcwS0lDQWlhWE56SWpvZ0ltaDBkSEJ6T2k4dmMzUnpjM1JuTG01cGFDNW5iM1lpTEEwS0lDQWljM1ZpSWpvZ0lrdDVZM05hTFU4eFJERjBTbXhJWlRoeGJHbzRjRlo1VWpSZk1rTlpiQzFMZUhaU1kwMDFjbE5SU0RBaUxDQU5DaUFnSW1saGRDSTZJREUyTURnM05EVTVPRE1zRFFvZ0lDSmxlSEFpT2lBeE5qQTROemc1TVRnekxBMEtJQ0FpYzJOdmNHVWlPaUFpWlcxaGFXd2djSEp2Wm1sc1pTQm5ZVFJuYUY5d1lYTnpjRzl5ZEY5Mk1TQnZjR1Z1YVdRaUxBMEtJQ0FpYW5ScElqb2dJalkwT1RFM016UTFMVFpoTWpVdE5HUXhaUzA1WWpNekxXSTJNamMwWVRBeE56VmtOaUlzRFFvZ0lDSjBlRzRpT2lBaWVIWkdhakJ5UXpCS1EyczlMalUwTVdJMk4yRmtNMk5rWm1FeU9ETWlMQTBLSUNBaVoyRTBaMmhmZG1sellWOTJNU0k2SUhzZ0RRb2dJQ0FnSUNKMGVYQmxJam9nSW1oMGRIQnpPaTh2Y21GekxtNXBhQzVuYjNZdmRtbHpZWE12ZGpFdU1TSXNJQTBLSUNBZ0lDQWlZWE56WlhKMFpXUWlPaUF4TmpBNE56UTFPVGd6TEEwS0lDQWdJQ0FpZG1Gc2RXVWlPaUFpYUhSMGNITTZMeTl6ZEhOemRHY3VibWxvTG1kdmRpOXdZWE56Y0c5eWRDOWtZbWRoY0M5Mk1TNHhJaXdOQ2lBZ0lDQWdJbk52ZFhKalpTSTZJQ0pvZEhSd2N6b3ZMMjVqWW1rdWJteHRMbTVwYUM1bmIzWXZaMkZ3SWl3TkNpQWdJQ0FnSW1KNUlqb2dJbVJoWXlKOUxBMEtJQ0FnSUNBaWNtRnpYMlJpWjJGd1gzQmxjbTFwYzNOcGIyNXpJam9nV3cwS0lDQWdJQ0FnSUNBZ0RRcDdEUW9pWTI5dWMyVnVkRjl1WVcxbElqb2dJa2RsYm1WeVlXd2dVbVZ6WldGeVkyZ2dWWE5sSWl3SkRRb2ljR2h6WDJsa0lqb2dJbkJvY3pBd01EQXlNU0lzRFFvaWRtVnljMmx2YmlJNklDSjJNeUlzRFFvaWNHRnlkR2xqYVhCaGJuUmZjMlYwSWpvZ0luQXlJaXdKQ1EwS0ltTnZibk5sYm5SZlozSnZkWEFpT2lBaVl6RWlMQTBLSW5KdmJHVWlPaUFpY0draUxBMEtJbVY0Y0dseVlYUnBiMjRpT2lBaU1qQXlNQzB4TVMweE5DQXdNRG93TURvd01DSU5DbjBOQ2lBZ0lDQWdYU0FOQ24wLlhRYW9qVUgwSnVReWlwcVVpY0RnWTVrQk9aOVNjMHludzJORE9DUU1HUmNVSkI2Nml2bldXd0daajhYM0tjcjhnZHJ2RVlSV1RyazdyaGkzcmVudDE0aG10US1GZmd2c2hfZDFIWE5QRDJPbnZRRWVlZGJKS0dQYm1LbWxWVVBhTFU0TlhoMXIwZkZmMWpUdzB5bW1GbFFuYXM5cm5uSmVjSVc1RGNxYWNZS0xQUGhUOFhiMlpzT1ItcFE2MloySXZ6ai00Xy1wWUVzdlhXRDNNRU1QYlhDMHl2YloxZXVvZnlCN0Ryam5JQTQ5c2cwQjhUUU4wdm9SNGVrTVdWdldMeFJzeDlhaTBXdnZ0V3Q4MV8yQW8tcl9LbFhSYy03NHhzdWxiOFh6VTJTWm9peFgwX3VEYnVfaXMtVUR4d0pjTUlZQXBLVEYzU1J4dG9fR2VEbE9nUSIKXQ0KfQ.l5nm3QFJuWRKTtLC79J07tPBpTpADM_24oj8OJwZfms_YL_alFxhW082RbdthodXUCoqThX0OABj0ypOGNenc9-dsIDoJUkpmkHbs7YvQ0P4fqw03NCgCptnZW5A_mzVSkRK17yDhE_oWdFfLAFFWYV1-O2X3ffAjp3tL4aWHpothnk8mlhxfLbaXuD2lSgYy-Z-n1n-n5UscFnhczTrqnQ35rNsy4UxaQfK-rMYoimqT37iuf5Inr-fH_34zJt4pAK7VxSbhDChZ3uQdO8WFPNbdGglv1FCN-sjf5hHZwpy_GmsFII_q6i9eYDBgwvxGOGG-UUX60TGX1SPPKZ1dg'],
    },
  });
  expect(
    drsDataAccessReq,
    'Should perform seamless AuthN and AuthZ with GA4GH RAS passport',
  ).to.have.property('status', 200);
  console.log(`### ## drsDataAccessReq.data: ${drsDataAccessReq.data}`);
  // expect(accessTokenJson.scope).to.include('ga4gh_passport_v1');
});
