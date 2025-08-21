const PedidoController = require('../../src/controllers/PedidoController');
const Pedido = require('../../src/models/Pedido');
const Producto = require('../../src/models/Producto');

// Mock de los modelos
jest.mock('../../src/models/Pedido');
jest.mock('../../src/models/Producto');

describe('PedidoController', () => {
    let pedidoController;
    let mockRequest;
    let mockResponse;
    let mockPedidoInstance;
    let mockProductoInstance;

    beforeEach(() => {
        // Crear mocks de las instancias de los modelos
        mockPedidoInstance = {
            obtenerTodos: jest.fn(),
            obtenerPorId: jest.fn(),
            obtenerPorUsuario: jest.fn(),
            crear: jest.fn(),
            crearMultiples: jest.fn(),
            actualizarEstado: jest.fn(),
            eliminar: jest.fn(),
            obtenerEstadisticas: jest.fn()
        };

        mockProductoInstance = {
            obtenerPorId: jest.fn()
        };

        // Mock de los constructores de las clases
        Pedido.mockImplementation(() => mockPedidoInstance);
        Producto.mockImplementation(() => mockProductoInstance);
        
        // Crear una nueva instancia del controlador para cada test
        pedidoController = new PedidoController();
        
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
        test('should return all orders successfully', async () => {
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

            mockPedidoInstance.obtenerTodos.mockResolvedValue(mockPedidos);

            await pedidoController.obtenerTodos(mockRequest, mockResponse);

            expect(mockResponse.json).toHaveBeenCalledWith({
                success: true,
                pedidos: mockPedidos
            });
        });

        test('should handle database errors', async () => {
            mockPedidoInstance.obtenerTodos.mockRejectedValue(new Error('Database error'));

            await pedidoController.obtenerTodos(mockRequest, mockResponse);

            expect(mockResponse.status).toHaveBeenCalledWith(500);
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: false,
                message: 'Error interno del servidor',
                error: 'Database error'
            });
        });
    });

    describe('obtenerPorId', () => {
        test('should return order by id', async () => {
            const mockPedido = {
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
            };

            mockRequest.params.id = '1';
            mockPedidoInstance.obtenerPorId.mockResolvedValue(mockPedido);

            await pedidoController.obtenerPorId(mockRequest, mockResponse);

            expect(mockResponse.json).toHaveBeenCalledWith({
                success: true,
                pedido: mockPedido
            });
        });

        test('should return 404 if order not found', async () => {
            mockRequest.params.id = '999';
            mockPedidoInstance.obtenerPorId.mockResolvedValue(null);

            await pedidoController.obtenerPorId(mockRequest, mockResponse);

            expect(mockResponse.status).toHaveBeenCalledWith(404);
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: false,
                message: 'Pedido no encontrado'
            });
        });
    });

    describe('obtenerPorUsuario', () => {
        test('should return orders by user id', async () => {
            const mockPedidos = [
                {
                    id: 1,
                    usuario_id: 1,
                    producto_id: 1,
                    nombre_producto: 'Product 1',
                    cantidad: 1,
                    estado: 'pendiente'
                },
                {
                    id: 2,
                    usuario_id: 1,
                    producto_id: 2,
                    nombre_producto: 'Product 2',
                    cantidad: 2,
                    estado: 'enviado'
                }
            ];

            mockRequest.params.usuarioId = '1';
            mockPedidoInstance.obtenerPorUsuario.mockResolvedValue(mockPedidos);

            await pedidoController.obtenerPorUsuario(mockRequest, mockResponse);

            expect(mockResponse.json).toHaveBeenCalledWith({
                success: true,
                pedidos: mockPedidos
            });
        });
    });

    describe('crear', () => {
        test('should create new order successfully', async () => {
            const mockCreatedOrder = {
                id: 1,
                usuario_id: 1,
                producto_id: 1,
                nombre_producto: 'Test Product',
                categoria_producto: 'Electronics',
                cantidad: 2,
                estado: 'pendiente'
            };

            const mockProducto = {
                id: 1,
                nombre: 'Test Product',
                categoria: 'Electronics',
                stock: 10
            };

            mockRequest.body = {
                usuario_id: 1,
                producto_id: 1,
                cantidad: 2
            };

            mockProductoInstance.obtenerPorId.mockResolvedValue(mockProducto);
            mockPedidoInstance.crear.mockResolvedValue(mockCreatedOrder);

            await pedidoController.crear(mockRequest, mockResponse);

            expect(mockResponse.status).toHaveBeenCalledWith(201);
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: true,
                message: 'Pedido creado exitosamente',
                pedido: mockCreatedOrder
            });
        });

        test('should validate required fields', async () => {
            mockRequest.body = {
                producto_id: 1
                // Falta usuario_id y cantidad
            };

            await pedidoController.crear(mockRequest, mockResponse);

            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: false,
                message: 'Usuario ID, Producto ID y cantidad son obligatorios'
            });
        });

        test('should validate positive quantity', async () => {
            mockRequest.body = {
                usuario_id: 1,
                producto_id: 1,
                cantidad: -1  // Cambiar a -1 para que pase la primera validación
            };

            await pedidoController.crear(mockRequest, mockResponse);

            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: false,
                message: 'La cantidad debe ser mayor a 0'
            });
        });

        test('should validate product exists', async () => {
            mockRequest.body = {
                usuario_id: 1,
                producto_id: 999,
                cantidad: 2
            };

            mockProductoInstance.obtenerPorId.mockResolvedValue(null);

            await pedidoController.crear(mockRequest, mockResponse);

            expect(mockResponse.status).toHaveBeenCalledWith(404);
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: false,
                message: 'Producto no encontrado'
            });
        });

        test('should validate stock availability', async () => {
            const mockProducto = {
                id: 1,
                nombre: 'Test Product',
                categoria: 'Electronics',
                stock: 1
            };

            mockRequest.body = {
                usuario_id: 1,
                producto_id: 1,
                cantidad: 5
            };

            mockProductoInstance.obtenerPorId.mockResolvedValue(mockProducto);

            await pedidoController.crear(mockRequest, mockResponse);

            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: false,
                message: 'Stock insuficiente. Disponible: 1'
            });
        });
    });

    describe('actualizarEstado', () => {
        test('should update order status successfully', async () => {
            const mockUpdatedOrder = {
                id: 1,
                usuario_id: 1,
                producto_id: 1,
                nombre_producto: 'Test Product',
                nombre_usuario: 'John',
                email: 'john@test.com',
                estado: 'enviado'
            };

            mockRequest.params.id = '1';
            mockRequest.body = { estado: 'enviado' };

            // Mockear que el pedido existe
            mockPedidoInstance.obtenerPorId.mockResolvedValue({ id: 1, estado: 'pendiente' });
            mockPedidoInstance.actualizarEstado.mockResolvedValue(mockUpdatedOrder);

            await pedidoController.actualizarEstado(mockRequest, mockResponse);

            expect(mockResponse.json).toHaveBeenCalledWith({
                success: true,
                message: 'Estado del pedido actualizado exitosamente',
                pedido: mockUpdatedOrder
            });
        });

        test('should validate estado field', async () => {
            mockRequest.params.id = '1';
            mockRequest.body = {}; // Sin estado

            await pedidoController.actualizarEstado(mockRequest, mockResponse);

            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: false,
                message: 'El estado es obligatorio'
            });
        });

        test('should handle invalid status error', async () => {
            mockRequest.params.id = '1';
            mockRequest.body = { estado: 'estado_invalido' };

            const error = new Error('Estado no válido. Estados permitidos: pendiente, enviado, entregado, cancelado');
            mockPedidoInstance.actualizarEstado.mockRejectedValue(error);

            await pedidoController.actualizarEstado(mockRequest, mockResponse);

            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: false,
                message: 'Estado no válido. Estados permitidos: pendiente, enviado, entregado, cancelado'
            });
        });
    });

    describe('eliminar', () => {
        test('should delete order successfully', async () => {
            mockRequest.params.id = '1';
            
            // Mockear que el pedido existe
            mockPedidoInstance.obtenerPorId.mockResolvedValue({ id: 1, estado: 'pendiente' });
            mockPedidoInstance.eliminar.mockResolvedValue(true);

            await pedidoController.eliminar(mockRequest, mockResponse);

            expect(mockResponse.json).toHaveBeenCalledWith({
                success: true,
                message: 'Pedido eliminado exitosamente'
            });
        });

        test('should return 404 if order not found for deletion', async () => {
            mockRequest.params.id = '999';
            mockPedidoInstance.eliminar.mockResolvedValue(false);

            await pedidoController.eliminar(mockRequest, mockResponse);

            expect(mockResponse.status).toHaveBeenCalledWith(404);
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: false,
                message: 'Pedido no encontrado'
            });
        });
    });

    describe('crearCarrito', () => {
        test('should create multiple orders from cart successfully', async () => {
            const productos = [
                { producto_id: 1, cantidad: 2 },
                { producto_id: 2, cantidad: 1 }
            ];
            
            mockRequest.body = {
                usuario_id: 1,
                productos: productos
            };

            const mockProducto1 = { id: 1, nombre: 'Producto 1', categoria: 'Cat1', stock: 10 };
            const mockProducto2 = { id: 2, nombre: 'Producto 2', categoria: 'Cat2', stock: 5 };

            mockProductoInstance.obtenerPorId
                .mockResolvedValueOnce(mockProducto1)
                .mockResolvedValueOnce(mockProducto2);

            const mockPedidosCreados = [
                { id: 1, usuario_id: 1, producto_id: 1, cantidad: 2 },
                { id: 2, usuario_id: 1, producto_id: 2, cantidad: 1 }
            ];

            mockPedidoInstance.crearMultiples.mockResolvedValue(mockPedidosCreados);

            await pedidoController.crearCarrito(mockRequest, mockResponse);

            expect(mockResponse.status).toHaveBeenCalledWith(201);
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: true,
                message: 'Se crearon 2 pedidos exitosamente',
                pedidos: mockPedidosCreados,
                total_pedidos: 2
            });
        });

        test('should validate productos array', async () => {
            mockRequest.body = { usuario_id: 1, productos: [] };

            await pedidoController.crearCarrito(mockRequest, mockResponse);

            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: false,
                message: 'Los productos son obligatorios y deben ser un array no vacío'
            });
        });

        test('should handle insufficient stock', async () => {
            mockRequest.body = {
                usuario_id: 1,
                productos: [{ producto_id: 1, cantidad: 15 }]
            };

            const mockProducto = { id: 1, nombre: 'Producto 1', stock: 10 };
            mockProductoInstance.obtenerPorId.mockResolvedValue(mockProducto);

            await pedidoController.crearCarrito(mockRequest, mockResponse);

            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: false,
                message: 'Stock insuficiente para Producto 1. Disponible: 10, Solicitado: 15'
            });
        });

        test('should handle product not found', async () => {
            mockRequest.body = {
                usuario_id: 1,
                productos: [{ producto_id: 999, cantidad: 1 }]
            };

            mockProductoInstance.obtenerPorId.mockResolvedValue(null);

            await pedidoController.crearCarrito(mockRequest, mockResponse);

            expect(mockResponse.status).toHaveBeenCalledWith(404);
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: false,
                message: 'Producto con ID 999 no encontrado'
            });
        });
    });

    describe('cancelarPedidoUsuario', () => {
        test('should cancel user order successfully', async () => {
            mockRequest.params.id = '1';
            mockRequest.body = { estado: 'cancelado' };
            mockRequest.usuario = { id: 1 };

            const mockPedido = { id: 1, usuario_id: 1, estado: 'pendiente' };
            const mockUpdatedPedido = { ...mockPedido, estado: 'cancelado' };

            mockPedidoInstance.obtenerPorId.mockResolvedValue(mockPedido);
            mockPedidoInstance.actualizarEstado.mockResolvedValue(mockUpdatedPedido);

            await pedidoController.cancelarPedidoUsuario(mockRequest, mockResponse);

            expect(mockResponse.json).toHaveBeenCalledWith({
                success: true,
                message: 'Pedido cancelado exitosamente',
                pedido: mockUpdatedPedido
            });
        });

        test('should reject non-cancel operations', async () => {
            mockRequest.params.id = '1';
            mockRequest.body = { estado: 'enviado' };

            await pedidoController.cancelarPedidoUsuario(mockRequest, mockResponse);

            expect(mockResponse.status).toHaveBeenCalledWith(403);
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: false,
                message: 'Solo puedes cancelar tus pedidos'
            });
        });

        test('should reject canceling other users orders', async () => {
            mockRequest.params.id = '1';
            mockRequest.body = { estado: 'cancelado' };
            mockRequest.usuario = { id: 2 };

            const mockPedido = { id: 1, usuario_id: 1, estado: 'pendiente' };
            mockPedidoInstance.obtenerPorId.mockResolvedValue(mockPedido);

            await pedidoController.cancelarPedidoUsuario(mockRequest, mockResponse);

            expect(mockResponse.status).toHaveBeenCalledWith(403);
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: false,
                message: 'No tienes permisos para cancelar este pedido'
            });
        });

        test('should reject canceling non-pending orders', async () => {
            mockRequest.params.id = '1';
            mockRequest.body = { estado: 'cancelado' };
            mockRequest.usuario = { id: 1 };

            const mockPedido = { id: 1, usuario_id: 1, estado: 'enviado' };
            mockPedidoInstance.obtenerPorId.mockResolvedValue(mockPedido);

            await pedidoController.cancelarPedidoUsuario(mockRequest, mockResponse);

            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: false,
                message: 'Solo se pueden cancelar pedidos en estado pendiente'
            });
        });
    });

    describe('misPedidos', () => {
        test('should return user orders', async () => {
            mockRequest.usuario = { id: 1 };
            
            const mockPedidos = [
                { id: 1, usuario_id: 1, producto_id: 1, estado: 'pendiente' },
                { id: 2, usuario_id: 1, producto_id: 2, estado: 'enviado' }
            ];

            mockPedidoInstance.obtenerPorUsuario.mockResolvedValue(mockPedidos);

            await pedidoController.misPedidos(mockRequest, mockResponse);

            expect(mockResponse.json).toHaveBeenCalledWith({
                success: true,
                pedidos: mockPedidos
            });
        });

        test('should handle errors getting user orders', async () => {
            mockRequest.usuario = { id: 1 };
            mockPedidoInstance.obtenerPorUsuario.mockRejectedValue(new Error('Database error'));

            await pedidoController.misPedidos(mockRequest, mockResponse);

            expect(mockResponse.status).toHaveBeenCalledWith(500);
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: false,
                message: 'Error interno del servidor',
                error: 'Database error'
            });
        });
    });

    describe('obtenerEstadisticas', () => {
        test('should return order statistics', async () => {
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
                }
            ];

            mockPedidoInstance.obtenerEstadisticas.mockResolvedValue(mockEstadisticas);

            await pedidoController.obtenerEstadisticas(mockRequest, mockResponse);

            expect(mockResponse.json).toHaveBeenCalledWith({
                success: true,
                estadisticas: mockEstadisticas
            });
        });

        test('should handle statistics errors', async () => {
            mockPedidoInstance.obtenerEstadisticas.mockRejectedValue(new Error('Database error'));

            await pedidoController.obtenerEstadisticas(mockRequest, mockResponse);

            expect(mockResponse.status).toHaveBeenCalledWith(500);
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: false,
                message: 'Error interno del servidor',
                error: 'Database error'
            });
        });
    });

    describe('actualizarEstado - Additional tests', () => {
        test('should return 404 if order not found', async () => {
            mockRequest.params.id = '999';
            mockRequest.body = { estado: 'enviado' };

            mockPedidoInstance.obtenerPorId.mockResolvedValue(null);

            await pedidoController.actualizarEstado(mockRequest, mockResponse);

            expect(mockResponse.status).toHaveBeenCalledWith(404);
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: false,
                message: 'Pedido no encontrado'
            });
        });

        test('should handle all valid estados', async () => {
            const estadosValidos = ['pendiente', 'enviado', 'entregado', 'cancelado'];
            
            for (const estado of estadosValidos) {
                mockRequest.params.id = '1';
                mockRequest.body = { estado };

                const mockPedido = { id: 1, estado: 'pendiente' };
                const mockUpdatedPedido = { ...mockPedido, estado };

                mockPedidoInstance.obtenerPorId.mockResolvedValue(mockPedido);
                mockPedidoInstance.actualizarEstado.mockResolvedValue(mockUpdatedPedido);

                await pedidoController.actualizarEstado(mockRequest, mockResponse);

                expect(mockResponse.json).toHaveBeenCalledWith({
                    success: true,
                    message: 'Estado del pedido actualizado exitosamente',
                    pedido: mockUpdatedPedido
                });

                jest.clearAllMocks();
            }
        });
    });

    describe('eliminar - Additional tests', () => {
        test('should handle deletion failure', async () => {
            mockRequest.params.id = '1';
            
            const mockPedido = { id: 1, estado: 'pendiente' };
            mockPedidoInstance.obtenerPorId.mockResolvedValue(mockPedido);
            mockPedidoInstance.eliminar.mockResolvedValue(false);

            await pedidoController.eliminar(mockRequest, mockResponse);

            expect(mockResponse.status).toHaveBeenCalledWith(500);
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: false,
                message: 'No se pudo eliminar el pedido'
            });
        });

        test('should handle database errors during deletion', async () => {
            mockRequest.params.id = '1';
            mockPedidoInstance.obtenerPorId.mockRejectedValue(new Error('Database error'));

            await pedidoController.eliminar(mockRequest, mockResponse);

            expect(mockResponse.status).toHaveBeenCalledWith(500);
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: false,
                message: 'Error interno del servidor',
                error: 'Database error'
            });
        });
    });
});
