const express = require('express');
const UsuarioController = require('../controllers/UsuarioController');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();
const usuarioController = new UsuarioController();

// Rutas públicas
router.post('/registrar', (req, res) => usuarioController.registrar(req, res));
router.post('/', (req, res) => usuarioController.registrar(req, res)); // Ruta adicional para registro
router.post('/login', (req, res) => usuarioController.login(req, res));

// Rutas protegidas
router.get('/perfil',
    authenticateToken,
    (req, res) => usuarioController.perfil(req, res)
);

router.put('/perfil',
    authenticateToken,
    (req, res) => {
        req.params.id = req.usuario.id;
        usuarioController.actualizar(req, res);
    }
);

// Ruta para actualizar perfil por ID (requiere autenticación)
router.put('/:id',
    authenticateToken,
    (req, res) => {
        // Verificar que el usuario solo pueda actualizar su propio perfil (excepto admin)
        if (req.usuario.rol !== 'admin' && req.usuario.id !== parseInt(req.params.id)) {
            return res.status(403).json({
                success: false,
                message: 'Solo puedes actualizar tu propio perfil'
            });
        }
        usuarioController.actualizar(req, res);
    }
);

// Rutas de administrador
router.get('/',
    authenticateToken,
    requireRole(['admin']),
    (req, res) => usuarioController.obtenerTodos(req, res)
);

router.get('/:id',
    authenticateToken,
    requireRole(['admin']),
    (req, res) => usuarioController.obtenerPorId(req, res)
);

router.delete('/:id',
    authenticateToken,
    requireRole(['admin']),
    (req, res) => usuarioController.eliminar(req, res)
);

module.exports = router;
