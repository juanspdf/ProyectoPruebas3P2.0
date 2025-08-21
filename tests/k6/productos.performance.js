import http from 'k6/http';
import { check, sleep } from 'k6';
import { htmlReport } from 'https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js';
import { textSummary } from 'https://jslib.k6.io/k6-summary/0.0.1/index.js';

// Configuración de pruebas de rendimiento para módulo de Productos
export let options = {
    scenarios: {
        // 1. Ramp/Load: incremento gradual (10 → 100 VUs en 30s)
        ramp_test: {
            executor: 'ramping-vus',
            startVUs: 10,
            stages: [
                { duration: '30s', target: 100 },  // Incremento gradual
                { duration: '60s', target: 100 },  // Mantener carga
                { duration: '30s', target: 0 },    // Reducir gradualmente
            ],
        },
        
        // 2. Spike: salto brusco (0 → 300 VUs en 10s, mantener 60s)
        spike_test: {
            executor: 'ramping-vus',
            startVUs: 0,
            stages: [
                { duration: '10s', target: 300 },  // Spike rápido
                { duration: '60s', target: 300 },  // Mantener spike
                { duration: '10s', target: 0 },    // Bajar rápidamente
            ],
            startTime: '3m', // Ejecutar después del ramp test
        },
        
        // 3. Soak (endurance): carga sostenida (50 VUs durante 300s = 5 min)
        soak_test: {
            executor: 'constant-vus',
            vus: 50,
            duration: '300s', // 5 minutos de carga constante
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

// Datos de prueba
const testProduct = {
    nombre: 'Producto Test K6',
    descripcion: 'Producto para pruebas de rendimiento',
    precio: 99.99,
    categoria: 'Test',
    stock: 100,
    imagen: 'test-image.jpg'
};

export default function () {
    const endpoints = [
        // GET - Obtener todos los productos
        {
            name: 'GET /api/productos',
            request: () => http.get(`${BASE_URL}/api/productos`),
        },
        
        // GET - Obtener productos por categoría
        {
            name: 'GET /api/productos/categoria/:categoria',
            request: () => http.get(`${BASE_URL}/api/productos/categoria/Electrónicos`),
        },
        
        // GET - Obtener producto por ID
        {
            name: 'GET /api/productos/:id',
            request: () => http.get(`${BASE_URL}/api/productos/1`),
        },
        
        // POST - Crear producto (carga de escritura)
        {
            name: 'POST /api/productos',
            request: () => http.post(
                `${BASE_URL}/api/productos`,
                JSON.stringify(testProduct),
                { headers: { 'Content-Type': 'application/json' } }
            ),
        },
        
        // PUT - Actualizar producto
        {
            name: 'PUT /api/productos/:id',
            request: () => http.put(
                `${BASE_URL}/api/productos/1`,
                JSON.stringify({ ...testProduct, nombre: 'Producto Actualizado' }),
                { headers: { 'Content-Type': 'application/json' } }
            ),
        }
    ];
    
    // Ejecutar cada endpoint con verificaciones
    endpoints.forEach(endpoint => {
        const response = endpoint.request();
        
        // Verificaciones básicas
        check(response, {
            [`${endpoint.name} - Status is 200 or 201`]: (r) => [200, 201].includes(r.status),
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
        
        // Pausa breve entre requests para simular comportamiento real
        sleep(Math.random() * 2 + 1); // 1-3 segundos
    });
}

// Función para generar reporte personalizado
export function handleSummary(data) {
    return {
        'summary.json': JSON.stringify(data),
        'productos-performance-report.html': htmlReport(data),
        'stdout': textSummary(data, { indent: ' ', enableColors: true }),
    };
}
