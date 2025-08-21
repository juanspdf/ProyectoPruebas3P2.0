const ProductoController = require('../../src/controllers/ProductoController');
const Producto = require('../../src/models/Producto');

// Mock del modelo Producto
jest.mock('../../src/models/Producto');

describe('ProductoController', () => {
    let productoController;
    let mockRequest;
    let mockResponse;
    let mockProductoInstance;

    beforeEach(() => {
        // Crear    describe('actualizar', () => {
        test('should handle update errors', async () => {
            mockRequest.params.id = '1';
            mockRequest.body = {
                nombre: 'Producto actualizado',
                precio: 200,
                descripcion: 'Descripción actualizada'
            };
            mockProductoInstance.obtenerPorId.mockRejectedValue(new Error('Database error'));

            await productoController.actualizar(mockRequest, mockResponse);

            expect(mockResponse.status).toHaveBeenCalledWith(500);
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: false,
                message: 'Error interno del servidor',
                error: 'Database error'ncia del modelo
        mockProductoInstance = {
            obtenerTodos: jest.fn(),
            obtenerPorId: jest.fn(),
            crear: jest.fn(),
            actualizar: jest.fn(),
            eliminar: jest.fn(),
            obtenerPorCategoria: jest.fn()
        };

        // Mock del constructor de la clase
        Producto.mockImplementation(() => mockProductoInstance);
        
        // Crear una nueva instancia del controlador para cada test
        productoController = new ProductoController();
        
        // Configurar mocks para request y response
        mockRequest = {
            params: {},
            body: {},
            query: {}
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
        test('should return all products successfully', async () => {
            const mockProductos = [
                {
                    id: 1,
                    nombre: 'Test Product',
                    precio: 99.99,
                    stock: 10
                }
            ];

            mockProductoInstance.obtenerTodos.mockResolvedValue(mockProductos);

            await productoController.obtenerTodos(mockRequest, mockResponse);

            expect(mockResponse.json).toHaveBeenCalledWith({
                success: true,
                productos: mockProductos
            });
        });

        test('should handle database errors', async () => {
            mockProductoInstance.obtenerTodos.mockRejectedValue(new Error('Database error'));

            await productoController.obtenerTodos(mockRequest, mockResponse);

            expect(mockResponse.status).toHaveBeenCalledWith(500);
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: false,
                message: 'Error interno del servidor',
                error: 'Database error'
            });
        });
    });

    describe('obtenerPorId', () => {
        test('should return product by id', async () => {
            const mockProducto = {
                id: 1,
                nombre: 'Test Product',
                precio: 99.99,
                stock: 10
            };

            mockRequest.params.id = '1';
            mockProductoInstance.obtenerPorId.mockResolvedValue(mockProducto);

            await productoController.obtenerPorId(mockRequest, mockResponse);

            expect(mockResponse.json).toHaveBeenCalledWith({
                success: true,
                producto: mockProducto
            });
        });

        test('should return 404 if product not found', async () => {
            mockRequest.params.id = '999';
            mockProductoInstance.obtenerPorId.mockResolvedValue(null);

            await productoController.obtenerPorId(mockRequest, mockResponse);

            expect(mockResponse.status).toHaveBeenCalledWith(404);
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: false,
                message: 'Producto no encontrado'
            });
        });
    });

    describe('crear', () => {
        test('should create new product successfully', async () => {
            const mockCreatedProduct = {
                id: 1,
                nombre: 'New Product',
                descripcion: 'Description',
                precio: 299.99,
                stock: 20,
                categoria: 'Electronics',
                subcategoria: 'Phones'
            };

            mockRequest.body = {
                nombre: 'New Product',
                descripcion: 'Description',
                precio: 299.99,
                stock: 20,
                categoria: 'Electronics',
                subcategoria: 'Phones'
            };

            mockProductoInstance.crear.mockResolvedValue(mockCreatedProduct);

            await productoController.crear(mockRequest, mockResponse);

            expect(mockResponse.status).toHaveBeenCalledWith(201);
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: true,
                message: 'Producto creado exitosamente',
                producto: mockCreatedProduct
            });
        });

        test('should validate required fields', async () => {
            mockRequest.body = {
                descripcion: 'Description'
                // Faltan campos requeridos
            };

            await productoController.crear(mockRequest, mockResponse);

            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: false,
                message: 'Nombre y precio son campos obligatorios'
            });
        });

        test('should validate positive price and stock', async () => {
            mockRequest.body = {
                nombre: 'Test Product',
                precio: -10,
                stock: -5,
                categoria: 'Electronics'
            };

            await productoController.crear(mockRequest, mockResponse);

            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: false,
                message: 'El precio y stock deben ser valores positivos'
            });
        });
    });

    describe('actualizar', () => {
        test('should update product successfully', async () => {
            const mockUpdatedProduct = {
                id: 1,
                nombre: 'Updated Product',
                descripcion: 'Updated Description',
                precio: 399.99,
                stock: 15,
                categoria: 'Electronics',
                subcategoria: 'Phones'
            };

            mockRequest.params.id = '1';
            mockRequest.body = {
                nombre: 'Updated Product',
                descripcion: 'Updated Description',
                precio: 399.99,
                stock: 15,
                categoria: 'Electronics',
                subcategoria: 'Phones'
            };

            // Primero verificar que el producto existe
            mockProductoInstance.obtenerPorId.mockResolvedValue({ id: 1 });
            mockProductoInstance.actualizar.mockResolvedValue(mockUpdatedProduct);

            await productoController.actualizar(mockRequest, mockResponse);

            expect(mockResponse.json).toHaveBeenCalledWith({
                success: true,
                message: 'Producto actualizado exitosamente',
                producto: mockUpdatedProduct
            });
        });

        test('should return 404 if product not found', async () => {
            mockRequest.params.id = '999';
            mockRequest.body = {
                nombre: 'Updated Product',
                precio: 199.99,
                stock: 5
            };

            mockProductoInstance.obtenerPorId.mockResolvedValue(null);

            await productoController.actualizar(mockRequest, mockResponse);

            expect(mockResponse.status).toHaveBeenCalledWith(404);
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: false,
                message: 'Producto no encontrado'
            });
        });

        test('should handle update errors', async () => {
            mockRequest.params.id = '1';
            mockRequest.body = {
                nombre: 'Updated Product',
                precio: 199.99,
                stock: 5
            };

            mockProductoInstance.obtenerPorId.mockResolvedValue({ id: 1 });
            mockProductoInstance.actualizar.mockRejectedValue(new Error('Database error'));

            await productoController.actualizar(mockRequest, mockResponse);

            expect(mockResponse.status).toHaveBeenCalledWith(500);
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: false,
                message: 'Error interno del servidor',
                error: 'Database error'
            });
        });
    });

    describe('eliminar', () => {
        test('should delete product successfully', async () => {
            mockRequest.params.id = '1';
            mockProductoInstance.obtenerPorId.mockResolvedValue({ id: 1 });
            mockProductoInstance.eliminar.mockResolvedValue(true);

            await productoController.eliminar(mockRequest, mockResponse);

            expect(mockResponse.json).toHaveBeenCalledWith({
                success: true,
                message: 'Producto eliminado exitosamente'
            });
        });

        test('should return 404 if product not found for deletion', async () => {
            mockRequest.params.id = '999';
            mockProductoInstance.obtenerPorId.mockResolvedValue(null);

            await productoController.eliminar(mockRequest, mockResponse);

            expect(mockResponse.status).toHaveBeenCalledWith(404);
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: false,
                message: 'Producto no encontrado'
            });
        });
    });

    describe('obtenerPorCategoria', () => {
        test('should return products by category', async () => {
            const mockProductos = [
                {
                    id: 1,
                    nombre: 'Product 1',
                    categoria: 'Electronics'
                },
                {
                    id: 2,
                    nombre: 'Product 2',
                    categoria: 'Electronics'
                }
            ];

            mockRequest.params.categoria = 'Electronics';
            mockProductoInstance.obtenerPorCategoria.mockResolvedValue(mockProductos);

            await productoController.obtenerPorCategoria(mockRequest, mockResponse);

            expect(mockResponse.json).toHaveBeenCalledWith({
                success: true,
                categoria: 'Electronics',
                productos: mockProductos
            });
        });

        test('should handle category search errors', async () => {
            mockRequest.params.categoria = 'Electronics';
            mockProductoInstance.obtenerPorCategoria.mockRejectedValue(new Error('Database error'));

            await productoController.obtenerPorCategoria(mockRequest, mockResponse);

            expect(mockResponse.status).toHaveBeenCalledWith(500);
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: false,
                message: 'Error interno del servidor',
                error: 'Database error'
            });
        });
    });

    describe('eliminar', () => {
        test('should delete product successfully', async () => {
            mockRequest.params.id = '1';
            mockProductoInstance.obtenerPorId.mockResolvedValue(mockProducto);
            mockProductoInstance.eliminar.mockResolvedValue(true);

            await productoController.eliminar(mockRequest, mockResponse);

            expect(mockResponse.json).toHaveBeenCalledWith({
                success: true,
                message: 'Producto eliminado exitosamente'
            });
        });

        test('should handle product not found for deletion', async () => {
            mockRequest.params.id = '999';
            mockProductoInstance.obtenerPorId.mockResolvedValue(null);

            await productoController.eliminar(mockRequest, mockResponse);

            expect(mockResponse.status).toHaveBeenCalledWith(404);
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: false,
                message: 'Producto no encontrado'
            });
        });

        test('should handle delete errors', async () => {
            mockRequest.params.id = '1';
            mockProductoInstance.obtenerPorId.mockRejectedValue(new Error('Database error'));

            await productoController.eliminar(mockRequest, mockResponse);

            expect(mockResponse.status).toHaveBeenCalledWith(500);
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: false,
                message: 'Error interno del servidor',
                error: 'Database error'
            });
        });
    });

    describe('obtenerPorId', () => {
        test('should handle product not found', async () => {
            mockRequest.params.id = '999';
            mockProductoInstance.obtenerPorId.mockResolvedValue(null);

            await productoController.obtenerPorId(mockRequest, mockResponse);

            expect(mockResponse.status).toHaveBeenCalledWith(404);
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: false,
                message: 'Producto no encontrado'
            });
        });

        test('should handle errors in obtenerPorId', async () => {
            mockRequest.params.id = '1';
            mockProductoInstance.obtenerPorId.mockRejectedValue(new Error('Database error'));

            await productoController.obtenerPorId(mockRequest, mockResponse);

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
                nombre: 'Producto actualizado',
                precio: 200,
                descripcion: 'Descripción actualizada'
            };
            mockProductoInstance.obtenerPorId.mockRejectedValue(new Error('Database error'));

            await productoController.actualizar(mockRequest, mockResponse);

            expect(mockResponse.status).toHaveBeenCalledWith(500);
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: false,
                message: 'Error interno del servidor',
                error: 'Database error'
            });
        });
    });
});
