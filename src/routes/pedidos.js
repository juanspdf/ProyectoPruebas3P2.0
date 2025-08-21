const express = require('express');
const PedidoController = require('../controllers/PedidoController');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();
const pedidoController = new PedidoController();

// Rutas protegidas para usuarios autenticados - ORDEN CORREGIDO
router.post('/carrito',
    authenticateToken,
    (req, res) => {
        req.body.usuario_id = req.usuario.id;
        pedidoController.crearCarrito(req, res);
    }
);

router.get('/mis-pedidos',
    authenticateToken,
    (req, res) => pedidoController.misPedidos(req, res)
);

router.post('/',
    authenticateToken,
    (req, res) => {
        req.body.usuario_id = req.usuario.id;
        pedidoController.crear(req, res);
    }
);

// Rutas específicas por ID (deben ir antes de las rutas generales)
router.get('/:id',
    authenticateToken,
    (req, res) => {
        // Si es admin, puede ver cualquier pedido
        // Si es usuario normal, solo puede ver sus propios pedidos
        if (req.usuario.rol === 'admin') {
            pedidoController.obtenerPorId(req, res);
        } else {
            // Verificar que el pedido pertenece al usuario
            pedidoController.obtenerPedidoUsuario(req, res);
        }
    }
);

router.put('/:id/estado',
    authenticateToken,
    (req, res) => {
        // Si es admin, puede cambiar cualquier estado
        // Si es usuario normal, solo puede cancelar sus propios pedidos pendientes
        if (req.usuario.rol === 'admin') {
            pedidoController.actualizarEstado(req, res);
        } else {
            pedidoController.cancelarPedidoUsuario(req, res);
        }
    }
);

// Rutas de administrador (al final)
router.get('/',
    authenticateToken,
    requireRole(['admin']),
    (req, res) => pedidoController.obtenerTodos(req, res)
);

router.get('/estadisticas',
    authenticateToken,
    requireRole(['admin']),
    (req, res) => pedidoController.obtenerEstadisticas(req, res)
);

router.get('/usuario/:usuarioId',
    authenticateToken,
    requireRole(['admin']),
    (req, res) => pedidoController.obtenerPorUsuario(req, res)
);

router.delete('/:id',
    authenticateToken,
    requireRole(['admin']),
    (req, res) => pedidoController.eliminar(req, res)
);

module.exports = router;