const Database = require('../config/database');
const bcrypt = require('bcryptjs');

class Usuario {
    constructor() {
        this.db = new Database();
    }

    async obtenerTodos() {
        try {
            const query = `
                SELECT id, nombre, email, telefono, direccion, rol, fecha_registro 
                FROM usuarios 
                ORDER BY id
            `;
            return await this.db.query(query);
        } catch (error) {
            console.error('Error al obtener usuarios:', error);
            throw error;
        }
    }

    async obtenerPorId(id) {
        try {
            const query = `
                SELECT id, nombre, email, telefono, direccion, rol, fecha_registro 
                FROM usuarios 
                WHERE id = ?
            `;
            const usuarios = await this.db.query(query, [id]);
            return usuarios.length > 0 ? usuarios[0] : null;
        } catch (error) {
            console.error('Error al obtener usuario por ID:', error);
            throw error;
        }
    }

    async obtenerPorEmail(email) {
        try {
            const query = `
                SELECT id, nombre, email, telefono, direccion, rol, password, fecha_registro 
                FROM usuarios 
                WHERE email = ?
            `;
            const usuarios = await this.db.query(query, [email]);
            return usuarios.length > 0 ? usuarios[0] : null;
        } catch (error) {
            console.error('Error al obtener usuario por email:', error);
            throw error;
        }
    }

    async crear(usuario) {
        try {
            // Hashear la contraseña
            const saltRounds = 10;
            const hashedPassword = await bcrypt.hash(usuario.password, saltRounds);

            const query = `
                INSERT INTO usuarios (nombre, email, telefono, direccion, password, rol) 
                VALUES (?, ?, ?, ?, ?, ?)
            `;
            const result = await this.db.query(query, [
                usuario.nombre,
                usuario.email,
                usuario.telefono || null,
                usuario.direccion || null,
                hashedPassword,
                usuario.rol || 'cliente'
            ]);

            return { id: result.insertId, ...usuario, password: undefined };
        } catch (error) {
            console.error('Error al crear usuario:', error);
            throw error;
        }
    }

    async actualizar(id, usuario) {
        try {
            let query;
            let params;

            if (usuario.password) {
                // Si se proporciona una nueva contraseña
                const saltRounds = 10;
                const hashedPassword = await bcrypt.hash(usuario.password, saltRounds);

                query = `
                    UPDATE usuarios 
                    SET nombre = ?, email = ?, telefono = ?, direccion = ?, password = ?, rol = ? 
                    WHERE id = ?
                `;
                params = [
                    usuario.nombre,
                    usuario.email,
                    usuario.telefono,
                    usuario.direccion,
                    hashedPassword,
                    usuario.rol,
                    id
                ];
            } else {
                // Sin cambio de contraseña
                query = `
                    UPDATE usuarios 
                    SET nombre = ?, email = ?, telefono = ?, direccion = ?, rol = ? 
                    WHERE id = ?
                `;
                params = [
                    usuario.nombre,
                    usuario.email,
                    usuario.telefono,
                    usuario.direccion,
                    usuario.rol,
                    id
                ];
            }

            await this.db.query(query, params);
            return await this.obtenerPorId(id);
        } catch (error) {
            console.error('Error al actualizar usuario:', error);
            throw error;
        }
    }

    async eliminar(id) {
        try {
            const query = 'DELETE FROM usuarios WHERE id = ?';
            const result = await this.db.query(query, [id]);
            return result.affectedRows > 0;
        } catch (error) {
            console.error('Error al eliminar usuario:', error);
            throw error;
        }
    }

    async verificarPassword(password, hashedPassword) {
        try {
            return await bcrypt.compare(password, hashedPassword);
        } catch (error) {
            console.error('Error al verificar contraseña:', error);
            throw error;
        }
    }

    async login(email, password) {
        try {
            const usuario = await this.obtenerPorEmail(email);
            if (!usuario) {
                return null;
            }

            const passwordValida = await this.verificarPassword(password, usuario.password);
            if (!passwordValida) {
                return null;
            }

            // Retornar usuario sin la contraseña
            // eslint-disable-next-line no-unused-vars
            const { password: _password, ...usuarioSinPassword } = usuario;
            return usuarioSinPassword;
        } catch (error) {
            console.error('Error en login:', error);
            throw error;
        }
    }
}

module.exports = Usuario;
