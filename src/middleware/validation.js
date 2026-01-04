const { body, query, validationResult } = require('express-validator');

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

// Validation rules for controller creation
const validateCreateController = [
    body('name')
        .trim()
        .isLength({ min: 1, max: 100 })
        .withMessage('Controller name must be between 1 and 100 characters'),
    body('controller_key')
        .trim()
        .isLength({ min: 1, max: 50 })
        .withMessage('Controller key must be between 1 and 50 characters'),
    body('mac_address')
        .matches(/^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/)
        .withMessage('Invalid MAC address format (expected: XX:XX:XX:XX:XX:XX or XX-XX-XX-XX-XX-XX)'),
    body('latitude')
        .optional()
        .isFloat({ min: -90, max: 90 })
        .withMessage('Latitude must be a number between -90 and 90'),
    body('longitude')
        .optional()
        .isFloat({ min: -180, max: 180 })
        .withMessage('Longitude must be a number between -180 and 180'),
    checkValidation
];

// Validation rules for controller update
const validateUpdateController = [
    body('name')
        .optional()
        .trim()
        .isLength({ min: 1, max: 100 })
        .withMessage('Controller name must be between 1 and 100 characters'),
    body('controller_key')
        .optional()
        .trim()
        .isLength({ min: 1, max: 50 })
        .withMessage('Controller key must be between 1 and 50 characters'),
    body('mac_address')
        .optional()
        .matches(/^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/)
        .withMessage('Invalid MAC address format (expected: XX:XX:XX:XX:XX:XX or XX-XX-XX-XX-XX-XX)'),
    body('latitude')
        .optional()
        .isFloat({ min: -90, max: 90 })
        .withMessage('Latitude must be a number between -90 and 90'),
    body('longitude')
        .optional()
        .isFloat({ min: -180, max: 180 })
        .withMessage('Longitude must be a number between -180 and 180'),
    body('is_active')
        .optional()
        .isBoolean()
        .withMessage('is_active must be a boolean value'),
    checkValidation
];

// Validation rules for device creation
const validateCreateDevice = [
    body('controller_key')
        .trim()
        .isLength({ min: 1, max: 50 })
        .withMessage('Controller key must be between 1 and 50 characters'),
    body('room')
        .trim()
        .isLength({ min: 1, max: 50 })
        .withMessage('Room name must be between 1 and 50 characters'),
    body('name')
        .trim()
        .isLength({ min: 1, max: 100 })
        .withMessage('Device name must be between 1 and 100 characters'),
    body('type')
        .trim()
        .isLength({ min: 1, max: 50 })
        .withMessage('Device type must be between 1 and 50 characters'),
    body('config')
        .optional()
        .isObject()
        .withMessage('Config must be a valid JSON object'),
    checkValidation
];

// Validation rules for device update
const validateUpdateDevice = [
    body('room')
        .optional()
        .trim()
        .isLength({ min: 1, max: 50 })
        .withMessage('Room name must be between 1 and 50 characters'),
    body('name')
        .optional()
        .trim()
        .isLength({ min: 1, max: 100 })
        .withMessage('Device name must be between 1 and 100 characters'),
    body('type')
        .optional()
        .trim()
        .isLength({ min: 1, max: 50 })
        .withMessage('Device type must be between 1 and 50 characters'),
    body('config')
        .optional()
        .isObject()
        .withMessage('Config must be a valid JSON object'),
    checkValidation
];

// Validation rules for device data query
const validateDeviceDataQuery = [
    query('controllerKey')
        .notEmpty()
        .withMessage('Controller key is required')
        .isLength({ min: 1, max: 50 })
        .withMessage('Controller key must be between 1 and 50 characters'),
    query('from')
        .notEmpty()
        .withMessage('From date is required')
        .isISO8601({ strict: true })
        .withMessage('From date must be a valid ISO8601 datetime'),
    query('to')
        .notEmpty()
        .withMessage('To date is required')
        .isISO8601({ strict: true })
        .withMessage('To date must be a valid ISO8601 datetime'),
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
    checkValidation,
    validateCreateController,
    validateUpdateController,
    validateCreateDevice,
    validateUpdateDevice,
    validateDeviceDataQuery
};