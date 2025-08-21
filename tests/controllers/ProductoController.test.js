const ProductoController = require('../../src/controllers/ProductoController');
const Producto = require('../../src/models/Producto');

jest.mock('../../src/models/Producto');

describe('ProductoController', () => {
    let mockProductoInstance;
    let productoController;
    let mockRequest;
    let mockResponse;

    beforeEach(() => {
        mockProductoInstance = {
            obtenerTodos: jest.fn(),
            obtenerPorId: jest.fn(),
            obtenerPorCategoria: jest.fn(),
            crear: jest.fn(),
            actualizar: jest.fn(),
            eliminar: jest.fn()
        };

        Producto.mockImplementation(() => mockProductoInstance);
        productoController = new ProductoController();

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
        test('should return all products successfully', async () => {
            const mockProducts = [{ id: 1, nombre: 'Producto Test' }];
            mockProductoInstance.obtenerTodos.mockResolvedValue(mockProducts);

            await productoController.obtenerTodos(mockRequest, mockResponse);

            expect(mockResponse.json).toHaveBeenCalledWith({
                success: true,
                productos: mockProducts
            });
        });

        test('should handle errors', async () => {
            mockProductoInstance.obtenerTodos.mockRejectedValue(new Error('Database error'));

            await productoController.obtenerTodos(mockRequest, mockResponse);

            expect(mockResponse.status).toHaveBeenCalledWith(500);
        });
    });

    describe('obtenerPorId', () => {
        test('should return product by id successfully', async () => {
            const mockProducto = { id: 1, nombre: 'Producto Test', precio: 100 };
            mockRequest.params.id = '1';
            mockProductoInstance.obtenerPorId.mockResolvedValue(mockProducto);

            await productoController.obtenerPorId(mockRequest, mockResponse);

            expect(mockProductoInstance.obtenerPorId).toHaveBeenCalledWith('1');
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: true,
                producto: mockProducto
            });
        });

        test('should return 404 when product not found', async () => {
            mockRequest.params.id = '999';
            mockProductoInstance.obtenerPorId.mockResolvedValue(null);

            await productoController.obtenerPorId(mockRequest, mockResponse);

            expect(mockResponse.status).toHaveBeenCalledWith(404);
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: false,
                message: 'Producto no encontrado'
            });
        });

        test('should handle invalid id format', async () => {
            mockRequest.params.id = 'invalid';
            mockProductoInstance.obtenerPorId.mockResolvedValue(null);

            await productoController.obtenerPorId(mockRequest, mockResponse);

            expect(mockResponse.status).toHaveBeenCalledWith(404);
        });

        test('should handle database errors', async () => {
            mockRequest.params.id = '1';
            mockProductoInstance.obtenerPorId.mockRejectedValue(new Error('Database error'));

            await productoController.obtenerPorId(mockRequest, mockResponse);

            expect(mockResponse.status).toHaveBeenCalledWith(500);
        });
    });

    describe('obtenerPorCategoria', () => {
        test('should return products by category successfully', async () => {
            const mockProductos = [
                { id: 1, nombre: 'Producto 1', categoria: 'Electrónicos' },
                { id: 2, nombre: 'Producto 2', categoria: 'Electrónicos' }
            ];
            mockRequest.params.categoria = 'Electrónicos';
            mockProductoInstance.obtenerPorCategoria.mockResolvedValue(mockProductos);

            await productoController.obtenerPorCategoria(mockRequest, mockResponse);

            expect(mockProductoInstance.obtenerPorCategoria).toHaveBeenCalledWith('Electrónicos');
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: true,
                categoria: 'Electrónicos',
                productos: mockProductos
            });
        });

        test('should handle empty category results', async () => {
            mockRequest.params.categoria = 'Categoría Inexistente';
            mockProductoInstance.obtenerPorCategoria.mockResolvedValue([]);

            await productoController.obtenerPorCategoria(mockRequest, mockResponse);

            expect(mockResponse.json).toHaveBeenCalledWith({
                success: true,
                categoria: 'Categoría Inexistente',
                productos: []
            });
        });

        test('should handle missing category parameter', async () => {
            mockRequest.params = {};
            mockProductoInstance.obtenerPorCategoria.mockResolvedValue(undefined);

            await productoController.obtenerPorCategoria(mockRequest, mockResponse);

            expect(mockResponse.json).toHaveBeenCalledWith({
                success: true,
                categoria: undefined,
                productos: undefined
            });
        });

        test('should handle database errors', async () => {
            mockRequest.params.categoria = 'Electrónicos';
            mockProductoInstance.obtenerPorCategoria.mockRejectedValue(new Error('Database error'));

            await productoController.obtenerPorCategoria(mockRequest, mockResponse);

            expect(mockResponse.status).toHaveBeenCalledWith(500);
        });
    });

    describe('crear', () => {
        test('should create product successfully', async () => {
            const nuevoProducto = {
                nombre: 'Nuevo Producto',
                descripcion: 'Descripción del producto',
                precio: 100,
                categoria: 'Electrónicos',
                stock: 50
            };
            const productoCreado = { id: 1, ...nuevoProducto, subcategoria: '' };
            
            mockRequest.body = nuevoProducto;
            mockProductoInstance.crear.mockResolvedValue(productoCreado);

            await productoController.crear(mockRequest, mockResponse);

            expect(mockProductoInstance.crear).toHaveBeenCalledWith({
                nombre: nuevoProducto.nombre,
                descripcion: nuevoProducto.descripcion,
                categoria: nuevoProducto.categoria,
                subcategoria: '',
                precio: nuevoProducto.precio,
                stock: nuevoProducto.stock
            });
            expect(mockResponse.status).toHaveBeenCalledWith(201);
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: true,
                message: 'Producto creado exitosamente',
                producto: productoCreado
            });
        });

        test('should handle missing required fields', async () => {
            mockRequest.body = { nombre: 'Producto Incompleto' };

            await productoController.crear(mockRequest, mockResponse);

            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: false,
                message: 'Nombre y precio son campos obligatorios'
            });
        });

        test('should handle invalid price', async () => {
            mockRequest.body = {
                nombre: 'Producto',
                descripcion: 'Descripción',
                precio: -10,
                categoria: 'Electrónicos',
                stock: 50
            };

            await productoController.crear(mockRequest, mockResponse);

            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: false,
                message: 'El precio y stock deben ser valores positivos'
            });
        });

        test('should handle invalid stock', async () => {
            mockRequest.body = {
                nombre: 'Producto',
                descripcion: 'Descripción',
                precio: 100,
                categoria: 'Electrónicos',
                stock: -5
            };

            await productoController.crear(mockRequest, mockResponse);

            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: false,
                message: 'El precio y stock deben ser valores positivos'
            });
        });

        test('should handle database errors', async () => {
            const nuevoProducto = {
                nombre: 'Nuevo Producto',
                descripcion: 'Descripción',
                precio: 100,
                categoria: 'Electrónicos',
                stock: 50
            };
            mockRequest.body = nuevoProducto;
            mockProductoInstance.crear.mockRejectedValue(new Error('Database error'));

            await productoController.crear(mockRequest, mockResponse);

            expect(mockResponse.status).toHaveBeenCalledWith(500);
        });
    });

    describe('actualizar', () => {
        test('should update product successfully', async () => {
            const productoExistente = { id: 1, nombre: 'Producto Existente', precio: 100 };
            const datosActualizacion = {
                nombre: 'Producto Actualizado',
                precio: 150
            };
            const productoActualizado = { id: 1, ...datosActualizacion };
            
            mockRequest.params.id = '1';
            mockRequest.body = datosActualizacion;
            mockProductoInstance.obtenerPorId.mockResolvedValue(productoExistente);
            mockProductoInstance.actualizar.mockResolvedValue(productoActualizado);

            await productoController.actualizar(mockRequest, mockResponse);

            expect(mockProductoInstance.obtenerPorId).toHaveBeenCalledWith('1');
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: true,
                message: 'Producto actualizado exitosamente',
                producto: productoActualizado
            });
        });

        test('should return 404 when updating non-existent product', async () => {
            mockRequest.params.id = '999';
            mockRequest.body = { nombre: 'Producto' };
            mockProductoInstance.obtenerPorId.mockResolvedValue(null);

            await productoController.actualizar(mockRequest, mockResponse);

            expect(mockResponse.status).toHaveBeenCalledWith(404);
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: false,
                message: 'Producto no encontrado'
            });
        });

        test('should handle invalid price in update', async () => {
            const productoExistente = { id: 1, nombre: 'Producto', precio: 100 };
            mockRequest.params.id = '1';
            mockRequest.body = { precio: -10 };
            mockProductoInstance.obtenerPorId.mockResolvedValue(productoExistente);

            await productoController.actualizar(mockRequest, mockResponse);

            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: false,
                message: 'El precio debe ser un valor positivo'
            });
        });

        test('should handle invalid stock in update', async () => {
            const productoExistente = { id: 1, nombre: 'Producto', stock: 10 };
            mockRequest.params.id = '1';
            mockRequest.body = { stock: -5 };
            mockProductoInstance.obtenerPorId.mockResolvedValue(productoExistente);

            await productoController.actualizar(mockRequest, mockResponse);

            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: false,
                message: 'El stock debe ser un valor positivo'
            });
        });

        test('should handle database errors', async () => {
            mockRequest.params.id = '1';
            mockRequest.body = { nombre: 'Producto' };
            mockProductoInstance.obtenerPorId.mockRejectedValue(new Error('Database error'));

            await productoController.actualizar(mockRequest, mockResponse);

            expect(mockResponse.status).toHaveBeenCalledWith(500);
        });
    });

    describe('eliminar', () => {
        test('should delete product successfully', async () => {
            const productoExistente = { id: 1, nombre: 'Producto Test' };
            mockRequest.params.id = '1';
            mockProductoInstance.obtenerPorId.mockResolvedValue(productoExistente);
            mockProductoInstance.eliminar.mockResolvedValue(true);

            await productoController.eliminar(mockRequest, mockResponse);

            expect(mockProductoInstance.obtenerPorId).toHaveBeenCalledWith('1');
            expect(mockProductoInstance.eliminar).toHaveBeenCalledWith('1');
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: true,
                message: 'Producto eliminado exitosamente'
            });
        });

        test('should return 404 when deleting non-existent product', async () => {
            mockRequest.params.id = '999';
            mockProductoInstance.obtenerPorId.mockResolvedValue(null);

            await productoController.eliminar(mockRequest, mockResponse);

            expect(mockResponse.status).toHaveBeenCalledWith(404);
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: false,
                message: 'Producto no encontrado'
            });
        });

        test('should handle database errors', async () => {
            mockRequest.params.id = '1';
            mockProductoInstance.obtenerPorId.mockRejectedValue(new Error('Database error'));

            await productoController.eliminar(mockRequest, mockResponse);

            expect(mockResponse.status).toHaveBeenCalledWith(500);
        });
    });
});