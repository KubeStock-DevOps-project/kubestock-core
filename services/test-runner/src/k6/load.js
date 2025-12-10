import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
    stages: [
        { duration: '10s', target: 20 }, // Ramp up to 20 users
        { duration: '30s', target: 20 }, // Stay at 20 users
        { duration: '10s', target: 0 },  // Ramp down to 0
    ],
    // thresholds: {
    //     http_req_failed: ['rate<0.05'], 
    //     http_req_duration: ['p(95)<5000'], 
    // },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:5173';
const ACCESS_TOKEN = __ENV.ACCESS_TOKEN;

const headers = {
    'Content-Type': 'application/json',
};
if (ACCESS_TOKEN) {
    headers['Authorization'] = `Bearer ${ACCESS_TOKEN}`;
}

const params = {
    headers: headers,
};

export default function () {
    const res = http.get(`${BASE_URL}/api/products`, params);

    check(res, {
        'status is 200': (r) => r.status === 200,
    });

    sleep(1);
}
