const { pool } = require('../config/database');

class Controller {
    static async create(data) {
        const { owner_id, name, controller_key, mac_address, location } = data;
        
        let query, values;
        
        if (location) {
            // Use ST_SetSRID(ST_MakePoint()) for proper PostGIS format
            query = `
                INSERT INTO controllers (owner_id, name, controller_key, mac_address, location)
                VALUES ($1, $2, $3, $4, ST_SetSRID(ST_MakePoint($5, $6), 4326))
                RETURNING id, owner_id, name, controller_key, mac_address, 
                         ST_AsGeoJSON(location)::json as location, 
                         is_active, created_at, updated_at
            `;
            values = [owner_id, name, controller_key, mac_address, location.coordinates[0], location.coordinates[1]];
        } else {
            query = `
                INSERT INTO controllers (owner_id, name, controller_key, mac_address)
                VALUES ($1, $2, $3, $4)
                RETURNING id, owner_id, name, controller_key, mac_address, 
                         ST_AsGeoJSON(location)::json as location, 
                         is_active, created_at, updated_at
            `;
            values = [owner_id, name, controller_key, mac_address];
        }

        const result = await pool.query(query, values);
        return result.rows[0];
    }

    static async findById(id) {
        const query = `
            SELECT id, owner_id, name, controller_key, mac_address, 
                   ST_AsGeoJSON(location)::json as location, 
                   is_active, created_at, updated_at
            FROM controllers 
            WHERE id = $1
        `;
        const result = await pool.query(query, [id]);
        return result.rows[0];
    }

    static async findByMacAddress(mac_address) {
        const query = `
            SELECT id, owner_id, name, controller_key, mac_address, 
                   ST_AsGeoJSON(location)::json as location, 
                   is_active, created_at, updated_at
            FROM controllers 
            WHERE mac_address = $1
        `;
        const result = await pool.query(query, [mac_address]);
        return result.rows[0];
    }

    static async findByOwnerId(owner_id) {
        const query = `
            SELECT id, owner_id, name, controller_key, mac_address, 
                   ST_AsGeoJSON(location)::json as location, 
                   is_active, created_at, updated_at
            FROM controllers 
            WHERE owner_id = $1 
            ORDER BY created_at DESC
        `;
        const result = await pool.query(query, [owner_id]);
        return result.rows;
    }

    static async findByControllerKey(controller_key) {
        const query = `
            SELECT id, owner_id, name, controller_key, mac_address, 
                   ST_AsGeoJSON(location)::json as location, 
                   is_active, created_at, updated_at
            FROM controllers 
            WHERE controller_key = $1 AND is_active = true
        `;
        const result = await pool.query(query, [controller_key]);
        return result.rows[0];
    }

    static async update(id, data) {
        const { name, controller_key, mac_address, location, is_active } = data;
        
        // Build dynamic query
        const updates = [];
        const values = [];
        let paramCount = 1;

        if (name !== undefined) {
            updates.push(`name = $${paramCount++}`);
            values.push(name);
        }

        if (controller_key !== undefined) {
            updates.push(`controller_key = $${paramCount++}`);
            values.push(controller_key);
        }

        if (mac_address !== undefined) {
            updates.push(`mac_address = $${paramCount++}`);
            values.push(mac_address);
        }

        if (location !== undefined) {
            if (location === null) {
                updates.push(`location = NULL`);
            } else {
                updates.push(`location = ST_SetSRID(ST_MakePoint($${paramCount++}, $${paramCount++}), 4326)`);
                values.push(location.coordinates[0], location.coordinates[1]);
            }
        }

        if (is_active !== undefined) {
            updates.push(`is_active = $${paramCount++}`);
            values.push(is_active);
        }

        if (updates.length === 0) {
            throw new Error('No fields to update');
        }

        values.push(id);
        
        const query = `
            UPDATE controllers 
            SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP
            WHERE id = $${paramCount}
            RETURNING id, owner_id, name, controller_key, mac_address, 
                     ST_AsGeoJSON(location)::json as location, 
                     is_active, created_at, updated_at
        `;

        const result = await pool.query(query, values);
        return result.rows[0];
    }

    static async delete(id) {
        const query = 'DELETE FROM controllers WHERE id = $1';
        const result = await pool.query(query, [id]);
        return result.rowCount > 0;
    }
}

module.exports = Controller;