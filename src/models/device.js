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

    static async findAll() {
        const query = `
        SELECT 
            d.id,
            d.controller_key,
            d.room,
            d.name,
            d.type,
            d.config,
            d.created_at,
            d.updated_at,
            c.owner_id,
            c.name as controller_name,
            u.username as owner_username,
            u.gmail as owner_gmail
        FROM devices d
        JOIN controllers c ON d.controller_key = c.controller_key
        JOIN users u ON c.owner_id = u.id
        WHERE c.is_active = true
        ORDER BY d.room, d.name
    `;

        const result = await pool.query(query);
        return result.rows;
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
            SELECT DISTINCT d.*, 
                   CASE 
                       WHEN c.owner_id = $1 THEN 'owner'
                       ELSE 'member'
                   END as access_type
            FROM devices d
            JOIN controllers c ON d.controller_key = c.controller_key
            LEFT JOIN device_members dm ON d.id = dm.device_id
            WHERE (c.owner_id = $1 OR dm.user_id = $1) 
                AND c.is_active = true
            ORDER BY d.room, d.name
        `;
        const result = await pool.query(query, [userId]);
        return result.rows;
    }

    static async findByRoom(userId, room) {
        const query = `
            SELECT DISTINCT d.*,
                   CASE 
                       WHEN c.owner_id = $1 THEN 'owner'
                       ELSE 'member'
                   END as access_type
            FROM devices d
            JOIN controllers c ON d.controller_key = c.controller_key
            LEFT JOIN device_members dm ON d.id = dm.device_id
            WHERE (c.owner_id = $1 OR dm.user_id = $1) 
                AND d.room = $2 
                AND c.is_active = true
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

    static async checkAccess(deviceId, userId) {
        const query = `
            SELECT d.id
            FROM devices d
            JOIN controllers c ON d.controller_key = c.controller_key
            LEFT JOIN device_members dm ON d.id = dm.device_id
            WHERE d.id = $1 
                AND (c.owner_id = $2 OR dm.user_id = $2)
                AND c.is_active = true
        `;
        const result = await pool.query(query, [deviceId, userId]);
        return result.rows.length > 0;
    }

    static async getStatsByRoom(userId) {
        const query = `
            SELECT d.room, COUNT(DISTINCT d.id) as count
            FROM devices d
            JOIN controllers c ON d.controller_key = c.controller_key
            LEFT JOIN device_members dm ON d.id = dm.device_id
            WHERE (c.owner_id = $1 OR dm.user_id = $1) 
                AND c.is_active = true
            GROUP BY d.room
            ORDER BY d.room
        `;
        const result = await pool.query(query, [userId]);
        return result.rows;
    }

    static async getStatsByType(userId) {
        const query = `
            SELECT d.type, COUNT(DISTINCT d.id) as count
            FROM devices d
            JOIN controllers c ON d.controller_key = c.controller_key
            LEFT JOIN device_members dm ON d.id = dm.device_id
            WHERE (c.owner_id = $1 OR dm.user_id = $1) 
                AND c.is_active = true
            GROUP BY d.type
            ORDER BY d.type
        `;
        const result = await pool.query(query, [userId]);
        return result.rows;
    }

    // Thêm tính năng Share nhiều thiết bị
    static async shareDevices(ownerId, targetUserId, deviceIds) {
        const client = await pool.connect();
        
        try {
            await client.query('BEGIN');

            // Kiểm tra xem ownerId có thực sự là chủ sở hữu của TẤT CẢ các deviceIds
            const ownershipCheckQuery = `
                SELECT d.id
                FROM devices d
                JOIN controllers c ON d.controller_key = c.controller_key
                WHERE d.id = ANY($1) AND c.owner_id = $2 AND c.is_active = true
            `;
            const ownershipResult = await client.query(ownershipCheckQuery, [deviceIds, ownerId]);
            
            if (ownershipResult.rows.length !== deviceIds.length) {
                throw new Error('User does not own all specified devices');
            }

            // Kiểm tra user nhận share có tồn tại không
            const userCheckQuery = `
                SELECT id FROM users WHERE id = $1 AND is_active = true
            `;
            const userResult = await client.query(userCheckQuery, [targetUserId]);
            
            if (userResult.rows.length === 0) {
                throw new Error('Target user not found or inactive');
            }

            // Insert hàng loạt vào bảng device_members (sử dụng ON CONFLICT để tránh duplicate)
            const shareQuery = `
                INSERT INTO device_members (device_id, user_id)
                SELECT unnest($1::uuid[]), $2::uuid
                ON CONFLICT (device_id, user_id) DO NOTHING
                RETURNING device_id
            `;
            const shareResult = await client.query(shareQuery, [deviceIds, targetUserId]);

            await client.query('COMMIT');
            
            return {
                success: true,
                sharedDevices: shareResult.rows.length,
                totalDevices: deviceIds.length,
                message: `Successfully shared ${shareResult.rows.length} devices with user`
            };

        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    // Hàm để lấy danh sách user được share device cụ thể
    static async getDeviceMembers(deviceId, ownerId) {
        const query = `
            SELECT u.id, u.username, u.gmail, dm.added_at
            FROM device_members dm
            JOIN users u ON dm.user_id = u.id
            JOIN devices d ON dm.device_id = d.id
            JOIN controllers c ON d.controller_key = c.controller_key
            WHERE dm.device_id = $1 AND c.owner_id = $2 AND c.is_active = true
            ORDER BY dm.added_at DESC
        `;
        const result = await pool.query(query, [deviceId, ownerId]);
        return result.rows;
    }

    static async getUsersByDeviceId(deviceId) {
        const query = `
            SELECT DISTINCT u.id, u.fcm_token
            FROM devices d
            JOIN device_members dm ON dm.device_id = d.id
            JOIN users u ON u.id = dm.user_id
            WHERE d.controller_key = $1
            AND u.is_active = true
            AND u.fcm_token IS NOT NULL   
        `;
        const result = await pool.query(query, [deviceId]);
        return result.rows;
    }

    // Hàm để revoke quyền truy cập device
    static async revokeDeviceAccess(deviceId, ownerId, targetUserId) {
        const client = await pool.connect();
        
        try {
            await client.query('BEGIN');

            // Kiểm tra ownership
            const ownershipCheckQuery = `
                SELECT d.id
                FROM devices d
                JOIN controllers c ON d.controller_key = c.controller_key
                WHERE d.id = $1 AND c.owner_id = $2 AND c.is_active = true
            `;
            const ownershipResult = await client.query(ownershipCheckQuery, [deviceId, ownerId]);
            
            if (ownershipResult.rows.length === 0) {
                throw new Error('Device not found or user does not own this device');
            }

            // Remove access
            const revokeQuery = `
                DELETE FROM device_members
                WHERE device_id = $1 AND user_id = $2
                RETURNING device_id
            `;
            const revokeResult = await client.query(revokeQuery, [deviceId, targetUserId]);

            await client.query('COMMIT');
            
            return {
                success: true,
                revoked: revokeResult.rows.length > 0,
                message: revokeResult.rows.length > 0 ? 'Access revoked successfully' : 'No access found to revoke'
            };

        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    // Thêm hàm để giữ nguyên checkOwnership cho những trường hợp chỉ cần check owner
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
}

module.exports = Device;
