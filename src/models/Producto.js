const Database = require('../config/database');

class Producto {
    constructor() {
        this.database = new Database();
        this.initializeDatabase();
    }

    async initializeDatabase() {
        try {
            await this.database.createPool();
        } catch (error) {
            console.error('Error al inicializar la base de datos en Producto:', error);
        }
    }

    async obtenerTodos() {
        try {
            const pool = this.database.getPool();
            const query = `
                SELECT id, nombre, descripcion, categoria, subcategoria, precio, stock 
                FROM productos 
                ORDER BY id
            `;
            const [rows] = await pool.execute(query);

            // Agregar imagen a cada producto
            return rows.map(producto => ({
                ...producto,
                precio: parseFloat(producto.precio),
                stock: parseInt(producto.stock),
                imagen: this.obtenerRutaImagen(producto.id)
            }));
        } catch (error) {
            console.error('Error al obtener productos:', error);
            throw error;
        }
    }

    async obtenerPorId(id) {
        try {
            const pool = this.database.getPool();
            const query = `
                SELECT id, nombre, descripcion, categoria, subcategoria, precio, stock 
                FROM productos 
                WHERE id = ?
            `;
            const [rows] = await pool.execute(query, [id]);

            if (rows.length === 0) {
                return null;
            }

            const producto = rows[0];
            return {
                ...producto,
                precio: parseFloat(producto.precio),
                stock: parseInt(producto.stock),
                imagen: this.obtenerRutaImagen(producto.id)
            };
        } catch (error) {
            console.error('Error al obtener producto por ID:', error);
            throw error;
        }
    }

    async crear(producto) {
        try {
            const pool = this.database.getPool();
            const query = `
                INSERT INTO productos (nombre, descripcion, categoria, subcategoria, precio, stock) 
                VALUES (?, ?, ?, ?, ?, ?)
            `;
            const [result] = await pool.execute(query, [
                producto.nombre,
                producto.descripcion,
                producto.categoria,
                producto.subcategoria,
                producto.precio,
                producto.stock
            ]);

            return { id: result.insertId, ...producto };
        } catch (error) {
            console.error('Error al crear producto:', error);
            throw error;
        }
    }

    async actualizar(id, producto) {
        try {
            const pool = this.database.getPool();
            const query = `
                UPDATE productos
                SET nombre = ?, descripcion = ?, categoria = ?, subcategoria = ?,
                    precio = ?, stock = ?
                WHERE id = ?
            `;
            await pool.execute(query, [
                producto.nombre,
                producto.descripcion,
                producto.categoria,
                producto.subcategoria,
                producto.precio,
                producto.stock,
                id
            ]);

            return await this.obtenerPorId(id);
        } catch (error) {
            console.error('Error al actualizar producto:', error);
            throw error;
        }
    }

    async eliminar(id) {
        try {
            const pool = this.database.getPool();
            const query = 'DELETE FROM productos WHERE id = ?';
            const [result] = await pool.execute(query, [id]);
            return result.affectedRows > 0;
        } catch (error) {
            console.error('Error al eliminar producto:', error);
            throw error;
        }
    }

    async obtenerPorCategoria(categoria) {
        try {
            const pool = this.database.getPool();
            const query = `
                SELECT id, nombre, descripcion, categoria, subcategoria, precio, stock 
                FROM productos 
                WHERE categoria = ?
                ORDER BY nombre
            `;
            const [rows] = await pool.execute(query, [categoria]);

            return rows.map(producto => ({
                ...producto,
                precio: parseFloat(producto.precio),
                stock: parseInt(producto.stock),
                imagen: this.obtenerRutaImagen(producto.id)
            }));
        } catch (error) {
            console.error('Error al obtener productos por categoría:', error);
            throw error;
        }
    }

    obtenerRutaImagen(id) {
        const fs = require('fs');
        const path = require('path');
        const formatos = ['jpg', 'jpeg', 'png', 'webp'];

        for (const formato of formatos) {
            const rutaImagen = path.join(__dirname, '../../public/assets/images',
                `producto_${id}.${formato}`);
            if (fs.existsSync(rutaImagen)) {
                return `producto_${id}.${formato}`;
            }
        }

        return 'default.jpg';
    }
}

module.exports = Producto;
