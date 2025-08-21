const UsuarioController = require('../../src/controllers/UsuarioController');
const Usuario = require('../../src/models/Usuario');
const jwt = require('jsonwebtoken');

// Mock de las dependencias
jest.mock('../../src/models/Usuario');
jest.mock('jsonwebtoken');

describe('UsuarioController', () => {
    let usuarioController;
    let mockRequest;
    let mockResponse;
    let m    describe('registrar', () => {
        test('should handle registration errors', async () => {
            mockRequest.body = {
                nombre: 'Test User',
                email: 'test@test.com',
                password: 'password123'
            };
            mockUsuarioInstance.crear.mockRejectedValue(new Error('Database error'));

            await usuarioController.registrar(mockRequest, mockResponse);

            expect(mockResponse.status).toHaveBeenCalledWith(500);
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: false,
                message: 'Error interno del servidor',
                error: 'Database error'
            });
        });
    });

    beforeEach(() => {
        // Crear mock de la instancia del modelo
        mockUsuarioInstance = {
            obtenerTodos: jest.fn(),
            obtenerPorId: jest.fn(),
            obtenerPorEmail: jest.fn(),
            crear: jest.fn(),
            actualizar: jest.fn(),
            eliminar: jest.fn(),
            login: jest.fn(),
            validarLogin: jest.fn()
        };

        // Mock del constructor de la clase
        Usuario.mockImplementation(() => mockUsuarioInstance);
        
        // Crear una nueva instancia del controlador para cada test
        usuarioController = new UsuarioController();
        
        // Configurar mocks para request y response
        mockRequest = {
            params: {},
            body: {},
            query: {},
            usuario: { id: 1, email: 'test@test.com' }
        };

        mockResponse = {
            json: jest.fn(),
            status: jest.fn().mockReturnThis(),
            send: jest.fn()
        };

        // Limpiar todos los mocks antes de cada test
        jest.clearAllMocks();
    });

    describe('obtenerTodos', () => {
        test('should return all users successfully', async () => {
            const mockUsuarios = [
                {
                    id: 1,
                    nombre: 'John',
                    email: 'john@test.com',
                    rol: 'user'
                },
                {
                    id: 2,
                    nombre: 'Jane',
                    email: 'jane@test.com',
                    rol: 'admin'
                }
            ];

            mockUsuarioInstance.obtenerTodos.mockResolvedValue(mockUsuarios);

            await usuarioController.obtenerTodos(mockRequest, mockResponse);

            expect(mockResponse.json).toHaveBeenCalledWith({
                success: true,
                usuarios: mockUsuarios
            });
        });

        test('should handle database errors', async () => {
            mockUsuarioInstance.obtenerTodos.mockRejectedValue(new Error('Database error'));

            await usuarioController.obtenerTodos(mockRequest, mockResponse);

            expect(mockResponse.status).toHaveBeenCalledWith(500);
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: false,
                message: 'Error interno del servidor',
                error: 'Database error'
            });
        });
    });

    describe('obtenerPorId', () => {
        test('should return user by id', async () => {
            const mockUsuario = {
                id: 1,
                nombre: 'John',
                email: 'john@test.com',
                rol: 'user'
            };

            mockRequest.params.id = '1';
            mockUsuarioInstance.obtenerPorId.mockResolvedValue(mockUsuario);

            await usuarioController.obtenerPorId(mockRequest, mockResponse);

            expect(mockResponse.json).toHaveBeenCalledWith({
                success: true,
                usuario: mockUsuario
            });
        });

        test('should return 404 if user not found', async () => {
            mockRequest.params.id = '999';
            mockUsuarioInstance.obtenerPorId.mockResolvedValue(null);

            await usuarioController.obtenerPorId(mockRequest, mockResponse);

            expect(mockResponse.status).toHaveBeenCalledWith(404);
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: false,
                message: 'Usuario no encontrado'
            });
        });
    });

    describe('registrar', () => {
        test('should register new user successfully', async () => {
            const mockCreatedUser = {
                id: 1,
                nombre: 'John Doe',
                email: 'john@test.com',
                rol: 'user'
            };

            mockRequest.body = {
                nombre: 'John Doe',
                email: 'john@test.com',
                password: 'password123'
            };

            mockUsuarioInstance.obtenerPorEmail.mockResolvedValue(null);
            mockUsuarioInstance.crear.mockResolvedValue(mockCreatedUser);

            await usuarioController.registrar(mockRequest, mockResponse);

            expect(mockResponse.status).toHaveBeenCalledWith(201);
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: true,
                message: 'Usuario registrado exitosamente',
                usuario: mockCreatedUser
            });
        });

        test('should validate required fields', async () => {
            mockRequest.body = {
                email: 'john@test.com'
                // Faltan nombre y password
            };

            await usuarioController.registrar(mockRequest, mockResponse);

            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: false,
                message: 'Nombre, email y contraseña son campos obligatorios'
            });
        });

        test('should validate email format', async () => {
            mockRequest.body = {
                nombre: 'John Doe',
                email: 'invalid-email',
                password: 'password123'
            };

            await usuarioController.registrar(mockRequest, mockResponse);

            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: false,
                message: 'Formato de email inválido'
            });
        });

        test('should check for existing email', async () => {
            mockRequest.body = {
                nombre: 'John Doe',
                email: 'john@test.com',
                password: 'password123'
            };

            mockUsuarioInstance.obtenerPorEmail.mockResolvedValue({ id: 1 });

            await usuarioController.registrar(mockRequest, mockResponse);

            expect(mockResponse.status).toHaveBeenCalledWith(409);
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: false,
                message: 'El email ya está registrado'
            });
        });
    });

    describe('login', () => {
        test('should login user successfully', async () => {
            const mockUsuario = {
                id: 1,
                nombre: 'John',
                email: 'john@test.com',
                rol: 'user'
            };

            const mockToken = 'mock.jwt.token';

            mockRequest.body = {
                email: 'john@test.com',
                password: 'password123'
            };

            mockUsuarioInstance.login.mockResolvedValue(mockUsuario);
            jwt.sign.mockReturnValue(mockToken);

            await usuarioController.login(mockRequest, mockResponse);

            expect(mockResponse.json).toHaveBeenCalledWith({
                success: true,
                message: 'Login exitoso',
                token: mockToken,
                usuario: {
                    id: 1,
                    nombre: 'John',
                    email: 'john@test.com',
                    rol: 'user'
                }
            });
        });

        test('should validate required fields for login', async () => {
            mockRequest.body = {
                email: 'john@test.com'
                // Falta password
            };

            await usuarioController.login(mockRequest, mockResponse);

            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: false,
                message: 'Email y contraseña son obligatorios'
            });
        });

        test('should handle invalid credentials', async () => {
            mockRequest.body = {
                email: 'john@test.com',
                password: 'wrongpassword'
            };

            mockUsuarioInstance.login.mockResolvedValue(null);

            await usuarioController.login(mockRequest, mockResponse);

            expect(mockResponse.status).toHaveBeenCalledWith(401);
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: false,
                message: 'Credenciales inválidas'
            });
        });
    });

    describe('actualizar', () => {
        test('should update user successfully', async () => {
            const mockUpdatedUser = {
                id: 1,
                nombre: 'John Updated',
                email: 'john.updated@test.com',
                rol: 'user'
            };

            mockRequest.params.id = '1';
            mockRequest.body = {
                nombre: 'John Updated',
                email: 'john.updated@test.com'
            };

            mockUsuarioInstance.obtenerPorId.mockResolvedValue({ id: 1 });
            mockUsuarioInstance.actualizar.mockResolvedValue(mockUpdatedUser);

            await usuarioController.actualizar(mockRequest, mockResponse);

            expect(mockResponse.json).toHaveBeenCalledWith({
                success: true,
                message: 'Usuario actualizado exitosamente',
                usuario: mockUpdatedUser
            });
        });

        test('should return 404 if user not found for update', async () => {
            mockRequest.params.id = '999';
            mockRequest.body = {
                nombre: 'John Updated'
            };

            mockUsuarioInstance.obtenerPorId.mockResolvedValue(null);

            await usuarioController.actualizar(mockRequest, mockResponse);

            expect(mockResponse.status).toHaveBeenCalledWith(404);
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: false,
                message: 'Usuario no encontrado'
            });
        });
    });

    describe('eliminar', () => {
        test('should delete user successfully', async () => {
            mockRequest.params.id = '1';
            mockUsuarioInstance.obtenerPorId.mockResolvedValue({ id: 1 });
            mockUsuarioInstance.eliminar.mockResolvedValue(true);

            await usuarioController.eliminar(mockRequest, mockResponse);

            expect(mockResponse.json).toHaveBeenCalledWith({
                success: true,
                message: 'Usuario eliminado exitosamente'
            });
        });

        test('should return 404 if user not found for deletion', async () => {
            mockRequest.params.id = '999';
            mockUsuarioInstance.obtenerPorId.mockResolvedValue(null);

            await usuarioController.eliminar(mockRequest, mockResponse);

            expect(mockResponse.status).toHaveBeenCalledWith(404);
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: false,
                message: 'Usuario no encontrado'
            });
        });

        test('should handle deletion errors', async () => {
            mockRequest.params.id = '1';
            mockUsuarioInstance.obtenerPorId.mockRejectedValue(new Error('Database error'));

            await usuarioController.eliminar(mockRequest, mockResponse);

            expect(mockResponse.status).toHaveBeenCalledWith(500);
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: false,
                message: 'Error interno del servidor',
                error: 'Database error'
            });
        });
    });

    describe('login', () => {
        test('should handle login with invalid credentials', async () => {
            mockRequest.body = {
                email: 'user@test.com',
                password: 'wrongpassword'
            };
            mockUsuarioInstance.obtenerPorEmail.mockResolvedValue(null);

            await usuarioController.login(mockRequest, mockResponse);

            expect(mockResponse.status).toHaveBeenCalledWith(401);
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: false,
                message: 'Credenciales inválidas'
            });
        });

        test('should handle login errors', async () => {
            mockRequest.body = {
                email: 'user@test.com',
                password: 'password'
            };
            mockUsuarioInstance.login.mockRejectedValue(new Error('Database error'));

            await usuarioController.login(mockRequest, mockResponse);

            expect(mockResponse.status).toHaveBeenCalledWith(500);
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: false,
                message: 'Error interno del servidor',
                error: 'Database error'
            });
        });
    });

    describe('register', () => {
        test('should handle registration errors', async () => {
            mockRequest.body = {
                nombre: 'John Doe',
                email: 'john@test.com',
                password: 'password123'
            };
            mockUsuarioInstance.crear.mockRejectedValue(new Error('Database error'));

            await usuarioController.register(mockRequest, mockResponse);

            expect(mockResponse.status).toHaveBeenCalledWith(500);
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: false,
                message: 'Error interno del servidor',
                error: 'Database error'
            });
        });
    });

    describe('obtenerPorId', () => {
        test('should handle errors in obtenerPorId', async () => {
            mockRequest.params.id = '1';
            mockUsuarioInstance.obtenerPorId.mockRejectedValue(new Error('Database error'));

            await usuarioController.obtenerPorId(mockRequest, mockResponse);

            expect(mockResponse.status).toHaveBeenCalledWith(500);
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: false,
                message: 'Error interno del servidor',
                error: 'Database error'
            });
        });
    });

    describe('actualizar', () => {
        test('should handle update errors', async () => {
            mockRequest.params.id = '1';
            mockRequest.body = {
                nombre: 'John Updated'
            };
            mockUsuarioInstance.actualizar.mockRejectedValue(new Error('Database error'));

            await usuarioController.actualizar(mockRequest, mockResponse);

            expect(mockResponse.status).toHaveBeenCalledWith(500);
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: false,
                message: 'Error interno del servidor',
                error: 'Database error'
            });
        });
    });
});
