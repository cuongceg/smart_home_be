const { pool } = require('../config/database');
const { v4: uuidv4 } = require('uuid');

class User {
    constructor(userData) {
        this.id = userData.id;
        this.username = userData.username;
        this.gmail = userData.gmail;
        this.password = userData.password;
        this.role = userData.role || 'user';
        this.created_at = userData.created_at;
        this.updated_at = userData.updated_at;
    }

    // Create new user
    static async create({ username, gmail, password, role = 'user' }) {
        try {
            const id = uuidv4();
            const query = `
                INSERT INTO users (id, username, gmail, password, role)
                VALUES ($1, $2, $3, $4, $5)
                RETURNING *
            `;
            const values = [id, username, gmail, password, role];
            
            const result = await pool.query(query, values);
            return new User(result.rows[0]);
        } catch (error) {
            throw error;
        }
    }

    // Find user by email
    static async findOne(criteria) {
        try {
            let query = 'SELECT * FROM users WHERE ';
            let values = [];
            let conditions = [];

            // Build dynamic WHERE conditions
            Object.keys(criteria).forEach((key, index) => {
                conditions.push(`${key} = $${index + 1}`);
                values.push(criteria[key]);
            });

            query += conditions.join(' AND ');
            
            const result = await pool.query(query, values);
            
            if (result.rows.length === 0) {
                return null;
            }
            
            return new User(result.rows[0]);
        } catch (error) {
            throw error;
        }
    }

    // Find user by ID
    static async findById(id) {
        try {
            const query = 'SELECT * FROM users WHERE id = $1';
            const result = await pool.query(query, [id]);
            
            if (result.rows.length === 0) {
                return null;
            }
            
            return new User(result.rows[0]);
        } catch (error) {
            throw error;
        }
    }

    // Find all users
    static async findAll(limit = 100, offset = 0) {
        try {
            const query = `
                SELECT * FROM users 
                ORDER BY created_at DESC 
                LIMIT $1 OFFSET $2
            `;
            const result = await pool.query(query, [limit, offset]);
            
            return result.rows.map(row => new User(row));
        } catch (error) {
            throw error;
        }
    }

    static async updateById(id, updateData) {
        try {
            const fields = Object.keys(updateData);
            const values = Object.values(updateData);
            
            if (fields.length === 0) {
                throw new Error('No fields to update');
            }

            // Build dynamic SET clause
            const setClause = fields.map((field, index) => 
                `${field} = $${index + 2}`
            ).join(', ');

            const query = `
                UPDATE users 
                SET ${setClause}
                WHERE id = $1 
                RETURNING *
            `;
            
            const result = await pool.query(query, [id, ...values]);
            
            if (result.rows.length === 0) {
                return null;
            }
            
            return new User(result.rows[0]);
        } catch (error) {
            throw error;
        }
    }

    static async deleteById(id) {
        try {
            const query = 'DELETE FROM users WHERE id = $1 RETURNING *';
            const result = await pool.query(query, [id]);
            
            if (result.rows.length === 0) {
                return null;
            }
            
            return new User(result.rows[0]);
        } catch (error) {
            throw error;
        }
    }

    // Count all users
    static async count() {
        try {
            const query = 'SELECT COUNT(*) FROM users';
            const result = await pool.query(query);
            return parseInt(result.rows[0].count);
        } catch (error) {
            throw error;
        }
    }

    static async emailExists(gmail, excludeId = null) {
        try {
            let query = 'SELECT id FROM users WHERE gmail = $1';
            let values = [gmail];
            
            if (excludeId) {
                query += ' AND id != $2';
                values.push(excludeId);
            }
            
            const result = await pool.query(query, values);
            return result.rows.length > 0;
        } catch (error) {
            throw error;
        }
    }

    static async saveResetToken(gmail, token, expiresAt) {
        try {
            const query = `
                UPDATE users 
                SET password_reset_token = $1, password_reset_expires = $2, updated_at = NOW()
                WHERE gmail = $3 
                RETURNING *
            `;
            
            const result = await pool.query(query, [token, expiresAt, gmail]);
            
            if (result.rows.length === 0) {
                return null;
            }
            
            return new User(result.rows[0]);
        } catch (error) {
            throw error;
        }
    }

    // Find user by reset token
    static async findByResetToken(token) {
        try {
            const query = `
                SELECT * FROM users 
                WHERE password_reset_token = $1 
                AND password_reset_expires > NOW()
            `;
            const result = await pool.query(query, [token]);
            
            if (result.rows.length === 0) {
                return null;
            }
            
            return new User(result.rows[0]);
        } catch (error) {
            throw error;
        }
    }

    // Reset user password and delete reset token
    static async resetPassword(token, newPassword) {
        try {
            const query = `
                UPDATE users 
                SET password = $1, 
                    password_reset_token = NULL, 
                    password_reset_expires = NULL,
                    password_changed_at = NOW(),
                    updated_at = NOW()
                WHERE password_reset_token = $2 
                AND password_reset_expires > NOW()
                RETURNING *
            `;
            
            const result = await pool.query(query, [newPassword, token]);
            
            if (result.rows.length === 0) {
                return null;
            }
            
            return new User(result.rows[0]);
        } catch (error) {
            throw error;
        }
    }

    static async clearExpiredResetTokens() {
        try {
            const query = `
                UPDATE users 
                SET password_reset_token = NULL, 
                    password_reset_expires = NULL,
                    updated_at = NOW()
                WHERE password_reset_expires < NOW()
            `;
            
            const result = await pool.query(query);
            return result.rowCount;
        } catch (error) {
            throw error;
        }
    }
}

module.exports = User;