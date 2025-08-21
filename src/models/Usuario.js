const Database = require('../config/database');

class Usuario {
    constructor() {
        this.database = new Database();
        this.initializeDatabase();
    }

    async initializeDatabase() {
        try {
            await this.database.createPool();
        } catch (error) {
            console.error('Error al inicializar la base de datos en Usuario:', error);
        }
    }

    async obtenerTodos() {
        try {
            const pool = this.database.getPool();
            const [rows] = await pool.execute('SELECT * FROM usuarios');
            return rows;
        } catch (error) {
            console.error('Error al obtener usuarios:', error);
            throw error;
        }
    }

    async obtenerPorId(id) {
        try {
            const pool = this.database.getPool();
            const [rows] = await pool.execute('SELECT * FROM usuarios WHERE id = ?', [id]);
            return rows[0] || null;
        } catch (error) {
            console.error('Error al obtener usuario por ID:', error);
            throw error;
        }
    }

    async obtenerPorEmail(email) {
        try {
            const pool = this.database.getPool();
            const [rows] = await pool.execute('SELECT * FROM usuarios WHERE correo = ?', [email]);
            return rows[0] || null;
        } catch (error) {
            console.error('Error al obtener usuario por email:', error);
            throw error;
        }
    }

    async login(correo, contrasena) {
        try {
            const pool = this.database.getPool();
            const [rows] = await pool.execute(
                'SELECT * FROM usuarios WHERE correo = ? AND contrasena = ?', 
                [correo, contrasena]
            );
            return rows[0] || null;
        } catch (error) {
            console.error('Error en login:', error);
            throw error;
        }
    }

    async crear(usuario) {
        try {
            const pool = this.database.getPool();
            
            // Verificar si el usuario ya existe
            const usuarioExistente = await this.obtenerPorEmail(usuario.correo);
            if (usuarioExistente) {
                throw new Error('El correo ya está registrado');
            }

            const [result] = await pool.execute(
                'INSERT INTO usuarios (nombre, apellido, correo, contrasena) VALUES (?, ?, ?, ?)',
                [usuario.nombre, usuario.apellido, usuario.correo, usuario.contrasena]
            );
            
            // Retornar el usuario creado con su ID
            return {
                id: result.insertId,
                nombre: usuario.nombre,
                apellido: usuario.apellido,
                correo: usuario.correo
            };
        } catch (error) {
            console.error('Error al crear usuario:', error);
            throw error;
        }
    }

    async actualizar(id, usuario) {
        try {
            const pool = this.database.getPool();
            
            let query = 'UPDATE usuarios SET nombre = ?, apellido = ?, correo = ?';
            let params = [usuario.nombre, usuario.apellido, usuario.correo];
            
            // Solo actualizar contraseña si se proporciona
            if (usuario.contrasena) {
                query += ', contrasena = ?';
                params.push(usuario.contrasena);
            }
            
            query += ' WHERE id = ?';
            params.push(id);
            
            const [result] = await pool.execute(query, params);
            
            if (result.affectedRows === 0) {
                throw new Error('Usuario no encontrado');
            }
            
            // Retornar el usuario actualizado
            return await this.obtenerPorId(id);
        } catch (error) {
            console.error('Error al actualizar usuario:', error);
            throw error;
        }
    }

    async eliminar(id) {
        try {
            const pool = this.database.getPool();
            const [result] = await pool.execute('DELETE FROM usuarios WHERE id = ?', [id]);
            return result.affectedRows > 0;
        } catch (error) {
            console.error('Error al eliminar usuario:', error);
            throw error;
        }
    }
}

module.exports = Usuario;