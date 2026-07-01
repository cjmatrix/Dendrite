import http from 'k6/http';
import { check, sleep } from 'k6';

// Define the configurations/scenarios
export const options = {
  stages: [
    { duration: '30s', target: 20 }, // Ramp-up: 0 to 20 virtual users (VUs) in 30 seconds
    { duration: '1m', target: 20 },  // Plateau: Keep 20 VUs active for 1 minute
    { duration: '30s', target: 50 }, // Stress: Ramp-up to 50 VUs
    { duration: '1m', target: 50 },  // Keep 50 VUs active for 1 minute
    { duration: '30s', target: 0 },  // Ramp-down: Cooldown to 0 users
  ],
  thresholds: {
    http_req_failed: ['rate<0.01'],   // Error rate must be less than 1%
    http_req_duration: ['p(95)<500'], // 95% of requests must complete under 500ms
  },
};

const BASE_URL = 'https://nurons.me'; // Or http://localhost for local test

export default function () {
  // Scenario 1: User visits the homepage
  const homepageRes = http.get(`${BASE_URL}/`);
  check(homepageRes, {
    'homepage status is 200': (r) => r.status === 200,
  });
  sleep(1); // Wait 1 second (simulating user think-time)

  // Scenario 2: User triggers a check to the health endpoint (hits backend API through Nginx proxy)
  const apiRes = http.get(`${BASE_URL}/health`);
  check(apiRes, {
    'health check status is 200': (r) => r.status === 200,
    'response has status ok': (r) => r.body.includes('OK') || r.status === 200,
  });
  
  sleep(2); // Simulate reading/interaction delay
}
