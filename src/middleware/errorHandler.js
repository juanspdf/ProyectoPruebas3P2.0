const errorHandler = (err, req, res, _next) => {
    console.error('Error capturado por middleware:', err);

    // Error de validación de JWT
    if (err.name === 'JsonWebTokenError') {
        return res.status(401).json({
            success: false,
            message: 'Token inválido',
            error: 'INVALID_TOKEN'
        });
    }

    // Error de token expirado
    if (err.name === 'TokenExpiredError') {
        return res.status(401).json({
            success: false,
            message: 'Token expirado',
            error: 'TOKEN_EXPIRED'
        });
    }

    // Error de conexión a la base de datos
    if (err.code === 'ECONNREFUSED' || err.code === 'ER_ACCESS_DENIED_ERROR') {
        return res.status(503).json({
            success: false,
            message: 'Error de conexión a la base de datos',
            error: 'DATABASE_CONNECTION_ERROR'
        });
    }

    // Error de sintaxis SQL
    if (err.code && err.code.startsWith('ER_')) {
        return res.status(500).json({
            success: false,
            message: 'Error en la base de datos',
            error: 'DATABASE_ERROR'
        });
    }

    // Error de validación
    if (err.name === 'ValidationError') {
        return res.status(400).json({
            success: false,
            message: 'Error de validación',
            errors: err.errors,
            error: 'VALIDATION_ERROR'
        });
    }

    // Error de entidad no encontrada
    if (err.message === 'Not Found') {
        return res.status(404).json({
            success: false,
            message: 'Recurso no encontrado',
            error: 'NOT_FOUND'
        });
    }

    // Error genérico
    res.status(err.status || 500).json({
        success: false,
        message: err.message || 'Error interno del servidor',
        error: 'INTERNAL_SERVER_ERROR',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
};

const notFound = (req, res, next) => {
    const error = new Error(`Ruta no encontrada - ${req.originalUrl}`);
    error.status = 404;
    next(error);
};

module.exports = {
    errorHandler,
    notFound
};
