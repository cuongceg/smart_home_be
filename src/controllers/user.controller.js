const User = require('../models/user');
const bcrypt = require('bcryptjs');

// Update user profile (username and/or password)
exports.updateProfile = async (req, res) => {
    try {
        const { username, oldPassword, newPassword } = req.body;
        const userId = req.user.id;

        // Validate that at least one field is provided
        if (!username && !newPassword) {
            return res.status(400).json({
                message: 'At least one field (username or newPassword) must be provided'
            });
        }

        // If updating password, old password is required
        if (newPassword && !oldPassword) {
            return res.status(400).json({
                message: 'Old password is required to update password'
            });
        }

        // Get current user
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                message: 'User not found'
            });
        }

        const updateData = {};

        // Update username if provided
        if (username) {
            updateData.username = username;
        }

        // Update password if provided
        if (newPassword) {
            // Verify old password
            const isOldPasswordValid = await bcrypt.compare(oldPassword, user.password);
            if (!isOldPasswordValid) {
                return res.status(400).json({
                    message: 'Invalid old password'
                });
            }

            // Hash new password
            const hashedNewPassword = await bcrypt.hash(newPassword, 10);
            updateData.password = hashedNewPassword;
            updateData.password_changed_at = new Date();
        }

        // Update user
        const updatedUser = await User.updateById(userId, updateData);
        
        if (!updatedUser) {
            return res.status(404).json({
                message: 'User not found'
            });
        }

        res.status(200).json({
            message: 'Profile updated successfully',
            user: {
                id: updatedUser.id,
                username: updatedUser.username,
                gmail: updatedUser.gmail,
                role: updatedUser.role,
                updated_at: updatedUser.updated_at
            }
        });

    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({
            message: 'Internal server error',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// Create a new user (Admin only)
exports.createUser = async (req, res) => {
    try {
        const { username, gmail, password } = req.body;

        // Validate request body
        if (!username || !gmail || !password) {
            return res.status(400).json({
                message: 'Username, Gmail, and Password are required'
            });
        }

        // Check if user already exists
        const existingUser = await User.findByEmail(gmail);
        if (existingUser) {
            return res.status(400).json({
                message: 'User with this email already exists'
            });
        }

        // Create new user
        const newUser = await User.create({
            username,
            gmail,
            password
        });

        res.status(201).json({
            message: 'User created successfully',
            user: {
                id: newUser.id,
                username: newUser.username,
                gmail: newUser.gmail,
                role: newUser.role,
                is_active: newUser.is_active,
                created_at: newUser.created_at,
                updated_at: newUser.updated_at
            }
        });

    } catch (error) {
        console.error('Create user error:', error);
        res.status(500).json({
            message: 'Internal server error',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// Get all users (Admin only)
exports.getAllUsers = async (req, res) => {
    try {
        const { limit = 100, offset = 0 } = req.query;
        
        const users = await User.findAll(parseInt(limit), parseInt(offset));
        const totalUsers = await User.count();

        res.status(200).json({
            message: 'Users retrieved successfully',
            data: users.map(user => ({
                id: user.id,
                username: user.username,
                gmail: user.gmail,
                role: user.role,
                is_active: user.is_active,
                created_at: user.created_at,
                updated_at: user.updated_at
            })),
            pagination: {
                total: totalUsers,
                limit: parseInt(limit),
                offset: parseInt(offset),
                hasMore: (parseInt(offset) + parseInt(limit)) < totalUsers
            }
        });

    } catch (error) {
        console.error('Get all users error:', error);
        res.status(500).json({
            message: 'Internal server error',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// Get user by ID (Admin only)
exports.getUserById = async (req, res) => {
    try {
        const { id } = req.params;

        if (!id) {
            return res.status(400).json({
                message: 'User ID is required'
            });
        }

        const user = await User.findById(id);
        
        if (!user) {
            return res.status(404).json({
                message: 'User not found'
            });
        }

        res.status(200).json({
            message: 'User retrieved successfully',
            user: {
                id: user.id,
                username: user.username,
                gmail: user.gmail,
                role: user.role,
                is_active: user.is_active,
                created_at: user.created_at,
                updated_at: user.updated_at
            }
        });

    } catch (error) {
        console.error('Get user by ID error:', error);
        res.status(500).json({
            message: 'Internal server error',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// Update user by ID (Admin only)
exports.updateUserById = async (req, res) => {
    try {
        const { id } = req.params;
        const { username, gmail, is_active } = req.body;

        if (!id) {
            return res.status(400).json({
                message: 'User ID is required'
            });
        }

        // Validate that at least one field is provided
        if (!username && !gmail && is_active === undefined) {
            return res.status(400).json({
                message: 'At least one field must be provided to update'
            });
        }

        // Check if email already exists (if updating email)
        if (gmail) {
            const emailExists = await User.emailExists(gmail, id);
            if (emailExists) {
                return res.status(400).json({
                    message: 'Gmail already exists'
                });
            }
        }

        const updateData = {};
        if (username) updateData.username = username;
        if (gmail) updateData.gmail = gmail;
        if (is_active !== undefined) updateData.is_active = is_active;

        const updatedUser = await User.updateById(id, updateData);
        
        if (!updatedUser) {
            return res.status(404).json({
                message: 'User not found'
            });
        }

        res.status(200).json({
            message: 'User updated successfully',
            user: {
                id: updatedUser.id,
                username: updatedUser.username,
                gmail: updatedUser.gmail,
                role: updatedUser.role,
                is_active: updatedUser.is_active,
                updated_at: updatedUser.updated_at
            }
        });

    } catch (error) {
        console.error('Update user by ID error:', error);
        res.status(500).json({
            message: 'Internal server error',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// Delete user by ID (Admin only)
exports.deleteUserById = async (req, res) => {
    try {
        const { id } = req.params;

        if (!id) {
            return res.status(400).json({
                message: 'User ID is required'
            });
        }

        // Prevent admin from deleting themselves
        if (id === req.user.id) {
            return res.status(400).json({
                message: 'Cannot delete your own account'
            });
        }

        const deletedUser = await User.deleteById(id);
        
        if (!deletedUser) {
            return res.status(404).json({
                message: 'User not found'
            });
        }

        res.status(200).json({
            message: 'User deleted successfully',
            deletedUser: {
                id: deletedUser.id,
                username: deletedUser.username,
                gmail: deletedUser.gmail
            }
        });

    } catch (error) {
        console.error('Delete user by ID error:', error);
        res.status(500).json({
            message: 'Internal server error',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// Get current user profile
exports.getProfile = async (req, res) => {
    try {
        const userId = req.user.id;
        
        const user = await User.findById(userId);
        
        if (!user) {
            return res.status(404).json({
                message: 'User not found'
            });
        }

        res.status(200).json({
            message: 'Profile retrieved successfully',
            user: {
                id: user.id,
                username: user.username,
                gmail: user.gmail,
                role: user.role,
                created_at: user.created_at,
                updated_at: user.updated_at
            }
        });

    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({
            message: 'Internal server error',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};
