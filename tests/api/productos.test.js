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
jest.mock('../../src/controllers/ProductoController');

describe('Productos API Routes', () => {
    let app;
    let mockProductoController;
    let ProductoController;

    beforeAll(() => {
        // Configurar la aplicación de testing aislada
        app = express();
        app.use(express.json());
        
        // Importar el controlador mockeado
        ProductoController = require('../../src/controllers/ProductoController');
        
        // Configurar el mock del controlador
        mockProductoController = {
            obtenerTodos: jest.fn(),
            obtenerPorId: jest.fn(),
            obtenerPorCategoria: jest.fn(),
            crear: jest.fn(),
            actualizar: jest.fn(),
            eliminar: jest.fn()
        };

        ProductoController.mockImplementation(() => mockProductoController);
        
        // Importar las rutas DESPUÉS de configurar los mocks
        const productosRoutes = require('../../src/routes/productos');
        app.use('/api/productos', productosRoutes);
    });

    beforeEach(() => {
        jest.clearAllMocks();
    });

    afterAll(async () => {
        // Limpiar cualquier recurso si es necesario
        jest.resetModules();
    });

    describe('GET /api/productos', () => {
        test('should get all products', async () => {
            mockProductoController.obtenerTodos.mockImplementation((req, res) => {
                res.json({
                    success: true,
                    productos: [
                        { id: 1, nombre: 'Product 1', precio: 100 },
                        { id: 2, nombre: 'Product 2', precio: 200 }
                    ]
                });
            });

            const response = await request(app)
                .get('/api/productos')
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.productos).toHaveLength(2);
            expect(mockProductoController.obtenerTodos).toHaveBeenCalled();
        });

        test('should handle errors', async () => {
            mockProductoController.obtenerTodos.mockImplementation((req, res) => {
                res.status(500).json({
                    success: false,
                    message: 'Error interno del servidor'
                });
            });

            const response = await request(app)
                .get('/api/productos')
                .expect(500);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Error interno del servidor');
        });
    });

    describe('GET /api/productos/:id', () => {
        test('should get product by id', async () => {
            mockProductoController.obtenerPorId.mockImplementation((req, res) => {
                res.json({
                    success: true,
                    producto: { id: 1, nombre: 'Product 1', precio: 100 }
                });
            });

            const response = await request(app)
                .get('/api/productos/1')
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.producto.id).toBe(1);
            expect(mockProductoController.obtenerPorId).toHaveBeenCalled();
        });

        test('should return 404 for non-existent product', async () => {
            mockProductoController.obtenerPorId.mockImplementation((req, res) => {
                res.status(404).json({
                    success: false,
                    message: 'Producto no encontrado'
                });
            });

            const response = await request(app)
                .get('/api/productos/999')
                .expect(404);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Producto no encontrado');
        });
    });

    describe('GET /api/productos/categoria/:categoria', () => {
        test('should get products by category', async () => {
            mockProductoController.obtenerPorCategoria.mockImplementation((req, res) => {
                res.json({
                    success: true,
                    categoria: 'Electronics',
                    productos: [
                        { id: 1, nombre: 'Product 1', categoria: 'Electronics' }
                    ]
                });
            });

            const response = await request(app)
                .get('/api/productos/categoria/Electronics')
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.categoria).toBe('Electronics');
            expect(response.body.productos).toHaveLength(1);
        });
    });

    describe('POST /api/productos (Admin only)', () => {
        test('should create new product with admin auth', async () => {
            mockProductoController.crear.mockImplementation((req, res) => {
                res.status(201).json({
                    success: true,
                    message: 'Producto creado exitosamente',
                    producto: { id: 1, ...req.body }
                });
            });

            const newProduct = {
                nombre: 'New Product',
                descripcion: 'Description',
                precio: 299.99,
                stock: 10,
                categoria: 'Electronics'
            };

            const response = await request(app)
                .post('/api/productos')
                .send(newProduct)
                .expect(201);

            expect(response.body.success).toBe(true);
            expect(response.body.producto.nombre).toBe('New Product');
            expect(mockProductoController.crear).toHaveBeenCalled();
        });
    });

    describe('PUT /api/productos/:id (Admin only)', () => {
        test('should update product with admin auth', async () => {
            mockProductoController.actualizar.mockImplementation((req, res) => {
                res.json({
                    success: true,
                    message: 'Producto actualizado exitosamente',
                    producto: { id: parseInt(req.params.id), ...req.body }
                });
            });

            const updateData = {
                nombre: 'Updated Product',
                precio: 399.99
            };

            const response = await request(app)
                .put('/api/productos/1')
                .send(updateData)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.producto.nombre).toBe('Updated Product');
            expect(mockProductoController.actualizar).toHaveBeenCalled();
        });
    });

    describe('DELETE /api/productos/:id (Admin only)', () => {
        test('should delete product with admin auth', async () => {
            mockProductoController.eliminar.mockImplementation((req, res) => {
                res.json({
                    success: true,
                    message: 'Producto eliminado exitosamente'
                });
            });

            const response = await request(app)
                .delete('/api/productos/1')
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe('Producto eliminado exitosamente');
            expect(mockProductoController.eliminar).toHaveBeenCalled();
        });
    });
});
