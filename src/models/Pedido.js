const Database = require('../config/database');

class Pedido {
    constructor() {
        this.database = new Database();
        this.initializeDatabase();
    }

    async initializeDatabase() {
        try {
            await this.database.createPool();
        } catch (error) {
            console.error('Error al inicializar la base de datos en Pedido:', error);
        }
    }

    async obtenerTodos() {
        try {
            const pool = this.database.getPool();
            const query = `
                SELECT p.*, u.nombre as nombre_usuario, u.correo as email 
                FROM pedidos p
                LEFT JOIN usuarios u ON p.usuario_id = u.id
                ORDER BY p.creacion DESC
            `;
            const [rows] = await pool.execute(query);
            return rows;
        } catch (error) {
            console.error('Error al obtener pedidos:', error);
            throw error;
        }
    }

    async obtenerPorId(id) {
        try {
            const pool = this.database.getPool();
            const query = `
                SELECT p.*, u.nombre as nombre_usuario, u.correo as email 
                FROM pedidos p
                LEFT JOIN usuarios u ON p.usuario_id = u.id
                WHERE p.id = ?
            `;
            const [rows] = await pool.execute(query, [id]);
            return rows.length > 0 ? rows[0] : null;
        } catch (error) {
            console.error('Error al obtener pedido por ID:', error);
            throw error;
        }
    }

    async obtenerPorUsuario(usuarioId) {
        try {
            const pool = this.database.getPool();
            const query = `
                SELECT * FROM pedidos 
                WHERE usuario_id = ? 
                ORDER BY creacion DESC
            `;
            const [rows] = await pool.execute(query, [usuarioId]);
            return rows;
        } catch (error) {
            console.error('Error al obtener pedidos por usuario:', error);
            throw error;
        }
    }

    async crear(pedido) {
        try {
            const pool = this.database.getPool();
            const query = `
                INSERT INTO pedidos (usuario_id, producto_id, nombre_producto,
                categoria_producto, cantidad, estado)
                VALUES (?, ?, ?, ?, ?, ?)
            `;
            const [result] = await pool.execute(query, [
                pedido.usuario_id,
                pedido.producto_id,
                pedido.nombre_producto,
                pedido.categoria_producto,
                pedido.cantidad,
                pedido.estado || 'pendiente'
            ]);

            return { id: result.insertId, ...pedido };
        } catch (error) {
            console.error('Error al crear pedido:', error);
            throw error;
        }
    }

    async crearMultiples(pedidos) {
        const pool = this.database.getPool();
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();

            const resultados = [];
            for (const pedido of pedidos) {
                const query = `
                    INSERT INTO pedidos (usuario_id, producto_id, nombre_producto,
                    categoria_producto, cantidad, estado)
                    VALUES (?, ?, ?, ?, ?, ?)
                `;
                const [result] = await connection.execute(query, [
                    pedido.usuario_id,
                    pedido.producto_id,
                    pedido.nombre_producto,
                    pedido.categoria_producto,
                    pedido.cantidad,
                    pedido.estado || 'pendiente'
                ]);

                resultados.push({ id: result.insertId, ...pedido });
            }

            await connection.commit();
            return resultados;
        } catch (error) {
            await connection.rollback();
            console.error('Error al crear múltiples pedidos:', error);
            throw error;
        } finally {
            connection.release();
        }
    }

    async actualizarEstado(id, estado) {
        try {
            const pool = this.database.getPool();
            const estadosValidos = ['pendiente', 'enviado', 'entregado', 'cancelado'];
            if (!estadosValidos.includes(estado)) {
                throw new Error('Estado no válido');
            }

            const query = 'UPDATE pedidos SET estado = ? WHERE id = ?';
            const [result] = await pool.execute(query, [estado, id]);

            if (result.affectedRows === 0) {
                throw new Error('Pedido no encontrado');
            }

            return await this.obtenerPorId(id);
        } catch (error) {
            console.error('Error al actualizar estado del pedido:', error);
            throw error;
        }
    }

    async eliminar(id) {
        try {
            const pool = this.database.getPool();
            const query = 'DELETE FROM pedidos WHERE id = ?';
            const [result] = await pool.execute(query, [id]);
            return result.affectedRows > 0;
        } catch (error) {
            console.error('Error al eliminar pedido:', error);
            throw error;
        }
    }

    async obtenerEstadisticas() {
        try {
            const pool = this.database.getPool();
            const query = `
                SELECT 
                    estado,
                    COUNT(*) as cantidad,
                    SUM(cantidad) as total_productos
                FROM pedidos 
                GROUP BY estado
            `;
            const [rows] = await pool.execute(query);
            return rows;
        } catch (error) {
            console.error('Error al obtener estadísticas de pedidos:', error);
            throw error;
        }
    }
}

module.exports = Pedido;
