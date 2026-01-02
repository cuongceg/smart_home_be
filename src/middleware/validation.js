const { body, validationResult } = require('express-validator');

// Middleware to check validation errors
const checkValidation = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            message: "Validation failed",
            errors: errors.array()
        });
    }
    next();
};

// Validation rules for user registration
const validateRegister = [
    body('gmail')
        .isEmail()
        .withMessage('Invalid email address')
        .normalizeEmail(),
    body('password')
        .isLength({ min: 6 })
        .withMessage('Password must be at least 6 characters long'),
    body('username')
        .trim()
        .isLength({ min: 1 })
        .withMessage('Username must be at least 1 character long'),
    checkValidation
];

// Validation rules for login
const validateLogin = [
    body('gmail')
        .isEmail()
        .withMessage('Invalid email address')
        .normalizeEmail(),
    body('password')
        .notEmpty()
        .withMessage('Password is required'),
    checkValidation
];

// Validation rules for updating profile
const validateUpdateProfile = [
    body('username')
        .optional()
        .trim()
        .isLength({ min: 1 })
        .withMessage('Username must be at least 1 character long'),
    body('gmail')
        .optional()
        .isEmail()
        .withMessage('Invalid email address')
        .normalizeEmail(),
    checkValidation
];

// Validation rules for changing password
const validateChangePassword = [
    body('currentPassword')
        .notEmpty()
        .withMessage('Current password is required'),
    body('newPassword')
        .isLength({ min: 6 })
        .withMessage('New password must be at least 6 characters long'),
    body('confirmPassword')
        .custom((value, { req }) => {
            if (value !== req.body.newPassword) {
                throw new Error('Confirm password does not match');
            }
            return true;
        }),
    checkValidation
];

// Validation rules for forgot password
const validateForgotPassword = [
    body('gmail')
        .isEmail()
        .withMessage('Invalid email address'),
    checkValidation
];

// Validation rules for reset password
const validateResetPassword = [
    body('newPassword')
        .isLength({ min: 6 })
        .withMessage('New password must be at least 6 characters long'),
    body('confirmPassword')
        .custom((value, { req }) => {
            if (value !== req.body.newPassword) {
                throw new Error('Confirm password does not match');
            }
            return true;
        }),
    checkValidation
];

// Validation rules for user profile update
const validateUserProfileUpdate = [
    body('username')
        .optional()
        .trim()
        .isLength({ min: 1, max: 50 })
        .withMessage('Username must be between 1 and 50 characters'),
    body('oldPassword')
        .optional()
        .notEmpty()
        .withMessage('Old password cannot be empty when provided'),
    body('newPassword')
        .optional()
        .isLength({ min: 6 })
        .withMessage('New password must be at least 6 characters long')
        .custom((value, { req }) => {
            if (value && !req.body.oldPassword) {
                throw new Error('Old password is required when updating password');
            }
            return true;
        }),
    checkValidation
];

// Validation rules for admin updating user
const validateAdminUpdateUser = [
    body('username')
        .optional()
        .trim()
        .isLength({ min: 1, max: 50 })
        .withMessage('Username must be between 1 and 50 characters'),
    body('gmail')
        .optional()
        .isEmail()
        .withMessage('Invalid email address')
        .normalizeEmail(),
    body('is_active')
        .optional()
        .isBoolean()
        .withMessage('is_active must be a boolean value'),
    checkValidation
];

module.exports = {
    validateRegister,
    validateLogin,
    validateUpdateProfile,
    validateChangePassword,
    validateForgotPassword,
    validateResetPassword,
    validateUserProfileUpdate,
    validateAdminUpdateUser,
    checkValidation
};