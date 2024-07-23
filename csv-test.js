import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

const host = "https://eyewear-staging.zenniservices.com";
const testEmail = "sdetperformance@gmail.com";

// export const options = {
//   stages: [
//     { duration: '30s', target: 20 },
//     { duration: '1m30s', target: 10 },
//     { duration: '20s', target: 0 },
//   ],
// };
export const options = {
  vus: 1, // Number of Virtual Users
  duration: '3s', // Duration of the test
  iterations: 1,
};

// export default function () {
//   const res = http.get('https://httpbin.test.k6.io/');
//   check(res, { 'status was 200': (r) => r.status == 200 });
//   sleep(1);
// }

// use emails from the following:
// /Users/eric.chau/Documents/Redemption/performance/rdp-2k-loadtest.csv


// Custom metric to track the rate of successful requests
let successRate = new Rate('successful_requests');


export default function () {
    // Magic Link Request
    const url = `${host}/redemption/api/user/login`;
    const payload = JSON.stringify({
      //userEmail: 'email address from csv',
      userEmail: testEmail,
      loginType: 'magiclink.start',
    });
    const params = {
      headers: {
        'Content-Type': 'application/json',
        'Accept-Encoding': 'gzip, deflate, br, zstd',
      },
    };

    let res1 = http.post(url, payload, params);

    // Check if the first request was successful
    check(res1, {
        'status is 200': (r) => r.status === 200,
    });
    
    console.log(`Response from first request:\nStatus: ${res1.status}\nBody: ${res1.body}`);
}