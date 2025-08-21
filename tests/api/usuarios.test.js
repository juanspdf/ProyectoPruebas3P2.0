const request = require('supertest');
const express = require('express');

// Mock de los middleware ANTES de importar las rutas
jest.mock('../../src/middleware/auth', () => ({
    authenticateToken: jest.fn((req, res, next) => {
        req.usuario = { id: 1, email: 'test@admin.com', rol: 'admin' };
        next();
    }),
    requireRole: jest.fn((roles) => (req, res, next) => next())
}));

// Mock de los controladores ANTES de importar las rutas
jest.mock('../../src/controllers/UsuarioController');

describe('Usuarios API Routes', () => {
    let app;
    let mockUsuarioController;
    let UsuarioController;

    beforeAll(() => {
        // Configurar la aplicación de testing aislada
        app = express();
        app.use(express.json());
        
        // Importar el controlador mockeado
        UsuarioController = require('../../src/controllers/UsuarioController');
        
        // Configurar el mock del controlador
        mockUsuarioController = {
            obtenerTodos: jest.fn(),
            obtenerPorId: jest.fn(),
            registrar: jest.fn(),
            login: jest.fn(),
            actualizar: jest.fn(),
            eliminar: jest.fn()
        };

        UsuarioController.mockImplementation(() => mockUsuarioController);
        
        // Importar las rutas DESPUÉS de configurar los mocks
        const usuariosRoutes = require('../../src/routes/usuarios');
        app.use('/api/usuarios', usuariosRoutes);
    });

    beforeEach(() => {
        jest.clearAllMocks();
    });

    afterAll(async () => {
        // Limpiar cualquier recurso si es necesario
        jest.resetModules();
    });

    describe('POST /api/usuarios/registro', () => {
        test('should register new user', async () => {
            mockUsuarioController.registrar.mockImplementation((req, res) => {
                res.status(201).json({
                    success: true,
                    message: 'Usuario registrado exitosamente',
                    usuario: {
                        id: 1,
                        nombre: req.body.nombre,
                        email: req.body.email,
                        rol: 'user'
                    }
                });
            });

            const newUser = {
                nombre: 'John Doe',
                email: 'john@test.com',
                password: 'password123'
            };

            const response = await request(app)
                .post('/api/usuarios/registrar')
                .send(newUser)
                .expect(201);

            expect(response.body.success).toBe(true);
            expect(response.body.usuario.nombre).toBe('John Doe');
            expect(mockUsuarioController.registrar).toHaveBeenCalled();
        });
    });

    describe('POST /api/usuarios/login', () => {
        test('should login with valid credentials', async () => {
            mockUsuarioController.login.mockImplementation((req, res) => {
                res.json({
                    success: true,
                    message: 'Login exitoso',
                    token: 'mock.jwt.token',
                    usuario: {
                        id: 1,
                        nombre: 'John Doe',
                        email: req.body.email,
                        rol: 'user'
                    }
                });
            });

            const credentials = {
                email: 'john@test.com',
                password: 'password123'
            };

            const response = await request(app)
                .post('/api/usuarios/login')
                .send(credentials)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.token).toBe('mock.jwt.token');
            expect(mockUsuarioController.login).toHaveBeenCalled();
        });
    });

    describe('GET /api/usuarios (Admin only)', () => {
        test('should get all users with admin auth', async () => {
            mockUsuarioController.obtenerTodos.mockImplementation((req, res) => {
                res.json({
                    success: true,
                    usuarios: [
                        { id: 1, nombre: 'John', email: 'john@test.com', rol: 'user' },
                        { id: 2, nombre: 'Jane', email: 'jane@test.com', rol: 'admin' }
                    ]
                });
            });

            const response = await request(app)
                .get('/api/usuarios')
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.usuarios).toHaveLength(2);
            expect(mockUsuarioController.obtenerTodos).toHaveBeenCalled();
        });
    });
});
