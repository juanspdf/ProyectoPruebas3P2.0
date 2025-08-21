const Usuario = require('../models/Usuario');
const jwt = require('jsonwebtoken');

class UsuarioController {
    constructor() {
        this.usuarioModel = new Usuario();
    }

    async obtenerTodos(req, res) {
        try {
            const usuarios = await this.usuarioModel.obtenerTodos();
            res.json({
                success: true,
                usuarios: usuarios
            });
        } catch (error) {
            console.error('Error en UsuarioController.obtenerTodos:', error);
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
            const usuario = await this.usuarioModel.obtenerPorId(id);

            if (!usuario) {
                return res.status(404).json({
                    success: false,
                    message: 'Usuario no encontrado'
                });
            }

            res.json({
                success: true,
                usuario: usuario
            });
        } catch (error) {
            console.error('Error en UsuarioController.obtenerPorId:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor',
                error: error.message
            });
        }
    }

    async registrar(req, res) {
        try {
            const { nombre, apellido, email, correo, password, contrasena, telefono, direccion, rol } = req.body;

            // Soporte para ambos formatos de campos
            const userEmail = correo || email;
            const userPassword = contrasena || password;
            const userApellido = apellido || '';

            // Validaciones
            if (!nombre || !userEmail || !userPassword) {
                return res.status(400).json({
                    success: false,
                    message: 'Nombre, email y contraseña son campos obligatorios'
                });
            }

            // Validar formato de email
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(userEmail)) {
                return res.status(400).json({
                    success: false,
                    message: 'Formato de email inválido'
                });
            }

            // Validar longitud de contraseña
            if (userPassword.length < 6) {
                return res.status(400).json({
                    success: false,
                    message: 'La contraseña debe tener al menos 6 caracteres'
                });
            }

            // Verificar si el email ya existe
            const usuarioExistente = await this.usuarioModel.obtenerPorEmail(userEmail);
            if (usuarioExistente) {
                return res.status(409).json({
                    success: false,
                    message: 'El email ya está registrado'
                });
            }

            const nuevoUsuario = {
                nombre,
                apellido: userApellido,
                email: userEmail,
                correo: userEmail,
                password: userPassword,
                contrasena: userPassword,
                telefono,
                direccion,
                rol: rol || 'cliente'
            };

            const usuario = await this.usuarioModel.crear(nuevoUsuario);

            // Generar JWT automáticamente después del registro exitoso
            const token = jwt.sign(
                {
                    id: usuario.id,
                    email: usuario.correo,
                    rol: usuario.rol || 'cliente'
                },
                process.env.JWT_SECRET || 'secret-key',
                { expiresIn: '24h' }
            );

            res.status(201).json({
                success: true,
                message: 'Usuario registrado exitosamente',
                usuario: usuario,
                token: token
            });
        } catch (error) {
            console.error('Error en UsuarioController.registrar:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor',
                error: error.message
            });
        }
    }

    async login(req, res) {
        try {
            const { correo, contrasena, email, password } = req.body;

            // Soporte para ambos formatos de campos
            const userEmail = correo || email;
            const userPassword = contrasena || password;

            // Validaciones
            if (!userEmail || !userPassword) {
                return res.status(400).json({
                    success: false,
                    message: 'Email y contraseña son obligatorios'
                });
            }

            const usuario = await this.usuarioModel.login(userEmail, userPassword);

            if (!usuario) {
                return res.status(401).json({
                    success: false,
                    message: 'Credenciales inválidas'
                });
            }

            // Generar JWT
            const token = jwt.sign(
                {
                    id: usuario.id,
                    email: usuario.correo,
                    rol: usuario.rol
                },
                process.env.JWT_SECRET || 'secret-key',
                { expiresIn: '24h' }
            );

            res.json({
                success: true,
                message: 'Login exitoso',
                usuario: usuario,
                token: token
            });
        } catch (error) {
            console.error('Error en UsuarioController.login:', error);
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
            const { nombre, email, password, telefono, direccion, rol } = req.body;

            // Verificar si el usuario existe
            const usuarioExistente = await this.usuarioModel.obtenerPorId(id);
            if (!usuarioExistente) {
                return res.status(404).json({
                    success: false,
                    message: 'Usuario no encontrado'
                });
            }

            // Verificar si el email ya está en uso por otro usuario
            if (email && email !== usuarioExistente.email) {
                const emailEnUso = await this.usuarioModel.obtenerPorEmail(email);
                if (emailEnUso) {
                    return res.status(409).json({
                        success: false,
                        message: 'El email ya está en uso por otro usuario'
                    });
                }
            }

            // Validar formato de email si se proporciona
            if (email) {
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(email)) {
                    return res.status(400).json({
                        success: false,
                        message: 'Formato de email inválido'
                    });
                }
            }

            // Validar longitud de contraseña si se proporciona
            if (password && password.length < 6) {
                return res.status(400).json({
                    success: false,
                    message: 'La contraseña debe tener al menos 6 caracteres'
                });
            }

            const datosActualizacion = {
                nombre: nombre || usuarioExistente.nombre,
                email: email || usuarioExistente.email,
                telefono: telefono !== undefined ? telefono : usuarioExistente.telefono,
                direccion: direccion !== undefined ? direccion : usuarioExistente.direccion,
                rol: rol || usuarioExistente.rol
            };

            if (password) {
                datosActualizacion.password = password;
            }

            const usuario = await this.usuarioModel.actualizar(id, datosActualizacion);

            res.json({
                success: true,
                message: 'Usuario actualizado exitosamente',
                usuario: usuario
            });
        } catch (error) {
            console.error('Error en UsuarioController.actualizar:', error);
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

            // Verificar si el usuario existe
            const usuario = await this.usuarioModel.obtenerPorId(id);
            if (!usuario) {
                return res.status(404).json({
                    success: false,
                    message: 'Usuario no encontrado'
                });
            }

            const eliminado = await this.usuarioModel.eliminar(id);

            if (eliminado) {
                res.json({
                    success: true,
                    message: 'Usuario eliminado exitosamente'
                });
            } else {
                res.status(500).json({
                    success: false,
                    message: 'No se pudo eliminar el usuario'
                });
            }
        } catch (error) {
            console.error('Error en UsuarioController.eliminar:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor',
                error: error.message
            });
        }
    }

    async perfil(req, res) {
        try {
            // req.usuario viene del middleware de autenticación
            const usuario = await this.usuarioModel.obtenerPorId(req.usuario.id);

            if (!usuario) {
                return res.status(404).json({
                    success: false,
                    message: 'Usuario no encontrado'
                });
            }

            res.json({
                success: true,
                usuario: usuario
            });
        } catch (error) {
            console.error('Error en UsuarioController.perfil:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor',
                error: error.message
            });
        }
    }
}

module.exports = UsuarioController;
