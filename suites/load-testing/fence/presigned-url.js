import { check } from "k6";
import http from "k6/http";

const host = "qa-brain.planx-pla.net";
const guid = "00037250-f2e5-47e2-863c-5f225c7f79e8";
const token = open('../token.txt', 'utf8').trim();

export let options = {
    stages: [
        { duration: "15s", target: 50 },
        { duration: "30s", target: 50 },
        { duration: "15s", target: 0 },
    ],
    thresholds: {
        http_req_duration: ["avg<100", "p(95)<200"]
    },
    noConnectionReuse: true,
};

export default function () {
    var url = `https://${host}/user/data/download/${guid}?protocol=s3`;
    var params = {
        headers: {
            "Content-Type": "application/json",
            "authorization": `Bearer ${token}`,
        }
    }
    let res = http.get(url, params);
    check(res, {
        "is status 200": (r) => r.status === 200
    });
};
