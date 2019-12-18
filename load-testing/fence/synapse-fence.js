import { check } from "k6";
import http from "k6/http";

export let options = {
    // //under what conditions a test is considered as successful or not based on maetric data 
    thresholds : {
        http_req_duration: ["avg<250"]
    },
    // //max no of simultaneous/parallel connections total 
    batch : 15,
    // //no of virtual users
    vus : 1000,
    // //fixed number of iterations to execute the script
    // iterations: 10,
    //max no of requests to make per seconds in total across all VUs
    // rps: 20
};

export default function() {
    var url = `https://qa.brain.planx.pla.net`;
    let res = http.get(url)
    // check(res,{
    //     "is status 200": (r) => r.status == 200
    // });
};
