import http from 'k6/http';
import { check, sleep } from 'k6';
import { htmlReport } from 'https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js';
import { textSummary } from 'https://jslib.k6.io/k6-summary/0.0.1/index.js';

// Configuración de pruebas de rendimiento para módulo de Usuarios
export let options = {
    scenarios: {
        // 1. Ramp/Load: incremento gradual (5 → 80 VUs en 30s)
        ramp_test: {
            executor: 'ramping-vus',
            startVUs: 5,
            stages: [
                { duration: '30s', target: 80 },   // Incremento gradual
                { duration: '60s', target: 80 },   // Mantener carga
                { duration: '30s', target: 0 },    // Reducir gradualmente
            ],
        },
        
        // 2. Spike: salto brusco (0 → 200 VUs en 15s, mantener 90s)
        spike_test: {
            executor: 'ramping-vus',
            startVUs: 0,
            stages: [
                { duration: '15s', target: 200 },  // Spike rápido
                { duration: '90s', target: 200 },  // Mantener spike
                { duration: '15s', target: 0 },    // Bajar rápidamente
            ],
            startTime: '3m', // Ejecutar después del ramp test
        },
        
        // 3. Soak (endurance): carga sostenida (40 VUs durante 240s = 4 min)
        soak_test: {
            executor: 'constant-vus',
            vus: 40,
            duration: '240s', // 4 minutos de carga constante
            startTime: '6m',  // Ejecutar después del spike test
        }
    },
    
    // Thresholds obligatorios
    thresholds: {
        'http_req_duration{expected_response:true}': ['p(95)<500'], // 95% de requests < 500ms
        'http_req_failed': ['rate<0.01'],                          // Menos del 1% de errores
        'checks': ['rate>0.99'],                                   // Más del 99% de checks exitosos
    },
};

// URL base de la API
const BASE_URL = __ENV.BASE_URL || 'http://localhost:3001';

// Datos de prueba para usuarios
const testUser = {
    nombre: 'Usuario Test',
    apellido: 'K6 Performance',
    email: `test${Math.random().toString(36).substr(2, 9)}@k6test.com`,
    password: 'TestPassword123',
    telefono: '1234567890',
    direccion: 'Dirección Test 123'
};

const loginData = {
    email: 'admin@test.com',
    password: 'admin123'
};

export default function () {
    const endpoints = [
        // GET - Obtener todos los usuarios
        {
            name: 'GET /api/usuarios',
            request: () => http.get(`${BASE_URL}/api/usuarios`),
        },
        
        // GET - Obtener usuario por ID
        {
            name: 'GET /api/usuarios/:id',
            request: () => http.get(`${BASE_URL}/api/usuarios/1`),
        },
        
        // POST - Registro de usuario
        {
            name: 'POST /api/usuarios/registro',
            request: () => http.post(
                `${BASE_URL}/api/usuarios/registro`,
                JSON.stringify(testUser),
                { headers: { 'Content-Type': 'application/json' } }
            ),
        },
        
        // POST - Login de usuario
        {
            name: 'POST /api/usuarios/login',
            request: () => http.post(
                `${BASE_URL}/api/usuarios/login`,
                JSON.stringify(loginData),
                { headers: { 'Content-Type': 'application/json' } }
            ),
        },
        
        // PUT - Actualizar usuario
        {
            name: 'PUT /api/usuarios/:id',
            request: () => http.put(
                `${BASE_URL}/api/usuarios/1`,
                JSON.stringify({ 
                    ...testUser, 
                    nombre: 'Usuario Actualizado',
                    email: `updated${Math.random().toString(36).substr(2, 9)}@k6test.com`
                }),
                { headers: { 'Content-Type': 'application/json' } }
            ),
        }
    ];
    
    // Ejecutar cada endpoint con verificaciones
    endpoints.forEach(endpoint => {
        const response = endpoint.request();
        
        // Verificaciones básicas
        check(response, {
            [`${endpoint.name} - Status is 200 or 201 or 400`]: (r) => [200, 201, 400].includes(r.status),
            [`${endpoint.name} - Response time < 1000ms`]: (r) => r.timings.duration < 1000,
            [`${endpoint.name} - Has valid JSON response`]: (r) => {
                try {
                    JSON.parse(r.body);
                    return true;
                } catch {
                    return false;
                }
            },
        });
        
        // Verificaciones específicas por endpoint
        if (endpoint.name.includes('GET')) {
            check(response, {
                [`${endpoint.name} - Has data array or object`]: (r) => {
                    try {
                        const data = JSON.parse(r.body);
                        return data.success !== undefined || Array.isArray(data) || typeof data === 'object';
                    } catch {
                        return false;
                    }
                }
            });
        }
        
        if (endpoint.name.includes('login')) {
            check(response, {
                [`${endpoint.name} - Login response has token or message`]: (r) => {
                    try {
                        const data = JSON.parse(r.body);
                        return data.token !== undefined || data.message !== undefined;
                    } catch {
                        return false;
                    }
                }
            });
        }
        
        // Pausa breve entre requests para simular comportamiento real
        sleep(Math.random() * 1.5 + 0.5); // 0.5-2 segundos
    });
}

// Función para generar reporte personalizado
export function handleSummary(data) {
    return {
        'usuarios-summary.json': JSON.stringify(data),
        'usuarios-performance-report.html': htmlReport(data),
        'stdout': textSummary(data, { indent: ' ', enableColors: true }),
    };
}
