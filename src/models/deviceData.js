const { pool } = require('../config/database');

class DeviceData {
    /**
     * Get device data by time range for a specific controller
     * @param {string} userId - User ID from token
     * @param {string} controllerKey - Controller key to filter data
     * @param {string} from - Start time (ISO8601)
     * @param {string} to - End time (ISO8601)
     * @returns {Array} Device data records
     */
    static async getByTimeRange(userId, controllerKey, from, to) {
        const query = `
            SELECT 
                dd.time,
                dd.temperature,
                dd.humidity,
                dd.gas_concentration,
                dd.metadata
            FROM devices_data dd
            JOIN controllers c ON dd.controller_key = c.controller_key
            WHERE c.owner_id = $1 
                AND dd.controller_key = $2
                AND dd.time >= $3 
                AND dd.time <= $4
                AND c.is_active = true
            ORDER BY dd.time ASC
        `;
        const values = [userId, controllerKey, from, to];
        const result = await pool.query(query, values);
        return result.rows;
    }

    /**
     * Validate if user has access to the controller
     * @param {string} userId - User ID from token
     * @param {string} controllerKey - Controller key to validate
     * @returns {boolean} Access validation result
     */
    static async validateControllerAccess(userId, controllerKey) {
        const query = `
            SELECT 1
            FROM controllers
            WHERE owner_id = $1 AND controller_key = $2 AND is_active = true
        `;
        const result = await pool.query(query, [userId, controllerKey]);
        return result.rows.length > 0;
    }

    /**
     * Get all controller keys for a user
     * @param {string} userId - User ID from token
     * @returns {Array} Array of controller keys
     */
    static async getUserControllerKeys(userId) {
        const query = `
            SELECT controller_key, name
            FROM controllers
            WHERE owner_id = $1 AND is_active = true
            ORDER BY name
        `;
        const result = await pool.query(query, [userId]);
        return result.rows;
    }
}

module.exports = DeviceData;
