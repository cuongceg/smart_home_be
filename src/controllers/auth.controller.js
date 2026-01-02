const User = require('../models/user');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const emailService = require('../services/emailService');

exports.register = async (req, res) => {
    try {
        const { username, password, gmail } = req.body;
        
        if (!username || !password || !gmail) {
            return res.status(400).json({ 
                message: 'Username, password, and gmail are required' 
            });
        }

        // Check if email already exists
        const existingUser = await User.findOne({ gmail });
        if (existingUser) {
            return res.status(400).json({ 
                message: 'Gmail already exists' 
            });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);
        
        // Create new user
        const user = await User.create({ 
            username, 
            password: hashedPassword, 
            gmail, 
            role: 'user' 
        });

        res.status(201).json({ 
            message: 'User registered successfully',
            user: {
                id: user.id,
                username: user.username,
                gmail: user.gmail,
                role: user.role,
                created_at: user.created_at
            }
        });
    } catch (error) {
        console.error('Register error:', error);
        res.status(500).json({ 
            message: 'Internal server error', 
            error: process.env.NODE_ENV === 'development' ? error.message : undefined 
        });
    }
};

exports.login = async (req, res) => {
    try {
        const { gmail, password } = req.body;
        
        if (!gmail || !password) {
            return res.status(400).json({ 
                message: 'Gmail and password are required' 
            });
        }

        // Search for user by email
        const user = await User.findOne({ gmail });
        if (!user) {
            return res.status(401).json({ 
                message: 'Invalid credentials' 
            });
        }

        // Check password
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ 
                message: 'Invalid credentials' 
            });
        }

        // Create JWT token
        const token = jwt.sign(
            { 
                id: user.id, 
                gmail: user.gmail,
                role: user.role 
            }, 
            process.env.JWT_SECRET, 
            { expiresIn: '1d' }
        );

        const expiryAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 1 day from now

        res.status(200).json({
            message: 'Login successful',
            user: {
                id: user.id,
                username: user.username,
                gmail: user.gmail,
                role: user.role
            },
            token: {
                access_token: token,
                expiry_at: expiryAt.toISOString()
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ 
            message: 'Internal server error', 
            error: process.env.NODE_ENV === 'development' ? error.message : undefined 
        });
    }
};

exports.forgotPassword = async (req, res) => {
    try {
        const { gmail } = req.body;
        
        if (!gmail) {
            return res.status(400).json({ 
                message: 'Gmail is required' 
            });
        }

        const user = await User.findOne({ gmail });
        if (!user) {
            // Avoid revealing whether the email exists
            return res.status(200).json({ 
                message: 'The password reset link has been sent to your email' 
            });
        }

        const resetToken = crypto.randomBytes(32).toString('hex');
        const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');
        const resetTokenExpiry = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes
        await User.saveResetToken(gmail, hashedToken, resetTokenExpiry);

        // Send mail with raw token
        try {
            await emailService.sendPasswordResetEmail(gmail, resetToken, user.username);
            
            res.status(200).json({
                message: 'Password reset link has been sent to your email',
                debug: process.env.NODE_ENV === 'development' ? {
                    resetToken: resetToken,
                    expiresAt: resetTokenExpiry
                } : undefined
            });
        } catch (emailError) {
            console.error('Email sending failed:', emailError);
            // Delete token if email sending fails
            await User.saveResetToken(gmail, null, null);
            
            res.status(500).json({
                message: 'Failed to send reset email. Please try again later.',
                error: process.env.NODE_ENV === 'development' ? emailError.message : undefined
            });
        }
        
    } catch (error) {
        console.error('Forgot password error:', error);
        res.status(500).json({ 
            message: 'Internal server error', 
            error: process.env.NODE_ENV === 'development' ? error.message : undefined 
        });
    }
};

exports.resetPassword = async (req, res) => {
    try {
        const { token } = req.params;
        const { newPassword } = req.body;
        
        if (!token || !newPassword) {
            return res.status(400).json({ 
                message: 'Token and new password are required' 
            });
        }
        const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
        const user = await User.findByResetToken(hashedToken);
        if (!user) {
            return res.status(400).json({ 
                message: 'Invalid or expired reset token' 
            });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        const updatedUser = await User.resetPassword(hashedToken, hashedPassword);
        if (!updatedUser) {
            return res.status(400).json({ 
                message: 'Failed to reset password. Token may have expired.' 
            });
        }

        res.status(200).json({
            message: 'Password has been reset successfully. You can now login with your new password.',
            user: {
                id: updatedUser.id,
                username: updatedUser.username,
                gmail: updatedUser.gmail
            }
        });
        
    } catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({ 
            message: 'Internal server error', 
            error: process.env.NODE_ENV === 'development' ? error.message : undefined 
        });
    }
};

exports.verifyResetToken = async (req, res) => {
    try {
        const { token } = req.params;
        
        if (!token) {
            return res.status(400).json({ 
                message: 'Token is required' 
            });
        }
        
        const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
        const user = await User.findByResetToken(hashedToken);
        if (!user) {
            return res.status(400).json({ 
                message: 'Invalid or expired reset token',
                valid: false 
            });
        }

        res.status(200).json({
            message: 'Token is valid',
            valid: true,
            user: {
                username: user.username,
                gmail: user.gmail
            }
        });
        
    } catch (error) {
        console.error('Verify reset token error:', error);
        res.status(500).json({ 
            message: 'Internal server error',
            valid: false,
            error: process.env.NODE_ENV === 'development' ? error.message : undefined 
        });
    }
};
