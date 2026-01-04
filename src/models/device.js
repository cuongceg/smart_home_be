const { pool } = require('../config/database');

class Device {
    static async create(deviceData) {
        const { controller_key, room, name, type, config } = deviceData;
        const query = `
            INSERT INTO devices (controller_key, room, name, type, config)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING id, controller_key, room, name, type, config, created_at, updated_at
        `;
        const values = [controller_key, room, name, type, JSON.stringify(config || {})];
        const result = await pool.query(query, values);
        return result.rows[0];
    }

    static async findById(id) {
        const query = `
            SELECT d.*
            FROM devices d
            LEFT JOIN controllers c ON d.controller_key = c.controller_key
            WHERE d.id = $1
        `;
        const result = await pool.query(query, [id]);
        return result.rows[0];
    }

    static async findByUserId(userId) {
        const query = `
            SELECT d.*
            FROM devices d
            JOIN controllers c ON d.controller_key = c.controller_key
            WHERE c.owner_id = $1 AND c.is_active = true
            ORDER BY d.room, d.name
        `;
        const result = await pool.query(query, [userId]);
        return result.rows;
    }

    static async findByRoom(userId, room) {
        const query = `
            SELECT d.*
            FROM devices d
            JOIN controllers c ON d.controller_key = c.controller_key
            WHERE c.owner_id = $1 AND d.room = $2 AND c.is_active = true
            ORDER BY d.name
        `;
        const result = await pool.query(query, [userId, room]);
        return result.rows;
    }

    static async findByControllerKey(controller_key) {
        const query = `
            SELECT d.*, c.name as controller_name
            FROM devices d
            JOIN controllers c ON d.controller_key = c.controller_key
            WHERE d.controller_key = $1
            ORDER BY d.room, d.name
        `;
        const result = await pool.query(query, [controller_key]);
        return result.rows;
    }

    static async update(id, updateData) {
        const { room, name, type, config } = updateData;
        const query = `
            UPDATE devices
            SET room = COALESCE($2, room),
                name = COALESCE($3, name),
                type = COALESCE($4, type),
                config = COALESCE($5, config),
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $1
            RETURNING *
        `;
        const values = [id, room, name, type, config ? JSON.stringify(config) : undefined];
        const result = await pool.query(query, values);
        return result.rows[0];
    }

    static async delete(id) {
        const query = `
            DELETE FROM devices
            WHERE id = $1
            RETURNING id
        `;
        const result = await pool.query(query, [id]);
        return result.rows[0];
    }

    static async checkOwnership(deviceId, userId) {
        const query = `
            SELECT d.id
            FROM devices d
            JOIN controllers c ON d.controller_key = c.controller_key
            WHERE d.id = $1 AND c.owner_id = $2 AND c.is_active = true
        `;
        const result = await pool.query(query, [deviceId, userId]);
        return result.rows.length > 0;
    }

    static async getStatsByRoom(userId) {
        const query = `
            SELECT d.room, COUNT(*) as count
            FROM devices d
            JOIN controllers c ON d.controller_key = c.controller_key
            WHERE c.owner_id = $1 AND c.is_active = true
            GROUP BY d.room
            ORDER BY d.room
        `;
        const result = await pool.query(query, [userId]);
        return result.rows;
    }

    static async getStatsByType(userId) {
        const query = `
            SELECT d.type, COUNT(*) as count
            FROM devices d
            JOIN controllers c ON d.controller_key = c.controller_key
            WHERE c.owner_id = $1 AND c.is_active = true
            GROUP BY d.type
            ORDER BY d.type
        `;
        const result = await pool.query(query, [userId]);
        return result.rows;
    }
}

module.exports = Device;
