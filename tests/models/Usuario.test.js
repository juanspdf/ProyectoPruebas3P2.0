const Usuario = require('../../src/models/Usuario');

// Mock de la base de datos
jest.mock('../../src/config/database');

describe('Usuario Model', () => {
    let usuarioModel;
    let mockPool;

    beforeEach(() => {
        // Resetear mocks
        jest.clearAllMocks();

        // Crear mock del pool de conexiones
        mockPool = {
            execute: jest.fn(),
            getConnection: jest.fn(),
            close: jest.fn()
        };

        // Mock del constructor de Database
        const Database = require('../../src/config/database');
        Database.mockImplementation(() => ({
            createPool: jest.fn().mockResolvedValue(true),
            getPool: jest.fn().mockReturnValue(mockPool)
        }));

        usuarioModel = new Usuario();
    });

    describe('obtenerTodos', () => {
        test('should return all users', async() => {
            const mockUsuarios = [
                {
                    id: 1,
                    nombre: 'John',
                    apellido: 'Doe',
                    correo: 'john@test.com',
                    contrasena: 'password123',
                    creacion: '2024-01-01'
                },
                {
                    id: 2,
                    nombre: 'Jane',
                    apellido: 'Smith',
                    correo: 'jane@test.com',
                    contrasena: 'password456',
                    creacion: '2024-01-02'
                }
            ];

            mockPool.execute.mockResolvedValue([mockUsuarios]);

            const result = await usuarioModel.obtenerTodos();

            expect(mockPool.execute).toHaveBeenCalledWith('SELECT * FROM usuarios');
            expect(result).toHaveLength(2);
            expect(result[0].nombre).toBe('John');
            expect(result[1].nombre).toBe('Jane');
        });

        test('should handle database errors', async() => {
            mockPool.execute.mockRejectedValue(new Error('Database error'));

            await expect(usuarioModel.obtenerTodos()).rejects.toThrow('Database error');
        });
    });

    describe('obtenerPorId', () => {
        test('should return user by id', async() => {
            const mockUsuario = [{
                id: 1,
                nombre: 'John',
                apellido: 'Doe',
                correo: 'john@test.com',
                contrasena: 'password123',
                creacion: '2024-01-01'
            }];

            mockPool.execute.mockResolvedValue([mockUsuario]);

            const result = await usuarioModel.obtenerPorId(1);

            expect(mockPool.execute).toHaveBeenCalledWith(
                'SELECT * FROM usuarios WHERE id = ?',
                [1]
            );
            expect(result).toBeDefined();
            expect(result.id).toBe(1);
            expect(result.nombre).toBe('John');
        });

        test('should return null if user not found', async() => {
            mockPool.execute.mockResolvedValue([[]]);

            const result = await usuarioModel.obtenerPorId(999);

            expect(result).toBeNull();
        });
    });

    describe('obtenerPorEmail', () => {
        test('should return user by email', async() => {
            const mockUsuario = [{
                id: 1,
                nombre: 'John',
                apellido: 'Doe',
                correo: 'john@test.com',
                contrasena: 'password123',
                creacion: '2024-01-01'
            }];

            mockPool.execute.mockResolvedValue([mockUsuario]);

            const result = await usuarioModel.obtenerPorEmail('john@test.com');

            expect(mockPool.execute).toHaveBeenCalledWith(
                'SELECT * FROM usuarios WHERE correo = ?',
                ['john@test.com']
            );
            expect(result).toBeDefined();
            expect(result.correo).toBe('john@test.com');
        });

        test('should return null if user not found', async() => {
            mockPool.execute.mockResolvedValue([[]]);

            const result = await usuarioModel.obtenerPorEmail('notfound@test.com');

            expect(result).toBeNull();
        });
    });

    describe('login', () => {
        test('should return user with valid credentials', async() => {
            const mockUsuario = [{
                id: 1,
                nombre: 'John',
                apellido: 'Doe',
                correo: 'john@test.com',
                contrasena: 'password123',
                creacion: '2024-01-01'
            }];

            mockPool.execute.mockResolvedValue([mockUsuario]);

            const result = await usuarioModel.login('john@test.com', 'password123');

            expect(mockPool.execute).toHaveBeenCalledWith(
                'SELECT * FROM usuarios WHERE correo = ? AND contrasena = ?',
                ['john@test.com', 'password123']
            );
            expect(result).toBeDefined();
            expect(result.correo).toBe('john@test.com');
        });

        test('should return null with invalid credentials', async() => {
            mockPool.execute.mockResolvedValue([[]]);

            const result = await usuarioModel.login('john@test.com', 'wrongpassword');

            expect(result).toBeNull();
        });
    });

    describe('crear', () => {
        test('should create new user', async() => {
            const nuevoUsuario = {
                nombre: 'New',
                apellido: 'User',
                correo: 'new@test.com',
                contrasena: 'password123'
            };

            // Mock para verificar que el usuario no existe
            mockPool.execute.mockResolvedValueOnce([[]]);
            // Mock para crear el usuario
            mockPool.execute.mockResolvedValueOnce([{ insertId: 1 }]);

            const result = await usuarioModel.crear(nuevoUsuario);

            expect(result.id).toBe(1);
            expect(result.nombre).toBe(nuevoUsuario.nombre);
            expect(result.correo).toBe(nuevoUsuario.correo);
            expect(result.contrasena).toBeUndefined(); // No debe devolver la contraseña
        });

        test('should throw error if user already exists', async() => {
            const nuevoUsuario = {
                nombre: 'Existing',
                apellido: 'User',
                correo: 'existing@test.com',
                contrasena: 'password123'
            };

            // Mock para simular que el usuario ya existe
            mockPool.execute.mockResolvedValue([[{
                id: 1,
                correo: 'existing@test.com'
            }]]);

            await expect(usuarioModel.crear(nuevoUsuario))
                .rejects.toThrow('El correo ya está registrado');
        });
    });

    describe('actualizar', () => {
        test('should update existing user', async() => {
            const usuarioActualizado = {
                nombre: 'Updated',
                apellido: 'User',
                correo: 'updated@test.com'
            };

            // Mock para la actualización
            mockPool.execute.mockResolvedValueOnce([{ affectedRows: 1 }]);
            // Mock para obtener el usuario actualizado
            mockPool.execute.mockResolvedValueOnce([[{
                id: 1,
                ...usuarioActualizado,
                contrasena: 'password123',
                creacion: '2024-01-01'
            }]]);

            const result = await usuarioModel.actualizar(1, usuarioActualizado);

            expect(result).toBeDefined();
            expect(result.id).toBe(1);
            expect(result.nombre).toBe(usuarioActualizado.nombre);
        });

        test('should update user with password', async() => {
            const usuarioActualizado = {
                nombre: 'Updated',
                apellido: 'User',
                correo: 'updated@test.com',
                contrasena: 'newpassword'
            };

            // Mock para la actualización
            mockPool.execute.mockResolvedValueOnce([{ affectedRows: 1 }]);
            // Mock para obtener el usuario actualizado
            mockPool.execute.mockResolvedValueOnce([[{
                id: 1,
                ...usuarioActualizado,
                creacion: '2024-01-01'
            }]]);

            const result = await usuarioModel.actualizar(1, usuarioActualizado);

            expect(mockPool.execute).toHaveBeenCalledWith(
                expect.stringContaining('contrasena = ?'),
                expect.arrayContaining(['newpassword'])
            );
        });

        test('should throw error if user not found', async() => {
            const usuarioActualizado = {
                nombre: 'Updated',
                apellido: 'User',
                correo: 'updated@test.com'
            };

            mockPool.execute.mockResolvedValue([{ affectedRows: 0 }]);

            await expect(usuarioModel.actualizar(999, usuarioActualizado))
                .rejects.toThrow('Usuario no encontrado');
        });
    });

    describe('eliminar', () => {
        test('should delete user successfully', async() => {
            mockPool.execute.mockResolvedValue([{ affectedRows: 1 }]);

            const result = await usuarioModel.eliminar(1);

            expect(mockPool.execute).toHaveBeenCalledWith(
                'DELETE FROM usuarios WHERE id = ?',
                [1]
            );
            expect(result).toBe(true);
        });

        test('should return false if user not found', async() => {
            mockPool.execute.mockResolvedValue([{ affectedRows: 0 }]);

            const result = await usuarioModel.eliminar(999);

            expect(result).toBe(false);
        });
    });
});
