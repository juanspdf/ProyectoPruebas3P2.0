const Producto = require('../models/Producto');

class ProductoController {
    constructor() {
        this.productoModel = new Producto();
    }

    async obtenerTodos(req, res) {
        try {
            const productos = await this.productoModel.obtenerTodos();
            res.json({
                success: true,
                productos: productos
            });
        } catch (error) {
            console.error('Error en ProductoController.obtenerTodos:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor',
                error: error.message
            });
        }
    }

    async obtenerPorId(req, res) {
        try {
            const { id } = req.params;
            const producto = await this.productoModel.obtenerPorId(id);

            if (!producto) {
                return res.status(404).json({
                    success: false,
                    message: 'Producto no encontrado'
                });
            }

            res.json({
                success: true,
                producto: producto
            });
        } catch (error) {
            console.error('Error en ProductoController.obtenerPorId:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor',
                error: error.message
            });
        }
    }

    async crear(req, res) {
        try {
            const { nombre, descripcion, categoria, subcategoria, precio, stock } = req.body;

            // Validaciones
            if (!nombre || !precio) {
                return res.status(400).json({
                    success: false,
                    message: 'Nombre y precio son campos obligatorios'
                });
            }

            if (precio < 0 || stock < 0) {
                return res.status(400).json({
                    success: false,
                    message: 'El precio y stock deben ser valores positivos'
                });
            }

            const nuevoProducto = {
                nombre,
                descripcion: descripcion || '',
                categoria: categoria || '',
                subcategoria: subcategoria || '',
                precio: parseFloat(precio),
                stock: parseInt(stock) || 0
            };

            const producto = await this.productoModel.crear(nuevoProducto);

            res.status(201).json({
                success: true,
                message: 'Producto creado exitosamente',
                producto: producto
            });
        } catch (error) {
            console.error('Error en ProductoController.crear:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor',
                error: error.message
            });
        }
    }

    async actualizar(req, res) {
        try {
            const { id } = req.params;
            const { nombre, descripcion, categoria, subcategoria, precio, stock } = req.body;

            // Verificar si el producto existe
            const productoExistente = await this.productoModel.obtenerPorId(id);
            if (!productoExistente) {
                return res.status(404).json({
                    success: false,
                    message: 'Producto no encontrado'
                });
            }

            // Validaciones
            if (precio !== undefined && precio < 0) {
                return res.status(400).json({
                    success: false,
                    message: 'El precio debe ser un valor positivo'
                });
            }

            if (stock !== undefined && stock < 0) {
                return res.status(400).json({
                    success: false,
                    message: 'El stock debe ser un valor positivo'
                });
            }

            const datosActualizacion = {
                nombre: nombre || productoExistente.nombre,
                descripcion: descripcion !== undefined ?
                    descripcion : productoExistente.descripcion,
                categoria: categoria !== undefined ?
                    categoria : productoExistente.categoria,
                subcategoria: subcategoria !== undefined ?
                    subcategoria : productoExistente.subcategoria,
                precio: precio !== undefined ?
                    parseFloat(precio) : productoExistente.precio,
                stock: stock !== undefined ?
                    parseInt(stock) : productoExistente.stock
            };

            const producto = await this.productoModel.actualizar(id, datosActualizacion);

            res.json({
                success: true,
                message: 'Producto actualizado exitosamente',
                producto: producto
            });
        } catch (error) {
            console.error('Error en ProductoController.actualizar:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor',
                error: error.message
            });
        }
    }

    async eliminar(req, res) {
        try {
            const { id } = req.params;

            // Verificar si el producto existe
            const producto = await this.productoModel.obtenerPorId(id);
            if (!producto) {
                return res.status(404).json({
                    success: false,
                    message: 'Producto no encontrado'
                });
            }

            const eliminado = await this.productoModel.eliminar(id);

            if (eliminado) {
                res.json({
                    success: true,
                    message: 'Producto eliminado exitosamente'
                });
            } else {
                res.status(500).json({
                    success: false,
                    message: 'No se pudo eliminar el producto'
                });
            }
        } catch (error) {
            console.error('Error en ProductoController.eliminar:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor',
                error: error.message
            });
        }
    }

    async obtenerPorCategoria(req, res) {
        try {
            const { categoria } = req.params;
            const productos = await this.productoModel.obtenerPorCategoria(categoria);

            res.json({
                success: true,
                categoria: categoria,
                productos: productos
            });
        } catch (error) {
            console.error('Error en ProductoController.obtenerPorCategoria:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor',
                error: error.message
            });
        }
    }
}

module.exports = ProductoController;
