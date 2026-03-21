import http from 'k6/http';
import { check, sleep } from 'k6';

export let options = {
  stages: [
    { duration: '10s', target: 50 },  // Rampa de subida
    { duration: '30s', target: 100 }, // Mantenimiento
    { duration: '10s', target: 0 },   // Rampa de bajada
  ],
};

export default function () {
  // Ajustar token según entorno
  const params = {
    headers: {
      'Authorization': 'Bearer YOUR_TEST_TOKEN',
      'Content-Type': 'application/json',
    },
  };

  let res = http.get('http://localhost:5000/api/v1/marketplace', params);
  
  check(res, {
    'status is 200': (r) => r.status === 200,
    'transaction time is OK': (r) => r.timings.duration < 500,
  });

  sleep(1);
}
