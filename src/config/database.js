const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || '',
    user: process.env.POSTGRES_USER || '',
    password: process.env.POSTGRES_PASSWORD || '',
    max: 20, // Số lượng connection tối đa trong pool
    idleTimeoutMillis: 30000, // Thời gian chờ trước khi đóng connection không sử dụng
    connectionTimeoutMillis: 2000, // Thời gian chờ kết nối
});

// Test database connection
const testConnection = async () => {
    try {
        const client = await pool.connect();
        const result = await client.query('SELECT NOW()');
        client.release();
        console.log('Database connection test successful:', result.rows[0].now);
    } catch (err) {
        console.error('Database connection test failed:', err.message);
        throw err;
    }
};

module.exports = {
    pool,
    testConnection
};