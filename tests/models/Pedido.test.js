const Pedido = require('../../src/models/Pedido');

// Mock de la base de datos
jest.mock('../../src/config/database');

describe('Pedido Model', () => {
    let pedidoModel;
    let mockPool;
    let mockConnection;

    beforeEach(() => {
        // Resetear mocks
        jest.clearAllMocks();

        // Crear mock de conexión individual
        mockConnection = {
            execute: jest.fn(),
            beginTransaction: jest.fn(),
            commit: jest.fn(),
            rollback: jest.fn(),
            release: jest.fn()
        };

        // Crear mock del pool de conexiones
        mockPool = {
            execute: jest.fn(),
            getConnection: jest.fn().mockResolvedValue(mockConnection),
            close: jest.fn()
        };

        // Mock del constructor de Database
        const Database = require('../../src/config/database');
        Database.mockImplementation(() => ({
            createPool: jest.fn().mockResolvedValue(true),
            getPool: jest.fn().mockReturnValue(mockPool)
        }));

        pedidoModel = new Pedido();
    });

    describe('obtenerTodos', () => {
        test('should return all orders with user information', async() => {
            const mockPedidos = [
                {
                    id: 1,
                    usuario_id: 1,
                    producto_id: 1,
                    nombre_producto: 'Test Product',
                    categoria_producto: 'Electronics',
                    cantidad: 2,
                    estado: 'pendiente',
                    creacion: '2024-01-01',
                    nombre_usuario: 'John',
                    email: 'john@test.com'
                }
            ];

            mockPool.execute.mockResolvedValue([mockPedidos]);

            const result = await pedidoModel.obtenerTodos();

            expect(mockPool.execute).toHaveBeenCalledWith(
                expect.stringContaining('LEFT JOIN usuarios u ON p.usuario_id = u.id')
            );
            expect(result).toHaveLength(1);
            expect(result[0].nombre_usuario).toBe('John');
            expect(result[0].email).toBe('john@test.com');
        });

        test('should handle database errors', async() => {
            mockPool.execute.mockRejectedValue(new Error('Database error'));

            await expect(pedidoModel.obtenerTodos()).rejects.toThrow('Database error');
        });
    });

    describe('obtenerPorId', () => {
        test('should return order by id with user information', async() => {
            const mockPedido = [{
                id: 1,
                usuario_id: 1,
                producto_id: 1,
                nombre_producto: 'Test Product',
                categoria_producto: 'Electronics',
                cantidad: 2,
                estado: 'pendiente',
                creacion: '2024-01-01',
                nombre_usuario: 'John',
                email: 'john@test.com'
            }];

            mockPool.execute.mockResolvedValue([mockPedido]);

            const result = await pedidoModel.obtenerPorId(1);

            expect(mockPool.execute).toHaveBeenCalledWith(
                expect.stringContaining('WHERE p.id = ?'),
                [1]
            );
            expect(result).toBeDefined();
            expect(result.id).toBe(1);
            expect(result.nombre_usuario).toBe('John');
        });

        test('should return null if order not found', async() => {
            mockPool.execute.mockResolvedValue([[]]);

            const result = await pedidoModel.obtenerPorId(999);

            expect(result).toBeNull();
        });
    });

    describe('obtenerPorUsuario', () => {
        test('should return orders by user id', async() => {
            const mockPedidos = [
                {
                    id: 1,
                    usuario_id: 1,
                    producto_id: 1,
                    nombre_producto: 'Product 1',
                    categoria_producto: 'Electronics',
                    cantidad: 1,
                    estado: 'pendiente',
                    creacion: '2024-01-01'
                },
                {
                    id: 2,
                    usuario_id: 1,
                    producto_id: 2,
                    nombre_producto: 'Product 2',
                    categoria_producto: 'Books',
                    cantidad: 2,
                    estado: 'enviado',
                    creacion: '2024-01-02'
                }
            ];

            mockPool.execute.mockResolvedValue([mockPedidos]);

            const result = await pedidoModel.obtenerPorUsuario(1);

            expect(mockPool.execute).toHaveBeenCalledWith(
                expect.stringContaining('WHERE usuario_id = ?'),
                [1]
            );
            expect(result).toHaveLength(2);
            expect(result[0].usuario_id).toBe(1);
            expect(result[1].usuario_id).toBe(1);
        });
    });

    describe('crear', () => {
        test('should create new order', async() => {
            const nuevoPedido = {
                usuario_id: 1,
                producto_id: 1,
                nombre_producto: 'Test Product',
                categoria_producto: 'Electronics',
                cantidad: 2,
                estado: 'pendiente'
            };

            mockPool.execute.mockResolvedValue([{ insertId: 1 }]);

            const result = await pedidoModel.crear(nuevoPedido);

            expect(mockPool.execute).toHaveBeenCalledWith(
                expect.stringContaining('INSERT INTO pedidos'),
                expect.arrayContaining([
                    nuevoPedido.usuario_id,
                    nuevoPedido.producto_id,
                    nuevoPedido.nombre_producto,
                    nuevoPedido.categoria_producto,
                    nuevoPedido.cantidad,
                    nuevoPedido.estado
                ])
            );
            expect(result.id).toBe(1);
            expect(result.usuario_id).toBe(nuevoPedido.usuario_id);
        });

        test('should create order with default pending status', async() => {
            const nuevoPedido = {
                usuario_id: 1,
                producto_id: 1,
                nombre_producto: 'Test Product',
                categoria_producto: 'Electronics',
                cantidad: 2
            };

            mockPool.execute.mockResolvedValue([{ insertId: 1 }]);

            await pedidoModel.crear(nuevoPedido);

            expect(mockPool.execute).toHaveBeenCalledWith(
                expect.anything(),
                expect.arrayContaining(['pendiente'])
            );
        });
    });

    describe('crearMultiples', () => {
        test('should create multiple orders in transaction', async() => {
            const pedidos = [
                {
                    usuario_id: 1,
                    producto_id: 1,
                    nombre_producto: 'Product 1',
                    categoria_producto: 'Electronics',
                    cantidad: 1
                },
                {
                    usuario_id: 1,
                    producto_id: 2,
                    nombre_producto: 'Product 2',
                    categoria_producto: 'Books',
                    cantidad: 2
                }
            ];

            mockConnection.execute
                .mockResolvedValueOnce([{ insertId: 1 }])
                .mockResolvedValueOnce([{ insertId: 2 }]);

            const result = await pedidoModel.crearMultiples(pedidos);

            expect(mockConnection.beginTransaction).toHaveBeenCalled();
            expect(mockConnection.execute).toHaveBeenCalledTimes(2);
            expect(mockConnection.commit).toHaveBeenCalled();
            expect(mockConnection.release).toHaveBeenCalled();
            expect(result).toHaveLength(2);
            expect(result[0].id).toBe(1);
            expect(result[1].id).toBe(2);
        });

        test('should rollback transaction on error', async() => {
            const pedidos = [
                {
                    usuario_id: 1,
                    producto_id: 1,
                    nombre_producto: 'Product 1',
                    categoria_producto: 'Electronics',
                    cantidad: 1
                }
            ];

            mockConnection.execute.mockRejectedValue(new Error('Database error'));

            await expect(pedidoModel.crearMultiples(pedidos))
                .rejects.toThrow('Database error');

            expect(mockConnection.beginTransaction).toHaveBeenCalled();
            expect(mockConnection.rollback).toHaveBeenCalled();
            expect(mockConnection.release).toHaveBeenCalled();
        });
    });

    describe('actualizarEstado', () => {
        test('should update order status', async() => {
            const estadosValidos = ['pendiente', 'enviado', 'entregado', 'cancelado'];
            
            for (const estado of estadosValidos) {
                mockPool.execute
                    .mockResolvedValueOnce([{ affectedRows: 1 }])
                    .mockResolvedValueOnce([[{
                        id: 1,
                        usuario_id: 1,
                        estado: estado,
                        nombre_usuario: 'John',
                        email: 'john@test.com'
                    }]]);

                const result = await pedidoModel.actualizarEstado(1, estado);

                expect(result).toBeDefined();
                expect(result.estado).toBe(estado);
            }
        });

        test('should throw error for invalid status', async() => {
            await expect(pedidoModel.actualizarEstado(1, 'invalid_status'))
                .rejects.toThrow('Estado no válido');
        });

        test('should throw error if order not found', async() => {
            mockPool.execute.mockResolvedValue([{ affectedRows: 0 }]);

            await expect(pedidoModel.actualizarEstado(999, 'enviado'))
                .rejects.toThrow('Pedido no encontrado');
        });
    });

    describe('eliminar', () => {
        test('should delete order successfully', async() => {
            mockPool.execute.mockResolvedValue([{ affectedRows: 1 }]);

            const result = await pedidoModel.eliminar(1);

            expect(mockPool.execute).toHaveBeenCalledWith(
                'DELETE FROM pedidos WHERE id = ?',
                [1]
            );
            expect(result).toBe(true);
        });

        test('should return false if order not found', async() => {
            mockPool.execute.mockResolvedValue([{ affectedRows: 0 }]);

            const result = await pedidoModel.eliminar(999);

            expect(result).toBe(false);
        });
    });

    describe('obtenerEstadisticas', () => {
        test('should return order statistics', async() => {
            const mockEstadisticas = [
                {
                    estado: 'pendiente',
                    cantidad: 5,
                    total_productos: 10
                },
                {
                    estado: 'enviado',
                    cantidad: 3,
                    total_productos: 8
                },
                {
                    estado: 'entregado',
                    cantidad: 2,
                    total_productos: 4
                }
            ];

            mockPool.execute.mockResolvedValue([mockEstadisticas]);

            const result = await pedidoModel.obtenerEstadisticas();

            expect(mockPool.execute).toHaveBeenCalledWith(
                expect.stringContaining('GROUP BY estado')
            );
            expect(result).toHaveLength(3);
            expect(result[0].estado).toBe('pendiente');
            expect(result[0].cantidad).toBe(5);
        });
    });
});
