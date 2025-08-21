// Configuración global para los tests
require('dotenv').config({ path: '.env' });

// Mock de console.log para tests más limpios
global.console = {
    ...console,
    log: jest.fn(),
    error: console.error,
    warn: console.warn,
    info: console.info
};

// Variables globales para testing
global.testDatabase = null;

// Configurar timeout para tests
jest.setTimeout(30000);
