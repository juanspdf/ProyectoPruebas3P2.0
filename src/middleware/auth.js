const jwt = require('jsonwebtoken');

// Middleware para verificar JWT
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    console.log('🔐 Middleware de autenticación ejecutándose...');
    console.log('📥 Header de autorización:', authHeader ? 'Presente' : 'Ausente');
    console.log('🔑 Token extraído:', token ? 'Presente' : 'Ausente');

    if (!token) {
        console.log('❌ No se proporcionó token');
        return res.status(401).json({
            success: false,
            message: 'Token de acceso requerido'
        });
    }

    // Usar la misma clave del .env
    const jwtSecret = process.env.JWT_SECRET;
    console.log('🔑 JWT_SECRET está configurado:', !!jwtSecret);

    if (!jwtSecret) {
        console.error('❌ JWT_SECRET no está configurado');
        return res.status(500).json({
            success: false,
            message: 'Error de configuración del servidor'
        });
    }

    jwt.verify(token, jwtSecret, (err, usuario) => {
        if (err) {
            console.error('❌ Error al verificar token:', err.message);
            console.error('🔍 Tipo de error:', err.name);
            
            let message = 'Token inválido o expirado';
            if (err.name === 'TokenExpiredError') {
                message = 'Token expirado - inicia sesión nuevamente';
            } else if (err.name === 'JsonWebTokenError') {
                message = 'Token inválido - inicia sesión nuevamente';
            } else if (err.name === 'NotBeforeError') {
                message = 'Token no válido aún';
            }
            
            return res.status(403).json({
                success: false,
                message: message,
                error: err.name
            });
        }

        console.log('✅ Usuario autenticado exitosamente:', {
            id: usuario.id,
            email: usuario.email,
            rol: usuario.rol
        });
        
        req.usuario = usuario;
        next();
    });
};

// Middleware para verificar roles
const requireRole = (roles) => {
    return (req, res, next) => {
        console.log('🛡️ Verificando roles requeridos:', roles);
        console.log('👤 Usuario actual:', req.usuario);
        
        if (!req.usuario) {
            console.log('❌ Usuario no autenticado');
            return res.status(401).json({
                success: false,
                message: 'Usuario no autenticado'
            });
        }

        if (!roles.includes(req.usuario.rol)) {
            console.log(`❌ Rol insuficiente. Requerido: ${roles}, Actual: ${req.usuario.rol}`);
            return res.status(403).json({
                success: false,
                message: 'No tienes permisos para acceder a este recurso'
            });
        }

        console.log('✅ Rol autorizado:', req.usuario.rol);
        next();
    };
};

module.exports = {
    authenticateToken,
    requireRole
};