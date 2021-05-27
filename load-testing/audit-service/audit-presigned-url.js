const { check, group, sleep } = require('k6'); // eslint-disable-line import/no-unresolved
const http = require('k6/http'); // eslint-disable-line import/no-unresolved
const { Rate } = require('k6/metrics'); // eslint-disable-line import/no-unresolved

const {
    ACCESS_TOKEN,
    GEN3_HOST,
    VIRTUAL_USERS,
} = __ENV; // eslint-disable-line no-undef

const myFailRate = new Rate('failed requests');

export const options = {
    stages : JSON.parse(VIRTUAL_USERS.slice(1, -1)),
    thresholds : {
        http_req_duration: ['avg<1000', 'p(95)<2000'],
        'failed requests': ['rate<0.05'],
    },
    noConnectionReuse: true,
};

export default function () {
    // the url to post the logs to
    const auditURL = `https://${GEN3_HOST}/audit/log/presigned-url`;
    // authentication for request a POST
    const params = {
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${ACCESS_TOKEN}`,
        },
    };
    // POST body
    const schema = {
        "action": "download",
        "guid": "dg.fake/b01ebf46-3832-4a75-8736-b09e8d9fd952",
        "request_url": "/data/download/dg.fake/b01ebf46-3832-4a75-8736-b09e8d9fd952",
        "resource_path": [ "/my/resource/path1", "/path2" ],
        "status_code": 200,
        "sub": 10,
        "username": "user_91"
    };
    const body = JSON.stringify(schema);

    group('posting Presigned URLs Logs', () => {
        group('http post', () => {
           console.log(`posting presigned url to: ${url}`);
           const res = http.post(auditURL, body, params, {tags: { name: 'presignedURL'} });
           myFailRate.add(res.status !== 201);
           if (res.status !== 201) {
               console.log(`Request response Status: ${res.status}`);
               console.log(`Request response Body: ${res.body}`);
           }
           check(res, {
               'is status 201': (r) =>r.status === 201,
           });
        });
        group('wait 0.3s between requests', ()=>{
            sleep(0.3);
        })
    });

    group('getting presigned url logs', () => {
       group('http get', () => {
           console.log(`Getting logs ${auditURL}`)
           const res =  http.get(auditURL, params);
           myFailRate.add(res.status !== 200);
           if (res.status !== 200) {
               console.log(`${res.status}`);
               console.log(`${res.body}`);
           }
           check(res,{
               'is status 200': (r) => r.status === 200,
           });
       });
    });
}
