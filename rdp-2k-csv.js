import http from 'k6/http';
import { check, sleep } from 'k6';
import { SharedArray } from 'k6/data';
import { Rate } from 'k6/metrics';
import papaparse from './assets/papaparse.js';

const host = "https://eyewear-staging.zenniservices.com";
const testEmail = "sdetperformance@gmail.com";

export const options = {
  vus: 2, // Number of Virtual Users
  duration: '5s', // Duration of the test
  iterations: 4,
};

// Load and parse the CSV file
const csvData = new SharedArray('csvData', function() {
  // Read data from a local CSV file
  const csvContent = open('./assets/rdp-2k-loadtest.csv'); 
  return papaparse.parse(csvContent, { header: true }).data;
});

// Function to get email from CSV file for each iteration
function getEmail(index) {
  return csvData[index % csvData.length].email;
}

// Custom metric to track the rate of successful requests
let successRate = new Rate('successful_requests');

// Both magic link request and login here
export default function () {
  // Get the email for this iteration
  const email = getEmail(__ITER);

  // Magic Link Request
  const url = `${host}/redemption/api/user/login`;
  const payload = JSON.stringify({
    //userEmail: 'email address from csv',
    userEmail: email,
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
  console.log("Your email is: " + JSON.parse(res1.request.body).userEmail)
  console.log("Your token is: " + JSON.parse(res1.body).token)

  const loginToken = JSON.parse(res1.body).token;
  
  // Record success or failure for the custom metric
  successRate.add(res1.status === 200);

  // Make sure to handle empty or unexpected responses
  if (!loginToken) {
      console.error('No valid data received in response to the first request');
      return; // End iteration if no loginToken
  }

  // Second POST request using data from the first response
  const url2 = `${host}/post-login?code=${loginToken}&userEmail=${email}`;
  const params2 = {
    headers: {
      'Content-Type': 'application/json',
      'Accept-Encoding': 'gzip, deflate, br, zstd',
    },
  };

  let res2 = http.post(url2, params2);

  // Check if the second request was successful
  check(res2, {
      'status is 200': (r) => r.status === 200,
  });

  // Record success or failure for the custom metric
  successRate.add(res2.status === 200);

  // Simulate some wait time between requests
  sleep(1);
};


export function magicLinkReq() {
  const url = `${host}/redemption/api/user/login`;
  const payload = JSON.stringify({
    userEmail: 'email address from csv',
    loginType: 'magiclink.start',
  });

  const params = {
    headers: {
      'Content-Type': 'application/json',
      'Accept-Encoding': 'gzip, deflate, br, zstd',
    },
  };

  http.post(url, payload, params);
};

export function magicLinkLogin() {
  const url = `${host}/redemption/api/user/login`;
  // const payload = JSON.stringify({
  //   userEmail: 'email address from csv',
  //   loginType: 'magiclink.start',
  // });

  const params = {
    headers: {
      'Content-Type': 'application/json',
      'Accept-Encoding': 'gzip, deflate, br, zstd',
    },
  };

  http.post(url, payload, params);
};

