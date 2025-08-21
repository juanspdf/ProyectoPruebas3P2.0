const mysql = require('mysql2/promise');
require('dotenv').config();

class Database {
    constructor() {
        this.config = {
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'ecommerce-shop',
            port: process.env.DB_PORT || 3306,
            waitForConnections: true,
            connectionLimit: 10,
            queueLimit: 0
        };
        this.pool = null;
    }

    async createPool() {
        try {
            this.pool = mysql.createPool(this.config);
            console.log('Pool de conexiones MySQL creado correctamente');
            return this.pool;
        } catch (error) {
            console.error('Error al crear el pool de conexiones:', error);
            throw error;
        }
    }

    async getConnection() {
        try {
            if (!this.pool) {
                await this.createPool();
            }
            return await this.pool.getConnection();
        } catch (error) {
            console.error('Error al obtener conexión:', error);
            throw error;
        }
    }

    getPool() {
        if (!this.pool) {
            throw new Error('Pool de conexiones no inicializado. Llama a createPool() primero.');
        }
        return this.pool;
    }

    async query(sql, params = []) {
        let connection;
        try {
            connection = await this.getConnection();
            const [rows] = await connection.execute(sql, params);
            return rows;
        } catch (error) {
            console.error('Error en la consulta:', error);
            throw error;
        } finally {
            if (connection) connection.release();
        }
    }

    async close() {
        if (this.pool) {
            await this.pool.end();
            console.log('Pool de conexiones cerrado');
        }
    }
}

module.exports = Database;
