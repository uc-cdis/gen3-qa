/* eslint-disable no-mixed-operators */
/* eslint-disable no-bitwise */
/* eslint-disable one-var */
const {
    check,
    group,
    sleep,
  //  fail
  } = require('k6'); // eslint-disable-line import/no-unresolved
  const http = require('k6/http'); // eslint-disable-line import/no-unresolved
  const { Rate } = require('k6/metrics'); // eslint-disable-line import/no-unresolved
  
  // declare mutable ACCESS_TOKEN
  let { ACCESS_TOKEN } = __ENV; // eslint-disable-line no-undef
  
  const {
    GEN3_HOST,
    API_KEY,
    VIRTUAL_USERS,
  } = __ENV; // eslint-disable-line no-undef
  
  const myFailRate = new Rate('failed requests');
  
  export const options = {
    stages: JSON.parse(VIRTUAL_USERS.slice(1, -1)),
    thresholds: {
      http_req_duration: ['avg<1000', 'p(95)<2000'],
      'failed requests': ['rate<0.05'],
    },
    noConnectionReuse: true,
  };
  
  export default function () {
    const apiKey = API_KEY.slice(1, -1);
    const accessToken = ACCESS_TOKEN;
  
    function uuidv4() {
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
      });
    }
  
    const baseUrl = `https://${GEN3_HOST}/${mdsEndpoint}/metadata`;
    const params = {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
    };
    const body = {
      acl: ['QA'],
      authz: [],
      did: uuidv4(),
      file_name: 'qa-test.txt',
      form: 'object',
      hashes: {
        md5: '404e8919021a03285697647487f528ef', //pragma: allowlist secret
      },
      size: 2681688756,
      urls: ['gs://dcf-integration-qa/qa-test.txt', 's3://cdis-presigned-url-test/testdata'],
    };
    const strBody = JSON.stringify(body);
    const url1 = `${baseUrl}/index/`;
  
  
  
    group('Creating and deleting mds records', () => {
        group('create record', () => {
            console.log(`sending POST req to: ${baseUrl}`);
            const res = http.post(url1, strBody, params, { tags: { name: 'mds-record-creation' } });
        
            if (res.status === 401) {
                console.log('renewing access token!!!');
                console.log(`Request response: ${res.status}`);
                console.log(`Request response: ${res.body}`);
        
                const tokenRenewalUrl = `https://${GEN3_HOST}/user/credentials/cdis/access_token`;
        
                const tokenRenewalParams = {
                headers: {
                    'Content-Type': 'application/json',
                    accept: 'application/json',
                },
                };
                const tokenRenewalData = JSON.stringify({
                api_key: apiKey,
                });
                const renewalRes = http.post(tokenRenewalUrl, tokenRenewalData, tokenRenewalParams, { tags: { name: 'renewingToken1' } });
                ACCESS_TOKEN = JSON.parse(renewalRes.body).access_token;
        
                console.log(`NEW ACCESS TOKEN!: ${ACCESS_TOKEN}`);
            } else {
                console.log(`Request response: ${res.status}`);
                myFailRate.add(res.status !== 201);
                if (res.status !== 201) {
                console.log(`Request response: ${res.status}`);
                console.log(`Request response: ${res.body}`);
                }
                check(res, {
                'is status 201': (r) => r.status === 201,
                });
            }
            group('wait 0.3s between requests', () => {
                sleep(0.3);
            });
        });
        

        group('delete record', () => {
            console.log(`sending DELETE req to: ${url1}`);
            const res = http.request('DELETE', url1, {}, params, { tags: { name: 'mds-record-deletion' } });

            if (res.status === 401) {
                console.log('renewing access token!!!');
                console.log(`Request response: ${res.status}`);
                console.log(`Request response: ${res.body}`);
        
                const tokenRenewalUrl = `https://${GEN3_HOST}/user/credentials/cdis/access_token`;
        
                const tokenRenewalParams = {
                headers: {
                    'Content-Type': 'application/json',
                    accept: 'application/json',
                },
                };
                const tokenRenewalData = JSON.stringify({
                api_key: apiKey,
                });
                const renewalRes = http.post(tokenRenewalUrl, tokenRenewalData, tokenRenewalParams, { tags: { name: 'renewingToken1' } });
                ACCESS_TOKEN = JSON.parse(renewalRes.body).access_token;
        
                console.log(`NEW ACCESS TOKEN!: ${ACCESS_TOKEN}`);
            } else {
                myFailRate.add(res.status !== 200);
                if (res.status !== 200) {
                console.log(`Request response: ${res.status}`);
                console.log(`Request response: ${res.body}`);
                }
                check(res, {
                'is status 200': (r) => r.status === 200,
                });
            }
            group('wait 0.3s between requests', () => {
                sleep(0.3);
            });
        });
    });
  }
  

  