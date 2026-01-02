const rateLimit = require('express-rate-limit');

const forgotPasswordLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // Limit each IP to 5 requests per windowMs
    message: {
        message: 'Too many password reset requests, please try again later.'
    },
    standardHeaders: true,
    legacyHeaders: false,
});

module.exports = {
    forgotPasswordLimiter
};