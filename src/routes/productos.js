const express = require('express');
const ProductoController = require('../controllers/ProductoController');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();
const productoController = new ProductoController();

// Rutas públicas
router.get('/', (req, res) => productoController.obtenerTodos(req, res));
router.get('/:id', (req, res) => productoController.obtenerPorId(req, res));
router.get('/categoria/:categoria', (req, res) => productoController.obtenerPorCategoria(req, res));

// Rutas protegidas (solo administradores)
router.post('/',
    authenticateToken,
    requireRole(['admin']),
    (req, res) => productoController.crear(req, res)
);

router.put('/:id',
    authenticateToken,
    requireRole(['admin']),
    (req, res) => productoController.actualizar(req, res)
);

router.delete('/:id',
    authenticateToken,
    requireRole(['admin']),
    (req, res) => productoController.eliminar(req, res)
);

module.exports = router;
