const jwt = require("jsonwebtoken");
const User = require("../models/user");

const authMiddleware = async (req, res, next) => {
    const authHeader = req.header("Authorization");
    
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ message: "No token provided or invalid format" });
    }

    const token = authHeader.split(" ")[1];

    if (!token) {
        return res.status(401).json({ message: "No token, authorization denied" });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Verify user still exists in database
        const user = await User.findById(decoded.id);
        if (!user) {
            return res.status(401).json({ message: "User not found, token invalid" });
        }

        // Attach user info to request
        req.user = {
            id: decoded.id,
            gmail: decoded.gmail,
            role: decoded.role
        };
        
        next();
    } catch (err) {
        if (err.name === "TokenExpiredError") {
            return res.status(401).json({ message: "Token expired" });
        }
        if (err.name === "JsonWebTokenError") {
            return res.status(401).json({ message: "Invalid token" });
        }
        console.error('Auth middleware error:', err);
        return res.status(500).json({ message: "Server error in authentication" });
    }
};

// Middleware to check if user is admin
const adminMiddleware = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        return res.status(403).json({ message: "Admin access required" });
    }
};

module.exports = {
    authMiddleware,
    adminMiddleware
};