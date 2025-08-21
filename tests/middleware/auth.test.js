const jwt = require('jsonwebtoken');
const { authenticateToken, requireRole } = require('../../src/middleware/auth');

// Mock de JWT
jest.mock('jsonwebtoken');

describe('Auth Middleware', () => {
    let req, res, next;

    beforeEach(() => {
        req = {
            headers: {}
        };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };
        next = jest.fn();
        
        // Configurar JWT_SECRET para las pruebas
        process.env.JWT_SECRET = 'test-secret-key';
        
        // Limpiar mocks
        jest.clearAllMocks();
    });

    afterEach(() => {
        delete process.env.JWT_SECRET;
    });

    describe('authenticateToken', () => {
        test('should return 401 when no authorization header is provided', () => {
            authenticateToken(req, res, next);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'Token de acceso requerido'
            });
            expect(next).not.toHaveBeenCalled();
        });

        test('should return 401 when authorization header is malformed', () => {
            req.headers['authorization'] = 'InvalidHeader';

            authenticateToken(req, res, next);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'Token de acceso requerido'
            });
            expect(next).not.toHaveBeenCalled();
        });

        test('should return 500 when JWT_SECRET is not configured', () => {
            delete process.env.JWT_SECRET;
            req.headers['authorization'] = 'Bearer valid-token';

            authenticateToken(req, res, next);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'Error de configuración del servidor'
            });
            expect(next).not.toHaveBeenCalled();
        });

        test('should return 403 when token is invalid', () => {
            req.headers['authorization'] = 'Bearer invalid-token';
            jwt.verify.mockImplementation((token, secret, callback) => {
                const error = new Error('Invalid token');
                error.name = 'JsonWebTokenError';
                callback(error, null);
            });

            authenticateToken(req, res, next);

            expect(jwt.verify).toHaveBeenCalledWith('invalid-token', 'test-secret-key', expect.any(Function));
            expect(res.status).toHaveBeenCalledWith(403);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'Token inválido - inicia sesión nuevamente',
                error: 'JsonWebTokenError'
            });
            expect(next).not.toHaveBeenCalled();
        });

        test('should call next() when token is valid', () => {
            const mockUser = { id: 1, nombre: 'Test User', tipo: 'admin' };
            req.headers['authorization'] = 'Bearer valid-token';
            
            jwt.verify.mockImplementation((token, secret, callback) => {
                callback(null, mockUser);
            });

            authenticateToken(req, res, next);

            expect(jwt.verify).toHaveBeenCalledWith('valid-token', 'test-secret-key', expect.any(Function));
            expect(req.usuario).toEqual(mockUser);
            expect(next).toHaveBeenCalled();
            expect(res.status).not.toHaveBeenCalled();
            expect(res.json).not.toHaveBeenCalled();
        });

        test('should handle JWT verification error gracefully', () => {
            req.headers['authorization'] = 'Bearer expired-token';
            const jwtError = new Error('jwt expired');
            jwtError.name = 'TokenExpiredError';
            
            jwt.verify.mockImplementation((token, secret, callback) => {
                callback(jwtError, null);
            });

            authenticateToken(req, res, next);

            expect(res.status).toHaveBeenCalledWith(403);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'Token expirado - inicia sesión nuevamente',
                error: 'TokenExpiredError'
            });
            expect(next).not.toHaveBeenCalled();
        });
    });

    describe('requireRole', () => {
        beforeEach(() => {
            req = {
                usuario: null
            };
            res = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn()
            };
            next = jest.fn();
        });

        test('should return 401 if user is not authenticated', () => {
            const middleware = requireRole(['admin']);
            
            middleware(req, res, next);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'Usuario no autenticado'
            });
            expect(next).not.toHaveBeenCalled();
        });

        test('should return 403 if user role is insufficient', () => {
            req.usuario = { id: 1, rol: 'user' };
            const middleware = requireRole(['admin']);
            
            middleware(req, res, next);

            expect(res.status).toHaveBeenCalledWith(403);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'No tienes permisos para acceder a este recurso'
            });
            expect(next).not.toHaveBeenCalled();
        });

        test('should call next() if user has required role', () => {
            req.usuario = { id: 1, rol: 'admin' };
            const middleware = requireRole(['admin']);
            
            middleware(req, res, next);

            expect(next).toHaveBeenCalled();
            expect(res.status).not.toHaveBeenCalled();
            expect(res.json).not.toHaveBeenCalled();
        });

        test('should call next() if user has one of multiple required roles', () => {
            req.usuario = { id: 1, rol: 'moderator' };
            const middleware = requireRole(['admin', 'moderator']);
            
            middleware(req, res, next);

            expect(next).toHaveBeenCalled();
            expect(res.status).not.toHaveBeenCalled();
            expect(res.json).not.toHaveBeenCalled();
        });
    });
});
