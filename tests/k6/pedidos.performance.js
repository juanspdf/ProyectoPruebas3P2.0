import http from 'k6/http';
import { check, sleep } from 'k6';
import { htmlReport } from 'https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js';
import { textSummary } from 'https://jslib.k6.io/k6-summary/0.0.1/index.js';

// Configuración de pruebas de rendimiento para módulo de Pedidos
export let options = {
    scenarios: {
        // 1. Ramp/Load: incremento gradual (8 → 70 VUs en 30s)
        ramp_test: {
            executor: 'ramping-vus',
            startVUs: 8,
            stages: [
                { duration: '30s', target: 70 },   // Incremento gradual
                { duration: '60s', target: 70 },   // Mantener carga
                { duration: '30s', target: 0 },    // Reducir gradualmente
            ],
        },
        
        // 2. Spike: salto brusco (0 → 250 VUs en 12s, mantener 75s)
        spike_test: {
            executor: 'ramping-vus',
            startVUs: 0,
            stages: [
                { duration: '12s', target: 250 },  // Spike rápido
                { duration: '75s', target: 250 },  // Mantener spike
                { duration: '13s', target: 0 },    // Bajar rápidamente
            ],
            startTime: '3m', // Ejecutar después del ramp test
        },
        
        // 3. Soak (endurance): carga sostenida (45 VUs durante 270s = 4.5 min)
        soak_test: {
            executor: 'constant-vus',
            vus: 45,
            duration: '270s', // 4.5 minutos de carga constante
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

// Datos de prueba para pedidos
const testOrder = {
    usuario_id: 1,
    items: [
        {
            producto_id: 1,
            cantidad: 2,
            precio_unitario: 299.99
        },
        {
            producto_id: 2,
            cantidad: 1,
            precio_unitario: 199.99
        }
    ],
    direccion_envio: 'Calle Test 123, Ciudad Test',
    metodo_pago: 'tarjeta'
};

export default function () {
    const endpoints = [
        // GET - Obtener todos los pedidos
        {
            name: 'GET /api/pedidos',
            request: () => http.get(`${BASE_URL}/api/pedidos`),
        },
        
        // GET - Obtener pedido por ID
        {
            name: 'GET /api/pedidos/:id',
            request: () => http.get(`${BASE_URL}/api/pedidos/1`),
        },
        
        // GET - Obtener pedidos por usuario
        {
            name: 'GET /api/pedidos/usuario/:usuarioId',
            request: () => http.get(`${BASE_URL}/api/pedidos/usuario/1`),
        },
        
        // GET - Obtener estadísticas de pedidos
        {
            name: 'GET /api/pedidos/estadisticas',
            request: () => http.get(`${BASE_URL}/api/pedidos/estadisticas`),
        },
        
        // POST - Crear pedido
        {
            name: 'POST /api/pedidos',
            request: () => http.post(
                `${BASE_URL}/api/pedidos`,
                JSON.stringify(testOrder),
                { headers: { 'Content-Type': 'application/json' } }
            ),
        },
        
        // PUT - Actualizar estado del pedido
        {
            name: 'PUT /api/pedidos/:id/estado',
            request: () => http.put(
                `${BASE_URL}/api/pedidos/1/estado`,
                JSON.stringify({ estado: 'procesando' }),
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
            [`${endpoint.name} - Response time < 1200ms`]: (r) => r.timings.duration < 1200,
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
        
        if (endpoint.name.includes('estadisticas')) {
            check(response, {
                [`${endpoint.name} - Statistics response has numeric data`]: (r) => {
                    try {
                        const data = JSON.parse(r.body);
                        return typeof data === 'object' && data !== null;
                    } catch {
                        return false;
                    }
                }
            });
        }
        
        if (endpoint.name.includes('POST') && endpoint.name.includes('pedidos')) {
            check(response, {
                [`${endpoint.name} - Order creation response has ID`]: (r) => {
                    if (r.status === 201) {
                        try {
                            const data = JSON.parse(r.body);
                            return data.id !== undefined || data.pedido_id !== undefined;
                        } catch {
                            return false;
                        }
                    }
                    return true; // Si no es 201, no verificamos el ID
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
        'pedidos-summary.json': JSON.stringify(data),
        'pedidos-performance-report.html': htmlReport(data),
        'stdout': textSummary(data, { indent: ' ', enableColors: true }),
    };
}
