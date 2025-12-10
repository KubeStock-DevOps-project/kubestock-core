import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
    vus: 1,
    duration: '5s',
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
    // 1. Check Product Service (Via Gateway)

    const resProduct = http.get(`${BASE_URL}/api/products`, params);
    check(resProduct, {
        '✅ Product Service UP': (r) => r.status === 200,
    });
    if (resProduct.status !== 200) {
        console.error(`❌ Product Service failed: ${resProduct.status} ${resProduct.body}`);
    }

    // 2. Check Inventory Service
    // Critical dependency for stock management
    const resInventory = http.get(`${BASE_URL}/api/inventory`, params);
    check(resInventory, {
        '✅ Inventory Service UP': (r) => r.status === 200,
    });
    if (resInventory.status !== 200) {
        console.error(`❌ Inventory Service failed: ${resInventory.status} ${resInventory.body}`);
    }

    // 3. Check Supplier Service
    const resSupplier = http.get(`${BASE_URL}/api/suppliers`, params);
    check(resSupplier, {
        '✅ Supplier Service UP': (r) => r.status === 200,
    });
    if (resSupplier.status !== 200) {
        console.error(`❌ Supplier Service failed: ${resSupplier.status} ${resSupplier.body}`);
    }

    // 4. Check Order Management Service
    const resOrder = http.get(`${BASE_URL}/api/orders`, params);
    check(resOrder, {
        '✅ Order Service UP': (r) => r.status === 200,
    });
    if (resOrder.status !== 200) {
        console.error(`❌ Order Service failed: ${resOrder.status} ${resOrder.body}`);
    }

    // 5. Check Identity/Auth Service (Optional but recommended)
    // Often these endpoints require auth headers, so checking health/public info is safer
    const resIdentity = http.get(`${BASE_URL}/api/identity/health`, params);
    check(resIdentity, {
        '✅ Identity Service UP': (r) => r.status === 200 || r.status === 401, // 401 is okay (means service is alive but secured)
    });
    if (resIdentity.status !== 200 && resIdentity.status !== 401) {
        console.error(`❌ Identity Service failed: ${resIdentity.status} ${resIdentity.body}`);
    }

    sleep(1);
}