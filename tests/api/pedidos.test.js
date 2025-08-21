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
jest.mock('../../src/controllers/PedidoController');

describe('Pedidos API Routes', () => {
    let app;
    let mockPedidoController;
    let PedidoController;

    beforeAll(() => {
        // Configurar la aplicación de testing aislada
        app = express();
        app.use(express.json());
        
        // Importar el controlador mockeado
        PedidoController = require('../../src/controllers/PedidoController');
        
        // Configurar el mock del controlador
        mockPedidoController = {
            obtenerTodos: jest.fn(),
            obtenerPorId: jest.fn(),
            obtenerPorUsuario: jest.fn(),
            crear: jest.fn(),
            crearCarrito: jest.fn(),
            actualizarEstado: jest.fn(),
            eliminar: jest.fn(),
            obtenerEstadisticas: jest.fn(),
            misPedidos: jest.fn()
        };

        PedidoController.mockImplementation(() => mockPedidoController);
        
        // Importar las rutas DESPUÉS de configurar los mocks
        const pedidosRoutes = require('../../src/routes/pedidos');
        app.use('/api/pedidos', pedidosRoutes);
    });

    beforeEach(() => {
        jest.clearAllMocks();
    });

    afterAll(async () => {
        // Limpiar cualquier recurso si es necesario
        jest.resetModules();
    });

    describe('GET /api/pedidos (Admin only)', () => {
        test('should get all orders with admin auth', async () => {
            mockPedidoController.obtenerTodos.mockImplementation((req, res) => {
                res.json({
                    success: true,
                    pedidos: [
                        { id: 1, usuario_id: 1, producto_id: 1, cantidad: 2, estado: 'pendiente' },
                        { id: 2, usuario_id: 2, producto_id: 2, cantidad: 1, estado: 'enviado' }
                    ]
                });
            });

            const response = await request(app)
                .get('/api/pedidos')
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.pedidos).toHaveLength(2);
            expect(mockPedidoController.obtenerTodos).toHaveBeenCalled();
        });
    });

    describe('GET /api/pedidos/:id (Admin only)', () => {
        test('should get order by id with admin auth', async () => {
            mockPedidoController.obtenerPorId.mockImplementation((req, res) => {
                res.json({
                    success: true,
                    pedido: { id: 1, usuario_id: 1, producto_id: 1, cantidad: 2, estado: 'pendiente' }
                });
            });

            const response = await request(app)
                .get('/api/pedidos/1')
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.pedido.id).toBe(1);
            expect(mockPedidoController.obtenerPorId).toHaveBeenCalled();
        });

        test('should return 404 for non-existent order', async () => {
            mockPedidoController.obtenerPorId.mockImplementation((req, res) => {
                res.status(404).json({
                    success: false,
                    message: 'Pedido no encontrado'
                });
            });

            const response = await request(app)
                .get('/api/pedidos/999')
                .expect(404);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Pedido no encontrado');
        });
    });

    describe('POST /api/pedidos', () => {
        test('should create new order', async () => {
            mockPedidoController.crear.mockImplementation((req, res) => {
                res.status(201).json({
                    success: true,
                    message: 'Pedido creado exitosamente',
                    pedido: {
                        id: 1,
                        usuario_id: req.body.usuario_id,
                        producto_id: req.body.producto_id,
                        cantidad: req.body.cantidad,
                        estado: 'pendiente'
                    }
                });
            });

            const newOrder = {
                usuario_id: 1,
                producto_id: 1,
                cantidad: 2
            };

            const response = await request(app)
                .post('/api/pedidos')
                .send(newOrder)
                .expect(201);

            expect(response.body.success).toBe(true);
            expect(response.body.pedido.usuario_id).toBe(1);
            expect(response.body.pedido.cantidad).toBe(2);
            expect(mockPedidoController.crear).toHaveBeenCalled();
        });

        test('should validate required fields', async () => {
            mockPedidoController.crear.mockImplementation((req, res) => {
                res.status(400).json({
                    success: false,
                    message: 'Usuario ID, Producto ID y cantidad son obligatorios'
                });
            });

            const invalidOrder = {
                producto_id: 1
                // Falta usuario_id y cantidad
            };

            const response = await request(app)
                .post('/api/pedidos')
                .send(invalidOrder)
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Usuario ID, Producto ID y cantidad son obligatorios');
        });
    });

    describe('POST /api/pedidos/carrito', () => {
        test('should create cart with multiple products', async () => {
            mockPedidoController.crearCarrito.mockImplementation((req, res) => {
                res.status(201).json({
                    success: true,
                    message: 'Carrito creado exitosamente',
                    pedidos: [
                        { id: 1, usuario_id: 1, producto_id: 1, cantidad: 2, estado: 'pendiente' },
                        { id: 2, usuario_id: 1, producto_id: 2, cantidad: 1, estado: 'pendiente' }
                    ]
                });
            });

            const cartData = {
                usuario_id: 1,
                productos: [
                    { producto_id: 1, cantidad: 2 },
                    { producto_id: 2, cantidad: 1 }
                ]
            };

            const response = await request(app)
                .post('/api/pedidos/carrito')
                .send(cartData)
                .expect(201);

            expect(response.body.success).toBe(true);
            expect(response.body.pedidos).toHaveLength(2);
            expect(mockPedidoController.crearCarrito).toHaveBeenCalled();
        });
    });

    describe('PUT /api/pedidos/:id/estado (Admin only)', () => {
        test('should update order status with admin auth', async () => {
            mockPedidoController.actualizarEstado.mockImplementation((req, res) => {
                res.json({
                    success: true,
                    message: 'Estado del pedido actualizado exitosamente',
                    pedido: { id: parseInt(req.params.id), estado: req.body.estado }
                });
            });

            const updateData = {
                estado: 'enviado'
            };

            const response = await request(app)
                .put('/api/pedidos/1/estado')
                .send(updateData)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.pedido.estado).toBe('enviado');
            expect(mockPedidoController.actualizarEstado).toHaveBeenCalled();
        });

        test('should validate estado field', async () => {
            mockPedidoController.actualizarEstado.mockImplementation((req, res) => {
                res.status(400).json({
                    success: false,
                    message: 'El estado es obligatorio'
                });
            });

            const response = await request(app)
                .put('/api/pedidos/1/estado')
                .send({})
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('El estado es obligatorio');
        });
    });

    describe('DELETE /api/pedidos/:id (Admin only)', () => {
        test('should delete order with admin auth', async () => {
            mockPedidoController.eliminar.mockImplementation((req, res) => {
                res.json({
                    success: true,
                    message: 'Pedido eliminado exitosamente'
                });
            });

            const response = await request(app)
                .delete('/api/pedidos/1')
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe('Pedido eliminado exitosamente');
            expect(mockPedidoController.eliminar).toHaveBeenCalled();
        });
    });
});
