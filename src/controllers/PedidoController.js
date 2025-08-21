const Pedido = require('../models/Pedido');
const Producto = require('../models/Producto');

class PedidoController {
    constructor() {
        this.pedidoModel = new Pedido();
        this.productoModel = new Producto();
    }

    async obtenerTodos(req, res) {
        try {
            const pedidos = await this.pedidoModel.obtenerTodos();
            res.json({
                success: true,
                pedidos: pedidos
            });
        } catch (error) {
            console.error('Error en PedidoController.obtenerTodos:', error);
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
            const pedido = await this.pedidoModel.obtenerPorId(id);

            if (!pedido) {
                return res.status(404).json({
                    success: false,
                    message: 'Pedido no encontrado'
                });
            }

            res.json({
                success: true,
                pedido: pedido
            });
        } catch (error) {
            console.error('Error en PedidoController.obtenerPorId:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor',
                error: error.message
            });
        }
    }

    // NUEVO: Método para que un usuario obtenga solo sus pedidos
    async obtenerPedidoUsuario(req, res) {
        try {
            const { id } = req.params;
            const pedido = await this.pedidoModel.obtenerPorId(id);

            if (!pedido) {
                return res.status(404).json({
                    success: false,
                    message: 'Pedido no encontrado'
                });
            }

            // Verificar que el pedido pertenece al usuario autenticado
            if (pedido.usuario_id !== req.usuario.id) {
                return res.status(403).json({
                    success: false,
                    message: 'No tienes permisos para ver este pedido'
                });
            }

            res.json({
                success: true,
                pedido: pedido
            });
        } catch (error) {
            console.error('Error en PedidoController.obtenerPedidoUsuario:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor',
                error: error.message
            });
        }
    }

    async obtenerPorUsuario(req, res) {
        try {
            const { usuarioId } = req.params;
            const pedidos = await this.pedidoModel.obtenerPorUsuario(usuarioId);

            res.json({
                success: true,
                pedidos: pedidos
            });
        } catch (error) {
            console.error('Error en PedidoController.obtenerPorUsuario:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor',
                error: error.message
            });
        }
    }

    async crear(req, res) {
        try {
            const { usuario_id, producto_id, cantidad } = req.body;

            // Validaciones
            if (!usuario_id || !producto_id || !cantidad) {
                return res.status(400).json({
                    success: false,
                    message: 'Usuario ID, Producto ID y cantidad son obligatorios'
                });
            }

            if (cantidad <= 0) {
                return res.status(400).json({
                    success: false,
                    message: 'La cantidad debe ser mayor a 0'
                });
            }

            // Verificar que el producto existe
            const producto = await this.productoModel.obtenerPorId(producto_id);
            if (!producto) {
                return res.status(404).json({
                    success: false,
                    message: 'Producto no encontrado'
                });
            }

            // Verificar stock disponible
            if (producto.stock < cantidad) {
                return res.status(400).json({
                    success: false,
                    message: `Stock insuficiente. Disponible: ${producto.stock}`
                });
            }

            const nuevoPedido = {
                usuario_id,
                producto_id,
                nombre_producto: producto.nombre,
                categoria_producto: producto.categoria,
                cantidad: parseInt(cantidad),
                estado: 'pendiente'
            };

            const pedido = await this.pedidoModel.crear(nuevoPedido);

            res.status(201).json({
                success: true,
                message: 'Pedido creado exitosamente',
                pedido: pedido
            });
        } catch (error) {
            console.error('Error en PedidoController.crear:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor',
                error: error.message
            });
        }
    }

    async crearCarrito(req, res) {
        try {
            const { usuario_id, productos } = req.body;

            console.log('Datos recibidos en crearCarrito:', { usuario_id, productos });
            console.log('Usuario autenticado:', req.usuario);

            // Validaciones
            if (!productos || !Array.isArray(productos) || productos.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Los productos son obligatorios y deben ser un array no vacío'
                });
            }

            const pedidos = [];

            // Validar cada producto
            for (const item of productos) {
                if (!item.producto_id || !item.cantidad) {
                    return res.status(400).json({
                        success: false,
                        message: 'Cada producto debe tener producto_id y cantidad'
                    });
                }

                if (item.cantidad <= 0) {
                    return res.status(400).json({
                        success: false,
                        message: 'La cantidad debe ser mayor a 0'
                    });
                }

                // Verificar que el producto existe y tiene stock
                const producto = await this.productoModel.obtenerPorId(item.producto_id);
                if (!producto) {
                    return res.status(404).json({
                        success: false,
                        message: `Producto con ID ${item.producto_id} no encontrado`
                    });
                }

                if (producto.stock < item.cantidad) {
                    return res.status(400).json({
                        success: false,
                        message: `Stock insuficiente para ${producto.nombre}. Disponible: ${producto.stock}, Solicitado: ${item.cantidad}`
                    });
                }

                pedidos.push({
                    usuario_id: req.usuario.id, // Usar el ID del usuario autenticado
                    producto_id: item.producto_id,
                    nombre_producto: producto.nombre,
                    categoria_producto: producto.categoria,
                    cantidad: parseInt(item.cantidad),
                    estado: 'pendiente'
                });
            }

            console.log('Pedidos a crear:', pedidos);

            const pedidosCreados = await this.pedidoModel.crearMultiples(pedidos);

            console.log('Pedidos creados exitosamente:', pedidosCreados);

            res.status(201).json({
                success: true,
                message: `Se crearon ${pedidosCreados.length} pedidos exitosamente`,
                pedidos: pedidosCreados,
                total_pedidos: pedidosCreados.length
            });
        } catch (error) {
            console.error('Error en PedidoController.crearCarrito:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor',
                error: error.message
            });
        }
    }

    async actualizarEstado(req, res) {
        try {
            const { id } = req.params;
            const { estado } = req.body;

            if (!estado) {
                return res.status(400).json({
                    success: false,
                    message: 'El estado es obligatorio'
                });
            }

            const estadosValidos = ['pendiente', 'enviado', 'entregado', 'cancelado'];
            if (!estadosValidos.includes(estado)) {
                return res.status(400).json({
                    success: false,
                    message: 'Estado no válido. Estados permitidos: ' + estadosValidos.join(', ')
                });
            }

            // Verificar que el pedido existe
            const pedidoExistente = await this.pedidoModel.obtenerPorId(id);
            if (!pedidoExistente) {
                return res.status(404).json({
                    success: false,
                    message: 'Pedido no encontrado'
                });
            }

            const pedido = await this.pedidoModel.actualizarEstado(id, estado);

            res.json({
                success: true,
                message: 'Estado del pedido actualizado exitosamente',
                pedido: pedido
            });
        } catch (error) {
            console.error('Error en PedidoController.actualizarEstado:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor',
                error: error.message
            });
        }
    }

    // NUEVO: Método para que un usuario cancele solo sus propios pedidos
    async cancelarPedidoUsuario(req, res) {
        try {
            const { id } = req.params;
            const { estado } = req.body;

            // Solo permitir cancelación
            if (estado !== 'cancelado') {
                return res.status(403).json({
                    success: false,
                    message: 'Solo puedes cancelar tus pedidos'
                });
            }

            // Verificar que el pedido existe
            const pedidoExistente = await this.pedidoModel.obtenerPorId(id);
            if (!pedidoExistente) {
                return res.status(404).json({
                    success: false,
                    message: 'Pedido no encontrado'
                });
            }

            // Verificar que el pedido pertenece al usuario
            if (pedidoExistente.usuario_id !== req.usuario.id) {
                return res.status(403).json({
                    success: false,
                    message: 'No tienes permisos para cancelar este pedido'
                });
            }

            // Solo se pueden cancelar pedidos pendientes
            if (pedidoExistente.estado !== 'pendiente') {
                return res.status(400).json({
                    success: false,
                    message: 'Solo se pueden cancelar pedidos en estado pendiente'
                });
            }

            const pedido = await this.pedidoModel.actualizarEstado(id, 'cancelado');

            res.json({
                success: true,
                message: 'Pedido cancelado exitosamente',
                pedido: pedido
            });
        } catch (error) {
            console.error('Error en PedidoController.cancelarPedidoUsuario:', error);
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

            // Verificar que el pedido existe
            const pedido = await this.pedidoModel.obtenerPorId(id);
            if (!pedido) {
                return res.status(404).json({
                    success: false,
                    message: 'Pedido no encontrado'
                });
            }

            const eliminado = await this.pedidoModel.eliminar(id);

            if (eliminado) {
                res.json({
                    success: true,
                    message: 'Pedido eliminado exitosamente'
                });
            } else {
                res.status(500).json({
                    success: false,
                    message: 'No se pudo eliminar el pedido'
                });
            }
        } catch (error) {
            console.error('Error en PedidoController.eliminar:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor',
                error: error.message
            });
        }
    }

    async obtenerEstadisticas(req, res) {
        try {
            const estadisticas = await this.pedidoModel.obtenerEstadisticas();

            res.json({
                success: true,
                estadisticas: estadisticas
            });
        } catch (error) {
            console.error('Error en PedidoController.obtenerEstadisticas:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor',
                error: error.message
            });
        }
    }

    // NUEVO: Método para que un usuario obtenga solo sus pedidos
    async misPedidos(req, res) {
        try {
            const usuarioId = req.usuario.id;
            const pedidos = await this.pedidoModel.obtenerPorUsuario(usuarioId);

            res.json({
                success: true,
                pedidos: pedidos
            });
        } catch (error) {
            console.error('Error en PedidoController.misPedidos:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor',
                error: error.message
            });
        }
    }
}

module.exports = PedidoController;