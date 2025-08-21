const UsuarioController = require('../../src/controllers/UsuarioController');
const Usuario = require('../../src/models/Usuario');

jest.mock('../../src/models/Usuario');

describe('UsuarioController', () => {
    let mockUsuarioInstance;
    let usuarioController;
    let mockRequest;
    let mockResponse;

    beforeEach(() => {
        mockUsuarioInstance = {
            obtenerTodos: jest.fn(),
            obtenerPorId: jest.fn(),
            crear: jest.fn(),
            actualizar: jest.fn(),
            eliminar: jest.fn(),
            login: jest.fn(),
            obtenerPorEmail: jest.fn()
        };

        Usuario.mockImplementation(() => mockUsuarioInstance);
        usuarioController = new UsuarioController();

        mockRequest = {
            params: {},
            body: {},
            query: {}
        };

        mockResponse = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };

        jest.clearAllMocks();
    });

    describe('obtenerTodos', () => {
        test('should return all users successfully', async () => {
            const mockUsers = [{ id: 1, nombre: 'Usuario Test' }];
            mockUsuarioInstance.obtenerTodos.mockResolvedValue(mockUsers);

            await usuarioController.obtenerTodos(mockRequest, mockResponse);

            expect(mockResponse.json).toHaveBeenCalledWith({
                success: true,
                usuarios: mockUsers
            });
        });

        test('should handle errors', async () => {
            mockUsuarioInstance.obtenerTodos.mockRejectedValue(new Error('Database error'));

            await usuarioController.obtenerTodos(mockRequest, mockResponse);

            expect(mockResponse.status).toHaveBeenCalledWith(500);
        });
    });

    describe('obtenerPorId', () => {
        test('should return user by id successfully', async () => {
            const mockUsuario = { id: 1, nombre: 'Usuario Test', email: 'test@test.com' };
            mockRequest.params.id = '1';
            mockUsuarioInstance.obtenerPorId.mockResolvedValue(mockUsuario);

            await usuarioController.obtenerPorId(mockRequest, mockResponse);

            expect(mockUsuarioInstance.obtenerPorId).toHaveBeenCalledWith('1');
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: true,
                usuario: mockUsuario
            });
        });

        test('should return 404 when user not found', async () => {
            mockRequest.params.id = '999';
            mockUsuarioInstance.obtenerPorId.mockResolvedValue(null);

            await usuarioController.obtenerPorId(mockRequest, mockResponse);

            expect(mockResponse.status).toHaveBeenCalledWith(404);
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: false,
                message: 'Usuario no encontrado'
            });
        });

        test('should handle invalid id format', async () => {
            mockRequest.params.id = 'invalid';

            await usuarioController.obtenerPorId(mockRequest, mockResponse);

            expect(mockResponse.status).toHaveBeenCalledWith(404);
        });

        test('should handle database errors', async () => {
            mockRequest.params.id = '1';
            mockUsuarioInstance.obtenerPorId.mockRejectedValue(new Error('Database error'));

            await usuarioController.obtenerPorId(mockRequest, mockResponse);

            expect(mockResponse.status).toHaveBeenCalledWith(500);
        });
    });

    describe('registrar', () => {
        test('should create user successfully', async () => {
            const nuevoUsuario = {
                nombre: 'Nuevo Usuario',
                email: 'nuevo@test.com',
                password: 'password123',
                telefono: '1234567890',
                direccion: 'Dirección Test'
            };
            const usuarioCreado = { id: 1, ...nuevoUsuario };
            
            mockRequest.body = nuevoUsuario;
            mockUsuarioInstance.obtenerPorEmail.mockResolvedValue(null);
            mockUsuarioInstance.crear.mockResolvedValue(usuarioCreado);

            await usuarioController.registrar(mockRequest, mockResponse);

            expect(mockResponse.status).toHaveBeenCalledWith(201);
            expect(mockResponse.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: true,
                    message: 'Usuario registrado exitosamente',
                    usuario: usuarioCreado,
                    token: expect.any(String)
                })
            );
        });

        test('should handle missing required fields', async () => {
            mockRequest.body = { nombre: 'Usuario Incompleto' };

            await usuarioController.registrar(mockRequest, mockResponse);

            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: false,
                message: 'Nombre, email y contraseña son campos obligatorios'
            });
        });

        test('should handle invalid email format', async () => {
            mockRequest.body = {
                nombre: 'Usuario',
                email: 'email-invalido',
                password: 'password123',
                telefono: '1234567890',
                direccion: 'Dirección'
            };

            await usuarioController.registrar(mockRequest, mockResponse);

            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: false,
                message: 'Formato de email inválido'
            });
        });

        test('should handle short password', async () => {
            mockRequest.body = {
                nombre: 'Usuario',
                email: 'test@test.com',
                password: '123',
                telefono: '1234567890',
                direccion: 'Dirección'
            };

            await usuarioController.registrar(mockRequest, mockResponse);

            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: false,
                message: 'La contraseña debe tener al menos 6 caracteres'
            });
        });

        test('should handle duplicate email error', async () => {
            const nuevoUsuario = {
                nombre: 'Usuario',
                email: 'existente@test.com',
                password: 'password123',
                telefono: '1234567890',
                direccion: 'Dirección'
            };
            mockRequest.body = nuevoUsuario;
            mockUsuarioInstance.obtenerPorEmail.mockResolvedValue({ id: 1, email: 'existente@test.com' });

            await usuarioController.registrar(mockRequest, mockResponse);

            expect(mockResponse.status).toHaveBeenCalledWith(409);
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: false,
                message: 'El email ya está registrado'
            });
        });

        test('should handle database errors', async () => {
            const nuevoUsuario = {
                nombre: 'Usuario',
                email: 'test@test.com',
                password: 'password123',
                telefono: '1234567890',
                direccion: 'Dirección'
            };
            mockRequest.body = nuevoUsuario;
            mockUsuarioInstance.obtenerPorEmail.mockRejectedValue(new Error('Database error'));

            await usuarioController.registrar(mockRequest, mockResponse);

            expect(mockResponse.status).toHaveBeenCalledWith(500);
        });
    });

    describe('actualizar', () => {
        test('should update user successfully', async () => {
            const usuarioExistente = { id: 1, nombre: 'Usuario Existente' };
            const datosActualizacion = {
                nombre: 'Usuario Actualizado',
                telefono: '9876543210'
            };
            const usuarioActualizado = { id: 1, ...datosActualizacion };
            
            mockRequest.params.id = '1';
            mockRequest.body = datosActualizacion;
            mockUsuarioInstance.obtenerPorId.mockResolvedValue(usuarioExistente);
            mockUsuarioInstance.actualizar.mockResolvedValue(usuarioActualizado);

            await usuarioController.actualizar(mockRequest, mockResponse);

            expect(mockUsuarioInstance.obtenerPorId).toHaveBeenCalledWith('1');
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: true,
                message: 'Usuario actualizado exitosamente',
                usuario: usuarioActualizado
            });
        });

        test('should return 404 when updating non-existent user', async () => {
            mockRequest.params.id = '999';
            mockRequest.body = { nombre: 'Usuario' };
            mockUsuarioInstance.obtenerPorId.mockResolvedValue(null);

            await usuarioController.actualizar(mockRequest, mockResponse);

            expect(mockResponse.status).toHaveBeenCalledWith(404);
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: false,
                message: 'Usuario no encontrado'
            });
        });

        test('should handle database errors', async () => {
            mockRequest.params.id = '1';
            mockRequest.body = { nombre: 'Usuario' };
            mockUsuarioInstance.obtenerPorId.mockRejectedValue(new Error('Database error'));

            await usuarioController.actualizar(mockRequest, mockResponse);

            expect(mockResponse.status).toHaveBeenCalledWith(500);
        });
    });

    describe('eliminar', () => {
        test('should delete user successfully', async () => {
            const usuarioExistente = { id: 1, nombre: 'Usuario Test' };
            mockRequest.params.id = '1';
            mockUsuarioInstance.obtenerPorId.mockResolvedValue(usuarioExistente);
            mockUsuarioInstance.eliminar.mockResolvedValue(true);

            await usuarioController.eliminar(mockRequest, mockResponse);

            expect(mockUsuarioInstance.obtenerPorId).toHaveBeenCalledWith('1');
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: true,
                message: 'Usuario eliminado exitosamente'
            });
        });

        test('should return 404 when deleting non-existent user', async () => {
            mockRequest.params.id = '999';
            mockUsuarioInstance.obtenerPorId.mockResolvedValue(null);

            await usuarioController.eliminar(mockRequest, mockResponse);

            expect(mockResponse.status).toHaveBeenCalledWith(404);
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: false,
                message: 'Usuario no encontrado'
            });
        });

        test('should handle database errors', async () => {
            mockRequest.params.id = '1';
            mockUsuarioInstance.obtenerPorId.mockRejectedValue(new Error('Database error'));

            await usuarioController.eliminar(mockRequest, mockResponse);

            expect(mockResponse.status).toHaveBeenCalledWith(500);
        });
    });

    describe('login', () => {
        test('should login user successfully', async () => {
            const loginData = { email: 'test@test.com', password: 'password123' };
            const mockResult = { id: 1, email: 'test@test.com', nombre: 'Usuario Test' };
            
            mockRequest.body = loginData;
            mockUsuarioInstance.login.mockResolvedValue(mockResult);

            await usuarioController.login(mockRequest, mockResponse);

            expect(mockUsuarioInstance.login).toHaveBeenCalledWith(loginData.email, loginData.password);
            expect(mockResponse.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: true,
                    message: 'Login exitoso',
                    usuario: mockResult,
                    token: expect.any(String)
                })
            );
        });

        test('should handle missing email or password', async () => {
            mockRequest.body = { email: 'test@test.com' };

            await usuarioController.login(mockRequest, mockResponse);

            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: false,
                message: 'Email y contraseña son obligatorios'
            });
        });

        test('should handle invalid credentials', async () => {
            mockRequest.body = { email: 'test@test.com', password: 'wrongpassword' };
            mockUsuarioInstance.login.mockResolvedValue(null);

            await usuarioController.login(mockRequest, mockResponse);

            expect(mockResponse.status).toHaveBeenCalledWith(401);
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: false,
                message: 'Credenciales inválidas'
            });
        });

        test('should handle database errors', async () => {
            mockRequest.body = { email: 'test@test.com', password: 'password123' };
            mockUsuarioInstance.login.mockRejectedValue(new Error('Database error'));

            await usuarioController.login(mockRequest, mockResponse);

            expect(mockResponse.status).toHaveBeenCalledWith(500);
        });
    });
});