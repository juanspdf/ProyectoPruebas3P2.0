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

    describe('POST /api/usuarios (alternative registration route)', () => {
        test('should register user via alternative route', async () => {
            mockUsuarioController.registrar.mockImplementation((req, res) => {
                res.status(201).json({
                    success: true,
                    message: 'Usuario registrado exitosamente',
                    usuario: {
                        id: 2,
                        nombre: req.body.nombre,
                        email: req.body.email,
                        rol: 'user'
                    }
                });
            });

            const newUser = {
                nombre: 'Jane Doe',
                email: 'jane@test.com',
                password: 'password123'
            };

            const response = await request(app)
                .post('/api/usuarios')
                .send(newUser)
                .expect(201);

            expect(response.body.success).toBe(true);
            expect(response.body.usuario.nombre).toBe('Jane Doe');
            expect(mockUsuarioController.registrar).toHaveBeenCalled();
        });
    });

    describe('GET /api/usuarios/perfil', () => {
        test('should get user profile with authentication', async () => {
            mockUsuarioController.perfil = jest.fn((req, res) => {
                res.json({
                    success: true,
                    usuario: {
                        id: req.usuario.id,
                        nombre: 'John Doe',
                        email: req.usuario.email,
                        rol: req.usuario.rol
                    }
                });
            });

            const response = await request(app)
                .get('/api/usuarios/perfil')
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.usuario.id).toBe(1);
            expect(mockUsuarioController.perfil).toHaveBeenCalled();
        });
    });

    describe('PUT /api/usuarios/perfil', () => {
        test('should update user profile', async () => {
            mockUsuarioController.actualizar.mockImplementation((req, res) => {
                res.json({
                    success: true,
                    message: 'Perfil actualizado exitosamente',
                    usuario: {
                        id: req.params.id,
                        nombre: req.body.nombre,
                        email: req.body.email
                    }
                });
            });

            const updateData = {
                nombre: 'John Updated',
                email: 'john.updated@test.com'
            };

            const response = await request(app)
                .put('/api/usuarios/perfil')
                .send(updateData)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.usuario.nombre).toBe('John Updated');
            expect(mockUsuarioController.actualizar).toHaveBeenCalled();
        });
    });

    describe('PUT /api/usuarios/:id', () => {
        test('should allow admin to update any user', async () => {
            const { authenticateToken } = require('../../src/middleware/auth');
            authenticateToken.mockImplementation((req, res, next) => {
                req.usuario = { id: 1, email: 'admin@test.com', rol: 'admin' };
                next();
            });

            mockUsuarioController.actualizar.mockImplementation((req, res) => {
                res.json({
                    success: true,
                    message: 'Usuario actualizado exitosamente',
                    usuario: {
                        id: parseInt(req.params.id),
                        nombre: req.body.nombre
                    }
                });
            });

            const updateData = { nombre: 'Updated User' };

            const response = await request(app)
                .put('/api/usuarios/2')
                .send(updateData)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.usuario.id).toBe(2);
            expect(mockUsuarioController.actualizar).toHaveBeenCalled();
        });

        test('should allow user to update own profile', async () => {
            const { authenticateToken } = require('../../src/middleware/auth');
            authenticateToken.mockImplementation((req, res, next) => {
                req.usuario = { id: 2, email: 'user@test.com', rol: 'user' };
                next();
            });

            mockUsuarioController.actualizar.mockImplementation((req, res) => {
                res.json({
                    success: true,
                    message: 'Perfil actualizado exitosamente'
                });
            });

            const updateData = { nombre: 'Self Updated' };

            const response = await request(app)
                .put('/api/usuarios/2')
                .send(updateData)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(mockUsuarioController.actualizar).toHaveBeenCalled();
        });

        test('should prevent user from updating other users profile', async () => {
            const { authenticateToken } = require('../../src/middleware/auth');
            authenticateToken.mockImplementation((req, res, next) => {
                req.usuario = { id: 1, email: 'user@test.com', rol: 'user' };
                next();
            });

            const updateData = { nombre: 'Forbidden Update' };

            const response = await request(app)
                .put('/api/usuarios/2')
                .send(updateData)
                .expect(403);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Solo puedes actualizar tu propio perfil');
            expect(mockUsuarioController.actualizar).not.toHaveBeenCalled();
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

    describe('GET /api/usuarios/:id (Admin only)', () => {
        test('should get user by id with admin auth', async () => {
            mockUsuarioController.obtenerPorId.mockImplementation((req, res) => {
                res.json({
                    success: true,
                    usuario: {
                        id: parseInt(req.params.id),
                        nombre: 'John Doe',
                        email: 'john@test.com',
                        rol: 'user'
                    }
                });
            });

            const response = await request(app)
                .get('/api/usuarios/1')
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.usuario.id).toBe(1);
            expect(mockUsuarioController.obtenerPorId).toHaveBeenCalled();
        });
    });

    describe('DELETE /api/usuarios/:id (Admin only)', () => {
        test('should delete user with admin auth', async () => {
            mockUsuarioController.eliminar.mockImplementation((req, res) => {
                res.json({
                    success: true,
                    message: 'Usuario eliminado exitosamente'
                });
            });

            const response = await request(app)
                .delete('/api/usuarios/1')
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe('Usuario eliminado exitosamente');
            expect(mockUsuarioController.eliminar).toHaveBeenCalled();
        });
    });
});
