const { errorHandler } = require('../../src/middleware/errorHandler');

describe('Error Handler Middleware', () => {
    let req, res, next;

    beforeEach(() => {
        req = {};
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };
        next = jest.fn();
        
        // Mock console.error to avoid noise in tests
        jest.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe('JWT Errors', () => {
        test('should handle JsonWebTokenError', () => {
            const error = new Error('Invalid token');
            error.name = 'JsonWebTokenError';

            errorHandler(error, req, res, next);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'Token inválido',
                error: 'INVALID_TOKEN'
            });
        });

        test('should handle TokenExpiredError', () => {
            const error = new Error('Token expired');
            error.name = 'TokenExpiredError';

            errorHandler(error, req, res, next);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'Token expirado',
                error: 'TOKEN_EXPIRED'
            });
        });
    });

    describe('Database Errors', () => {
        test('should handle ECONNREFUSED error', () => {
            const error = new Error('Connection refused');
            error.code = 'ECONNREFUSED';

            errorHandler(error, req, res, next);

            expect(res.status).toHaveBeenCalledWith(503);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'Error de conexión a la base de datos',
                error: 'DATABASE_CONNECTION_ERROR'
            });
        });

        test('should handle ER_ACCESS_DENIED_ERROR', () => {
            const error = new Error('Access denied');
            error.code = 'ER_ACCESS_DENIED_ERROR';

            errorHandler(error, req, res, next);

            expect(res.status).toHaveBeenCalledWith(503);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'Error de conexión a la base de datos',
                error: 'DATABASE_CONNECTION_ERROR'
            });
        });

        test('should handle ER_BAD_DB_ERROR', () => {
            const error = new Error('Unknown database');
            error.code = 'ER_BAD_DB_ERROR';

            errorHandler(error, req, res, next);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'Error en la base de datos',
                error: 'DATABASE_ERROR'
            });
        });

        test('should handle ER_DUP_ENTRY', () => {
            const error = new Error('Duplicate entry');
            error.code = 'ER_DUP_ENTRY';

            errorHandler(error, req, res, next);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'Error en la base de datos',
                error: 'DATABASE_ERROR'
            });
        });
    });

    describe('Validation Errors', () => {
        test('should handle validation error', () => {
            const error = new Error('Validation failed');
            error.name = 'ValidationError';
            error.errors = { field: 'required' };

            errorHandler(error, req, res, next);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'Error de validación',
                error: 'VALIDATION_ERROR',
                errors: { field: 'required' }
            });
        });

        test('should handle CastError', () => {
            const error = new Error('Cast to ObjectId failed');
            error.name = 'CastError';

            errorHandler(error, req, res, next);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'Cast to ObjectId failed',
                error: 'INTERNAL_SERVER_ERROR'
            });
        });
    });

    describe('Generic Errors', () => {
        test('should handle generic server error', () => {
            const error = new Error('Something went wrong');

            errorHandler(error, req, res, next);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'Something went wrong',
                error: 'INTERNAL_SERVER_ERROR'
            });
        });

        test('should handle error without message', () => {
            const error = {};

            errorHandler(error, req, res, next);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'Error interno del servidor',
                error: 'INTERNAL_SERVER_ERROR'
            });
        });
    });

    test('should log error to console', () => {
        const error = new Error('Test error');
        
        errorHandler(error, req, res, next);

        expect(console.error).toHaveBeenCalledWith('Error capturado por middleware:', error);
    });
});
